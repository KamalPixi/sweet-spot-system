<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Image;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class ProductService
{
    /**
     * Get active categories ordered by sort sequence (including images).
     */
    public function getActiveCategories(?string $day = null)
    {
        return Category::where('status', true)
            ->availableOnDay($day)
            ->with('images')
            ->orderBy('order')
            ->get();
    }

    /**
     * Get products by category slug (including images).
     */
    public function getProductsByCategory(string $categorySlug, ?string $day = null)
    {
        $category = Category::where('slug', $categorySlug)
            ->where('status', true)
            ->availableOnDay($day)
            ->firstOrFail();

        return Product::where('category_id', $category->id)
            ->where('status', true)
            ->with(['images', 'variations.images'])
            ->get();
    }

    /**
     * Get details of a single product, including variations, related products, and all images.
     */
    public function getProductDetails(string $slug, ?string $day = null)
    {
        return Product::where('slug', $slug)
            ->where('status', true)
            ->whereHas('category', function ($query) use ($day) {
                $query->where('status', true)->availableOnDay($day);
            })
            ->with(['images', 'variations.images', 'category', 'relatedProducts' => function ($query) use ($day) {
                $query->where('status', true)
                    ->whereHas('category', function ($catQuery) use ($day) {
                        $catQuery->where('status', true)->availableOnDay($day);
                    })
                    ->with(['images', 'variations.images']);
            }])
            ->firstOrFail();
    }

    /**
     * Get the full menu catalog (categories with active products, variations, and images).
     */
    public function getMenuCatalog(?string $day = null)
    {
        return Category::where('status', true)
            ->availableOnDay($day)
            ->orderBy('order')
            ->with(['images', 'products' => function ($query) {
                $query->where('status', true)->with(['images', 'variations.images']);
            }])
            ->get();
    }

    /**
     * Create or update a Category (Admin).
     */
    public function saveCategory(array $data, ?int $id = null): Category
    {
        $slug = Str::slug($data['name']);
        
        $availableDays = null;
        if (isset($data['available_days'])) {
            if (is_string($data['available_days'])) {
                $decoded = json_decode($data['available_days'], true);
                $availableDays = is_array($decoded) ? $decoded : (empty($data['available_days']) ? null : explode(',', $data['available_days']));
            } elseif (is_array($data['available_days'])) {
                $availableDays = $data['available_days'];
            }
            if (is_array($availableDays)) {
                $availableDays = array_values(array_filter(array_map('trim', array_map('strtolower', $availableDays))));
                if (in_array('all', $availableDays) || empty($availableDays) || count($availableDays) >= 7) {
                    $availableDays = null; // null represents available all days
                }
            }
        }

        $categoryData = [
            'name' => $data['name'],
            'slug' => $slug,
            'icon' => $data['icon'] ?? null,
            'status' => filter_var($data['status'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'show_in_footer' => filter_var($data['show_in_footer'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'available_days' => $availableDays,
            'order' => (int) ($data['order'] ?? 0),
        ];

        if ($id) {
            $category = Category::findOrFail($id);
            $category->update($categoryData);
        } else {
            $category = Category::create($categoryData);
        }

        // Save polymorphic category image
        if (isset($data['image'])) {
            $category->images()->delete();
            if ($data['image']) {
                $category->images()->create([
                    'url' => $data['image'],
                    'is_primary' => true
                ]);
            }
        }

        return $category;
    }

    /**
     * Create or update a Product with variations, related products, and multiple images (Admin).
     */
    public function saveProduct(array $data, ?int $id = null): Product
    {
        return DB::transaction(function () use ($data, $id) {
            $slug = Str::slug($data['name']);
            $hasVariations = filter_var($data['has_variations'] ?? false, FILTER_VALIDATE_BOOLEAN);

            $productData = [
                'category_id' => $data['category_id'],
                'name' => $data['name'],
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'ingredients' => $data['ingredients'] ?? null,
                'status' => filter_var($data['status'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'is_home_treat' => filter_var($data['is_home_treat'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'has_variations' => $hasVariations,
                'base_price' => $hasVariations ? 0.00 : (float) ($data['base_price'] ?? 0.00),
                'base_weight' => $hasVariations ? null : ($data['base_weight'] ? (float) $data['base_weight'] : null),
            ];

            if ($id) {
                $product = Product::findOrFail($id);
                $product->update($productData);
            } else {
                $product = Product::create($productData);
            }

            // Save polymorphic product images
            if (isset($data['images']) && is_array($data['images'])) {
                // Bulk images sync
                $product->images()->delete();
                foreach ($data['images'] as $index => $imgUrl) {
                    if ($imgUrl) {
                        $product->images()->create([
                            'url' => $imgUrl,
                            'is_primary' => $index === 0
                        ]);
                    }
                }
            } elseif (isset($data['image'])) {
                // Single fallback image sync
                $product->images()->delete();
                if ($data['image']) {
                    $product->images()->create([
                        'url' => $data['image'],
                        'is_primary' => true
                    ]);
                }
            }

            // Sync related products
            if (isset($data['related_product_ids']) && is_array($data['related_product_ids'])) {
                $product->relatedProducts()->sync($data['related_product_ids']);
            } else {
                $product->relatedProducts()->detach();
            }

            // Sync/Recreate variations
            if ($hasVariations && isset($data['variations']) && is_array($data['variations'])) {
                // Delete variations that are not in the new payload
                $incomingIds = collect($data['variations'])->pluck('id')->filter()->toArray();
                $product->variations()->whereNotIn('id', $incomingIds)->delete();

                foreach ($data['variations'] as $v) {
                    $variationData = [
                        'name' => $v['name'],
                        'price' => (float) $v['price'],
                        'weight' => isset($v['weight']) ? (float) $v['weight'] : null,
                        'sku' => $v['sku'] ?? null,
                        'stock' => isset($v['stock']) ? (int) $v['stock'] : null,
                    ];

                    if (!empty($v['id'])) {
                        $variation = $product->variations()->findOrFail($v['id']);
                        $variation->update($variationData);
                    } else {
                        $variation = $product->variations()->create($variationData);
                    }

                    // Sync variation image
                    if (isset($v['image'])) {
                        $variation->images()->delete();
                        if ($v['image']) {
                            $variation->images()->create([
                                
                                'url' => $v['image'],
                                'is_primary' => true
                            ]);
                        }
                    }
                }
            } else {
                // If variations are disabled, delete any existing variations
                $product->variations()->delete();
            }

            return $product;
        });
    }
}
