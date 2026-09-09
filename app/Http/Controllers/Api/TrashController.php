<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrashController extends Controller
{
    /**
     * List all soft-deleted records grouped by type.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'categories' => Category::onlyTrashed()
                    ->orderBy('deleted_at', 'desc')
                    ->get(),

                'products' => Product::onlyTrashed()
                    ->with(['category'])
                    ->orderBy('deleted_at', 'desc')
                    ->get(),

                'customers' => Customer::onlyTrashed()
                    ->orderBy('deleted_at', 'desc')
                    ->get(),
            ],
        ]);
    }

    /**
     * Restore a soft-deleted record by type and ID.
     */
    public function restore(string $type, int $id): JsonResponse
    {
        $model = $this->resolveModel($type, $id);

        if (! $model) {
            return response()->json([
                'success' => false,
                'message' => 'Record not found in trash.',
            ], 404);
        }

        $model->restore();

        return response()->json([
            'success' => true,
            'message' => ucfirst($type) . ' restored successfully.',
        ]);
    }

    /**
     * Permanently delete a soft-deleted record.
     */
    public function forceDelete(string $type, int $id): JsonResponse
    {
        $model = $this->resolveModel($type, $id);

        if (! $model) {
            return response()->json([
                'success' => false,
                'message' => 'Record not found in trash.',
            ], 404);
        }

        // Check if the record is involved in business (existing orders)
        if ($type === 'product') {
            $hasOrders = \Illuminate\Support\Facades\DB::table('order_items')
                ->where('product_id', $id)
                ->exists();
            if ($hasOrders) {
                return response()->json([
                    'success' => false,
                    'message' => 'This product cannot be permanently deleted because it is associated with existing orders in your store history.',
                ], 422);
            }
        }

        if ($type === 'category') {
            $productIds = Product::withTrashed()->where('category_id', $id)->pluck('id');
            $hasOrders = \Illuminate\Support\Facades\DB::table('order_items')
                ->whereIn('product_id', $productIds)
                ->exists();
            if ($hasOrders) {
                return response()->json([
                    'success' => false,
                    'message' => 'This category cannot be permanently deleted because its products are associated with existing orders in your store history.',
                ], 422);
            }
        }

        if ($type === 'customer') {
            $hasOrders = \Illuminate\Support\Facades\DB::table('orders')
                ->where('customer_id', $id)
                ->exists();
            if ($hasOrders) {
                return response()->json([
                    'success' => false,
                    'message' => 'This customer profile cannot be permanently deleted because they have existing orders in your store history.',
                ], 422);
            }
        }

        // For categories: also force-delete child products and their images
        if ($type === 'category') {
            /** @var Category $model */
            $model->products()->withTrashed()->each(function (Product $product) {
                $product->images()->delete();
                $product->variations()->delete();
                $product->forceDelete();
            });
            $model->images()->delete();
        }

        // For products: clean up images and variations
        if ($type === 'product') {
            /** @var Product $model */
            $model->images()->delete();
            $model->variations()->delete();
        }

        // For customers: remove addresses (cascade is safe here)
        if ($type === 'customer') {
            /** @var Customer $model */
            $model->addresses()->delete();
        }

        $model->forceDelete();

        return response()->json([
            'success' => true,
            'message' => ucfirst($type) . ' permanently deleted.',
        ]);
    }

    /**
     * Resolve the trashed model instance by type slug.
     */
    private function resolveModel(string $type, int $id): Category|Product|Customer|null
    {
        return match ($type) {
            'category' => Category::onlyTrashed()->find($id),
            'product'  => Product::onlyTrashed()->find($id),
            'customer' => Customer::onlyTrashed()->find($id),
            default    => null,
        };
    }
}
