<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminOrderFilterRequest;
use App\Http\Requests\OrderReportRequest;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use App\Services\RealtimeBroadcastService;
use App\Models\Order;
use App\Models\User;
use App\Notifications\NewOrderPlacedNotification;
use App\Notifications\OrderStatusUpdatedNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;

class OrderController extends Controller
{
    protected OrderService $orderService;
    protected RealtimeBroadcastService $realtimeBroadcastService;

    public function __construct(OrderService $orderService, RealtimeBroadcastService $realtimeBroadcastService)
    {
        $this->orderService = $orderService;
        $this->realtimeBroadcastService = $realtimeBroadcastService;
    }

    /**
     * Create a new Order (Guest or Customer).
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $authCustomer = null;
            if ($request->user() && $request->user() instanceof \App\Models\Customer) {
                $authCustomer = $request->user();
            }

            $order = $this->orderService->createOrder($data, $authCustomer);
            $order->load(['items', 'customer', 'deliveryAddress']);

            // Create Stripe PaymentIntent if payment method is stripe
            $clientSecret = null;
            $stripeSecret = config('services.stripe.secret');

            if ($order->payment_method === 'stripe' || $order->payment_method === 'mock_stripe') {
                if ($stripeSecret && !str_starts_with($stripeSecret, 'sk_test_pudding_london_placeholder')) {
                    \Stripe\Stripe::setApiKey($stripeSecret);
                    
                    $intent = \Stripe\PaymentIntent::create([
                        'amount' => (int) round($order->total * 100), // in cents
                        'currency' => 'gbp',
                        'metadata' => [
                            'order_id' => $order->id,
                            'order_number' => $order->order_number,
                        ],
                    ]);

                    $order->update([
                        'payment_transaction_id' => $intent->id
                    ]);

                    $clientSecret = $intent->client_secret;
                } else {
                    // Fallback mock mode
                    $clientSecret = 'mock_secret_' . \Illuminate\Support\Str::random(32);
                    $order->update([
                        'payment_transaction_id' => 'mock_txn_' . \Illuminate\Support\Str::random(9)
                    ]);
                }
            }

            // Only notify admin and broadcast once payment is confirmed, not for awaiting_payment orders
            if ($order->status !== 'awaiting_payment') {
                User::query()->each(fn (User $admin) => $admin->notify(new NewOrderPlacedNotification($order)));
                if ($order->customer) {
                    $order->customer->notify(new \App\Notifications\CustomerOrderConfirmationNotification($order));
                }
                $this->realtimeBroadcastService->broadcastOrderCreated($order);
            }

            $responseData = (new OrderResource($order))->resolve($request);
            if ($clientSecret) {
                $responseData['client_secret'] = $clientSecret;
            }

            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully.',
                'data' => $responseData,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * List authenticated customer's orders.
     */
    public function index(Request $request): JsonResponse
    {
        $customer = $request->user();

        if (!$customer || !($customer instanceof \App\Models\Customer)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 401);
        }

        $baseQuery = Order::where('customer_id', $customer->id);
        $statusFilter = $request->query('status');
        $perPage = min(max((int) $request->query('per_page', 5), 1), 25);

        $activeCount = (clone $baseQuery)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->count();

        $completedCount = (clone $baseQuery)
            ->where('status', 'completed')
            ->count();

        $ordersQuery = (clone $baseQuery)
            ->with(['items', 'customer', 'deliveryAddress'])
            ->orderBy('created_at', 'desc');

        if ($statusFilter === 'completed') {
            $ordersQuery->where('status', 'completed');
        } elseif ($statusFilter === 'active') {
            $ordersQuery->whereNotIn('status', ['completed', 'cancelled']);
        }

        $orders = $ordersQuery->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => OrderResource::collection($orders->items())->resolve($request),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'per_page'     => $orders->perPage(),
                'total'        => $orders->total(),
                'active_count' => $activeCount,
                'completed_count' => $completedCount,
                'total_all' => $activeCount + $completedCount,
            ]
        ]);
    }

    /**
     * Show order details by Order Number (Supports guest tracking lookup).
     */
    public function show(string $orderNumber, Request $request): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->with(['items', 'customer', 'deliveryAddress'])
            ->firstOrFail();

        // Sync payment status with Stripe if it is still unpaid and is Stripe payment
        if ($order->payment_status === 'unpaid' && $order->payment_transaction_id && str_starts_with($order->payment_transaction_id, 'pi_')) {
            $stripeSecret = config('services.stripe.secret');
            if ($stripeSecret && !str_starts_with($stripeSecret, 'sk_test_pudding_london_placeholder')) {
                try {
                    \Stripe\Stripe::setApiKey($stripeSecret);
                    $intent = \Stripe\PaymentIntent::retrieve($order->payment_transaction_id);
                    if ($intent->status === 'succeeded') {
                        $previousStatus = $order->status;
                        $order->update([
                            'payment_status' => 'paid',
                            'status' => 'pending'
                        ]);
                        $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);
                    } elseif ($intent->status === 'requires_payment_method' || $intent->status === 'canceled') {
                        $previousStatus = $order->status;
                        $order->update([
                            'payment_status' => 'failed',
                            'status' => 'cancelled'
                        ]);
                        $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);
                    }
                } catch (Exception $e) {
                    logger()->error('Stripe Payment retrieval failed: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => (new OrderResource($order))->resolve($request),
        ]);
    }

    /* ----------------------------------------------------
     * ADMIN ENDPOINTS
     * ---------------------------------------------------- */

    /**
     * List all orders (Admin).
     */
    public function adminOrders(AdminOrderFilterRequest $request): JsonResponse
    {
        $query = Order::with(['items.product.category', 'customer', 'deliveryAddress'])->orderBy('created_at', 'desc');

        $statusFilter = $request->input('status', 'all');

        if ($statusFilter === 'incomplete') {
            // Show abandoned / failed payment orders for analytics
            $query->where(function ($q) {
                $q->where('status', 'awaiting_payment')
                  ->orWhere(function ($q2) {
                      $q2->where('status', 'cancelled')
                         ->whereIn('payment_status', ['unpaid', 'failed']);
                  });
            });
        } elseif ($statusFilter !== 'all') {
            $query->where('status', $statusFilter)
                  ->where('status', '!=', 'awaiting_payment');
        } else {
            // Default: exclude awaiting_payment (not yet paid) from main order list
            $query->where('status', '!=', 'awaiting_payment');
        }

        if ($request->has('type') && $request->input('type') !== 'all') {
            $query->where('type', $request->input('type'));
        }

        return response()->json([
            'success' => true,
            'data' => OrderResource::collection($query->get())->resolve($request),
        ]);
    }

    /**
     * Show a single order for admin detail pages.
     */
    public function adminOrderShow(string $orderNumber, Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || $user instanceof \App\Models\Customer) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $order = Order::where('order_number', $orderNumber)
            ->with(['items.product.category', 'customer', 'deliveryAddress'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => (new OrderResource($order))->resolve($request),
        ]);
    }

    /**
     * Update Order status or Payment status (Admin).
     */
    public function updateStatus(UpdateOrderStatusRequest $request, int $id): JsonResponse
    {
        $order = Order::with('customer')->findOrFail($id);
        $previousStatus = $order->status;

        if ($request->has('status')) {
            $order->status = $request->input('status');
        }

        if ($request->has('payment_status')) {
            $order->payment_status = $request->input('payment_status');
        }

        $order->save();

        if ($request->has('status') && $previousStatus !== $order->status && $order->customer) {
            $order->customer->notify(new OrderStatusUpdatedNotification($order, $previousStatus));
        }

        if ($request->has('status') || $request->has('payment_status')) {
            $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);
        }

        return response()->json([
            'success' => true,
            'message' => 'Order updated successfully.',
            'data' => (new OrderResource($order->load(['items', 'customer', 'deliveryAddress'])))->resolve($request),
        ]);
    }

    /**
     * Admin reports (Admin dashboard).
     */
    public function adminReports(OrderReportRequest $request): JsonResponse
    {
        $today = Carbon::today();
        $weekStart = Carbon::now()->startOfWeek();
        $reportData = $request->validated();
        [$periodStart, $periodEnd, $periodLabel] = $this->resolveReportRange($reportData);

        // Revenue
        $totalSales     = (float) Order::where('payment_status', 'paid')->sum('total');
        $todaySales     = (float) Order::where('payment_status', 'paid')->whereDate('created_at', $today)->sum('total');
        $thisWeekSales  = (float) Order::where('payment_status', 'paid')->where('created_at', '>=', $weekStart)->sum('total');

        $periodOrdersQuery = Order::query()->whereBetween('created_at', [$periodStart, $periodEnd]);
        $periodPaidOrdersQuery = Order::query()
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$periodStart, $periodEnd]);

        $periodSales = (float) (clone $periodPaidOrdersQuery)->sum('total');
        $periodOrders = (clone $periodOrdersQuery)->count();
        $periodPaidOrders = (clone $periodOrdersQuery)->where('payment_status', 'paid')->count();
        $periodUnpaidOrders = (clone $periodOrdersQuery)->where('payment_status', 'unpaid')->count();
        $periodFailedOrders = (clone $periodOrdersQuery)->where('payment_status', 'failed')->count();
        $periodCompletedOrders = (clone $periodOrdersQuery)->where('status', 'completed')->count();
        $periodCancelledOrders = (clone $periodOrdersQuery)->where('status', 'cancelled')->count();
        $periodAverageOrderValue = $periodPaidOrders > 0 ? round($periodSales / $periodPaidOrders, 2) : 0.00;
        $periodFulfillmentRate = $periodOrders > 0 ? round(($periodCompletedOrders / $periodOrders) * 100, 1) : 0.0;
        $periodCancelRate = $periodOrders > 0 ? round(($periodCancelledOrders / $periodOrders) * 100, 1) : 0.0;
        $periodItemsSold = (int) DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.payment_status', 'paid')
            ->whereBetween('orders.created_at', [$periodStart, $periodEnd])
            ->sum('order_items.quantity');

        // Order counts
        $totalOrders    = Order::count();
        $todayOrders    = Order::whereDate('created_at', $today)->count();
        $pendingOrders  = Order::where('status', 'pending')->count();
        $preparingOrders = Order::where('status', 'preparing')->count();
        $readyOrders    = Order::where('status', 'ready')->count();
        $completedOrders = Order::where('status', 'completed')->count();
        $cancelledOrders = Order::where('status', 'cancelled')->count();

        // Fulfillment type split
        $deliveryOrders    = Order::where('type', 'delivery')->count();
        $collectionOrders  = Order::where('type', 'collection')->count();

        // Customers
        $totalCustomers    = \App\Models\Customer::count();
        $guestCustomers    = \App\Models\Customer::where('is_guest', true)->count();
        $registeredCustomers = \App\Models\Customer::where('is_guest', false)->count();

        // Recent 6 orders for the live feed
        $recentOrders = Order::with(['customer'])
            ->orderBy('created_at', 'desc')
            ->limit(6)
            ->get()
            ->map(fn($o) => [
                'order_number'   => $o->order_number,
                'customer_name'  => trim(($o->customer?->first_name ?? '') . ' ' . ($o->customer?->last_name ?? '')),
                'type'           => $o->type,
                'total'          => (float) $o->total,
                'status'         => $o->status,
                'payment_status' => $o->payment_status,
                'created_at'     => $o->created_at,
            ]);

        // Sales by category
        $salesByCategory = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.payment_status', 'paid')
            ->select('categories.name as category', DB::raw('SUM(order_items.total) as total'), DB::raw('COUNT(DISTINCT orders.id) as order_count'))
            ->groupBy('categories.name')
            ->orderByDesc('total')
            ->get();

        // Top 5 selling products by quantity
        $topProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.payment_status', 'paid')
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_qty'), DB::raw('SUM(order_items.total) as revenue'))
            ->groupBy('products.name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        $periodTopProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.payment_status', 'paid')
            ->whereBetween('orders.created_at', [$periodStart, $periodEnd])
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_qty'), DB::raw('SUM(order_items.total) as revenue'))
            ->groupBy('products.name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        $periodSalesByCategory = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.payment_status', 'paid')
            ->whereBetween('orders.created_at', [$periodStart, $periodEnd])
            ->select('categories.name as category', DB::raw('SUM(order_items.total) as total'), DB::raw('COUNT(DISTINCT orders.id) as order_count'))
            ->groupBy('categories.name')
            ->orderByDesc('total')
            ->get();

        $periodSalesItems = DB::table('order_items')
            ->leftJoin('products', 'order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.payment_status', 'paid')
            ->whereBetween('orders.created_at', [$periodStart, $periodEnd])
            ->select(
                'order_items.product_id',
                'order_items.product_variation_id',
                'order_items.product_name',
                'order_items.variation_name',
                DB::raw("COALESCE(categories.name, 'Uncategorised') as category"),
                DB::raw('SUM(order_items.quantity) as quantity_sold'),
                DB::raw('SUM(order_items.total) as revenue'),
                DB::raw('COUNT(DISTINCT orders.id) as order_count'),
                DB::raw('AVG(order_items.price) as average_unit_price')
            )
            ->groupBy(
                'order_items.product_id',
                'order_items.product_variation_id',
                'order_items.product_name',
                'order_items.variation_name',
                'categories.name'
            )
            ->orderByDesc('revenue')
            ->get();

        $salesTrend = collect();
        $cursor = $periodStart->copy()->startOfDay();
        while ($cursor->lte($periodEnd)) {
            $dayStart = $cursor->copy()->startOfDay();
            $dayEnd = $cursor->copy()->endOfDay();
            $salesTrend->push([
                'date' => $cursor->toDateString(),
                'label' => $cursor->format('d M'),
                'sales' => (float) Order::where('payment_status', 'paid')->whereBetween('created_at', [$dayStart, $dayEnd])->sum('total'),
                'orders' => Order::whereBetween('created_at', [$dayStart, $dayEnd])->count(),
            ]);
            $cursor->addDay();
        }

        $collectionHours = Order::where('type', 'collection')
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->whereNotNull('collection_time')
            ->get()
            ->map(function ($order) {
                try {
                    return Carbon::parse($order->collection_time)->format('H:00');
                } catch (Exception $e) {
                    return null;
                }
            })
            ->filter()
            ->countBy()
            ->sortDesc()
            ->take(5)
            ->map(fn ($count, $slot) => [
                'slot' => $slot,
                'count' => $count,
            ])
            ->values();

        $periodFulfillmentSplit = [
            'delivery' => (clone $periodOrdersQuery)->where('type', 'delivery')->count(),
            'collection' => (clone $periodOrdersQuery)->where('type', 'collection')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'total_sales'          => $totalSales,
                'today_sales'          => $todaySales,
                'this_week_sales'      => $thisWeekSales,
                'total_orders'         => $totalOrders,
                'today_orders'         => $todayOrders,
                'total_customers'      => $totalCustomers,
                'guest_customers'      => $guestCustomers,
                'registered_customers' => $registeredCustomers,
                'orders_count' => [
                    'pending'   => $pendingOrders,
                    'preparing' => $preparingOrders,
                    'ready'     => $readyOrders,
                    'completed' => $completedOrders,
                    'cancelled' => $cancelledOrders,
                ],
                'fulfillment_split' => [
                    'delivery'   => $deliveryOrders,
                    'collection' => $collectionOrders,
                ],
                'recent_orders'      => $recentOrders,
                'sales_by_category'  => $salesByCategory,
                'top_products'       => $topProducts,
                'report_range' => [
                    'label' => $periodLabel,
                    'start' => $periodStart->toDateString(),
                    'end' => $periodEnd->toDateString(),
                ],
                'period' => [
                    'sales' => $periodSales,
                    'orders' => $periodOrders,
                    'average_order_value' => $periodAverageOrderValue,
                    'fulfillment_rate' => $periodFulfillmentRate,
                    'cancel_rate' => $periodCancelRate,
                    'paid_orders' => $periodPaidOrders,
                    'unpaid_orders' => $periodUnpaidOrders,
                    'failed_orders' => $periodFailedOrders,
                    'completed_orders' => $periodCompletedOrders,
                    'cancelled_orders' => $periodCancelledOrders,
                    'items_sold' => $periodItemsSold,
                    'unique_items_sold' => $periodSalesItems->count(),
                    'fulfillment_split' => $periodFulfillmentSplit,
                ],
                'sales_trend' => $salesTrend,
                'period_sales_by_category' => $periodSalesByCategory,
                'period_sales_items' => $periodSalesItems,
                'period_top_products' => $periodTopProducts,
                'collection_hours' => $collectionHours,
            ],
        ]);
    }

    private function resolveReportRange(array $requestData): array
    {
        $range = $requestData['range'] ?? '30d';
        $now = Carbon::now();

        return match ($range) {
            'today' => [$now->copy()->startOfDay(), $now->copy()->endOfDay(), 'Today'],
            '7d' => [$now->copy()->subDays(6)->startOfDay(), $now->copy()->endOfDay(), 'Last 7 Days'],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfDay(), 'This Month'],
            'custom' => [
                Carbon::parse($requestData['start_date'] ?? $now->copy()->subDays(29)->toDateString())->startOfDay(),
                Carbon::parse($requestData['end_date'] ?? $now->toDateString())->endOfDay(),
                'Custom Range',
            ],
            default => [$now->copy()->subDays(29)->startOfDay(), $now->copy()->endOfDay(), 'Last 30 Days'],
        };
    }

    /**
     * Handle Stripe Webhook integration.
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        \Illuminate\Support\Facades\Log::info('Stripe Webhook received payload: ' . $payload);
        $sigHeader = $request->header('Stripe-Signature');
        $endpointSecret = config('services.stripe.webhook_secret');

        try {
            if ($endpointSecret && $sigHeader) {
                $event = \Stripe\Webhook::constructEvent(
                    $payload, $sigHeader, $endpointSecret
                );
            } else {
                $data = json_decode($payload, true);
                $event = \Stripe\Event::constructFrom($data);
            }
        } catch (\UnexpectedValueException $e) {
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        switch ($event->type) {
            case 'payment_intent.succeeded':
                $paymentIntent = $event->data->object;
                $this->handlePaymentSucceeded($paymentIntent);
                break;
            case 'payment_intent.payment_failed':
                $paymentIntent = $event->data->object;
                $this->handlePaymentFailed($paymentIntent);
                break;
        }

        return response()->json(['success' => true]);
    }

    protected function handlePaymentSucceeded($paymentIntent)
    {
        $order = Order::where('payment_transaction_id', $paymentIntent->id)->first();
        if ($order && $order->payment_status !== 'paid') {
            $previousStatus = $order->status;
            $order->update([
                'payment_status' => 'paid',
                'status' => 'pending',
            ]);
            // Now that payment is confirmed, notify admin and broadcast
            if ($previousStatus === 'awaiting_payment') {
                User::query()->each(fn (User $admin) => $admin->notify(new NewOrderPlacedNotification($order)));
                if ($order->customer) {
                    $order->customer->notify(new \App\Notifications\CustomerOrderConfirmationNotification($order));
                }
                $this->realtimeBroadcastService->broadcastOrderCreated($order);
            } else {
                $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);
            }
        }
    }

    protected function handlePaymentFailed($paymentIntent)
    {
        $order = Order::where('payment_transaction_id', $paymentIntent->id)->first();
        if ($order && $order->payment_status !== 'paid') {
            $previousStatus = $order->status;
            $order->update([
                'payment_status' => 'failed',
                'status' => 'cancelled'
            ]);
            $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);
        }
    }
}
