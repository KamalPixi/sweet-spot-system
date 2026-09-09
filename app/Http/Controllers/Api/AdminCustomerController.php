<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminCustomerResource;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCustomerController extends Controller
{
    /**
     * List live customers for the admin portal.
     */
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $type = $request->query('type', 'all');
        $sort = $request->query('sort', 'recent');

        $query = Customer::query()
            ->whereNull('deleted_at')
            ->withCount('orders')
            ->withCount(['orders as completed_orders_count' => function ($q) {
                $q->where('status', 'completed');
            }])
            ->withSum('orders', 'total')
            ->withMax('orders', 'created_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($type === 'guest') {
            $query->where('is_guest', true);
        } elseif ($type === 'registered') {
            $query->where('is_guest', false);
        }

        match ($sort) {
            'name' => $query->orderBy('first_name')->orderBy('last_name'),
            'orders' => $query->orderByDesc('orders_count'),
            'spend' => $query->orderByDesc('orders_sum_total'),
            default => $query->orderByDesc('created_at'),
        };

        $customers = AdminCustomerResource::collection($query->get());

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total' => Customer::whereNull('deleted_at')->count(),
                    'guest' => Customer::whereNull('deleted_at')->where('is_guest', true)->count(),
                    'registered' => Customer::whereNull('deleted_at')->where('is_guest', false)->count(),
                    'with_orders' => Customer::whereNull('deleted_at')->whereHas('orders')->count(),
                ],
                'customers' => $customers,
            ],
        ]);
    }

    /**
     * Get details for a specific customer.
     */
    public function show(Customer $customer): JsonResponse
    {
        $customer->load(['orders' => function ($query) {
            $query->orderByDesc('created_at');
        }, 'orders.items', 'addresses']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $customer->id,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'is_guest' => $customer->is_guest,
                'created_at' => $customer->created_at,
                'orders_count' => $customer->orders()->count(),
                'orders_sum_total' => $customer->orders()->sum('total'),
                'orders' => $customer->orders,
                'addresses' => $customer->addresses,
            ],
        ]);
    }
}
