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
    public function getActiveCategories()
    {
        return Category::where('status', true)->with('images')->orderBy('order')->get();
    }

    /**
     * Get products by category slug (including images).
     */
    public function getProductsByCategory(string $categorySlug)
    {
        $category = Category::where('slug', $categorySlug)->where('status', true)->firstOrFail();
        return Product::where('category_id', $category->id)
            ->where('status', true)
            ->with(['images', 'variations.images'])
            ->get();
    }

    /**
     * Get details of a single product, including variations, related products, and all images.
     */
    public function getProductDetails(string $slug)
    {
        return Product::where('slug', $slug)
            ->where('status', true)
            ->with(['images', 'variations.images', 'relatedProducts' => function ($query) {
                $query->where('status', true)->with(['images', 'variations.images']);
            }])
            ->firstOrFail();
    }

    /**
     * Get the full menu catalog (categories with active products, variations, and images).
     */
    public function getMenuCatalog()
    {
        return Category::where('status', true)
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
        
        $categoryData = [
            'name' => $data['name'],
            'slug' => $slug,
            'icon' => $data['icon'] ?? null,
            'status' => filter_var($data['status'] ?? true, FILTER_VALIDATE_BOOLEAN),
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
