<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProductService;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;

class ProductController extends Controller
{
    protected ProductService $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    /**
     * Get active categories (Storefront).
     */
    public function categories(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->productService->getActiveCategories(),
        ]);
    }

    /**
     * Get full menu catalog (Storefront).
     */
    public function menuCatalog(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->productService->getMenuCatalog(),
        ]);
    }

    /**
     * Get products by category slug (Storefront).
     */
    public function categoryProducts(string $slug): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->productService->getProductsByCategory($slug),
        ]);
    }

    /**
     * Get single product details (Storefront).
     */
    public function show(string $slug): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->productService->getProductDetails($slug),
        ]);
    }

    /**
     * List all active products (Storefront/Search).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::where('status', true)->with(['images', 'variations.images']);

        if ($request->has('category')) {
            $query->whereHas('category', function($q) use ($request) {
                $q->where('slug', $request->input('category'));
            });
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('is_home_treat')) {
            $query->where('is_home_treat', true);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    /* ----------------------------------------------------
     * ADMIN ENDPOINTS
     * ---------------------------------------------------- */

    /**
     * Get all categories for Admin (includes inactive).
     */
    public function adminCategories(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Category::with('images')->orderBy('order')->get(),
        ]);
    }

    /**
     * Get all products for Admin (includes inactive).
     */
    public function adminProducts(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->integer('per_page', 12), 1), 100);

        $query = Product::with(['category', 'variations.images', 'relatedProducts', 'images'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%")
                    ->orWhere('ingredients', 'ilike', "%{$search}%")
                    ->orWhereHas('category', function ($categoryQuery) use ($search) {
                        $categoryQuery->where('name', 'ilike', "%{$search}%");
                    })
                    ->orWhereHas('variations', function ($variationQuery) use ($search) {
                        $variationQuery->where('name', 'ilike', "%{$search}%")
                            ->orWhere('sku', 'ilike', "%{$search}%");
                    });
            });
        }

        if ($request->filled('category_id') && $request->input('category_id') !== 'all') {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status') === 'active');
        }

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('has_variations', $request->input('type') === 'variations');
        }

        $products = $query->paginate($perPage);
        $summaryQuery = Product::query();

        return response()->json([
            'success' => true,
            'data' => [
                'products' => $products->items(),
                'meta' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                    'from' => $products->firstItem(),
                    'to' => $products->lastItem(),
                ],
                'summary' => [
                    'total' => (clone $summaryQuery)->count(),
                    'active' => (clone $summaryQuery)->where('status', true)->count(),
                    'inactive' => (clone $summaryQuery)->where('status', false)->count(),
                    'with_variations' => (clone $summaryQuery)->where('has_variations', true)->count(),
                ],
                'categories' => Category::select('id', 'name')->orderBy('order')->orderBy('name')->get(),
                'related_options' => Product::select('id', 'name')->orderByDesc('created_at')->orderByDesc('id')->get(),
            ],
        ]);
    }

    /**
     * Create Category.
     */
    public function storeCategory(StoreCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        $category = $this->productService->saveCategory($data);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully.',
            'data' => $category->load('images'),
        ]);
    }

    /**
     * Update Category.
     */
    public function updateCategory(UpdateCategoryRequest $request, int $id): JsonResponse
    {
        $data = $request->validated();
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        $category = $this->productService->saveCategory($data, $id);

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully.',
            'data' => $category->load('images'),
        ]);
    }

    /**
     * Delete Category.
     */
    public function destroyCategory(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully.',
        ]);
    }

    /**
     * Create Product.
     */
    public function storeProduct(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['images'] = $this->resolveProductImages($request, $data);
        $data['variations'] = $this->resolveProductVariations($request, $data);

        $product = $this->productService->saveProduct($data);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully.',
            'data' => Product::with(['category', 'variations.images', 'relatedProducts', 'images'])->find($product->id),
        ]);
    }

    /**
     * Update Product.
     */
    public function updateProduct(UpdateProductRequest $request, int $id): JsonResponse
    {
        $data = $request->validated();
        $data['images'] = $this->resolveProductImages($request, $data);
        $data['variations'] = $this->resolveProductVariations($request, $data);

        $product = $this->productService->saveProduct($data, $id);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully.',
            'data' => Product::with(['category', 'variations.images', 'relatedProducts', 'images'])->find($product->id),
        ]);
    }

    /**
     * Toggle or update product status (Admin).
     */
    public function toggleProductStatus(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        if ($request->has('status')) {
            $product->status = $request->boolean('status');
        } else {
            $product->status = !$product->status;
        }
        $product->save();

        return response()->json([
            'success' => true,
            'message' => "Product status changed to " . ($product->status ? 'Active' : 'Inactive') . '.',
            'data' => Product::with(['category', 'variations.images', 'relatedProducts', 'images'])->find($product->id),
        ]);
    }

    /**
     * Delete Product.
     */
    public function destroyProduct(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully.',
        ]);
    }

    private function resolveProductImages(Request $request, array $data): array
    {
        $images = $data['existing_images'] ?? [];

        foreach ($request->file('images', []) as $image) {
            if ($image) {
                $images[] = $image->store('products', 'public');
            }
        }

        return array_values(array_filter($images));
    }

    private function resolveProductVariations(Request $request, array $data): array
    {
        $variations = $data['variations'] ?? [];
        $files = $request->file('variations', []);

        foreach ($variations as $index => $variation) {
            $file = data_get($files, "{$index}.image_file");

            if ($file) {
                $variations[$index]['image'] = $file->store('products/variations', 'public');
            } elseif (!empty($variation['existing_image'])) {
                $variations[$index]['image'] = $variation['existing_image'];
            } else {
                $variations[$index]['image'] = null;
            }
        }

        return $variations;
    }
}
