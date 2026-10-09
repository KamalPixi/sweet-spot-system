<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Services\GlobalPayService;
use App\Services\StoreConfigService;
use App\Services\RealtimeBroadcastService;
use App\Services\CloudPrntService;
use App\Notifications\NewOrderPlacedNotification;
use App\Notifications\CustomerOrderConfirmationNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Exception;

class PaymentController extends Controller
{
    protected GlobalPayService $globalPayService;
    protected StoreConfigService $storeConfigService;
    protected RealtimeBroadcastService $realtimeBroadcastService;
    protected CloudPrntService $cloudPrntService;

    public function __construct(
        GlobalPayService $globalPayService,
        StoreConfigService $storeConfigService,
        RealtimeBroadcastService $realtimeBroadcastService,
        CloudPrntService $cloudPrntService
    ) {
        $this->globalPayService = $globalPayService;
        $this->storeConfigService = $storeConfigService;
        $this->realtimeBroadcastService = $realtimeBroadcastService;
        $this->cloudPrntService = $cloudPrntService;
    }

    /**
     * Get active payment gateway configuration for storefront.
     */
    public function getProviders(): JsonResponse
    {
        $gateway = $this->storeConfigService->get('payment_gateway', 'stripe'); // 'stripe', 'globalpay', or 'both'
        $stripeKey = config('services.stripe.key') ?: env('STRIPE_KEY');

        return response()->json([
            'success' => true,
            'data' => [
                'active_gateway' => $gateway,
                'stripe' => [
                    'is_configured' => !empty($stripeKey) && !str_starts_with($stripeKey, '${'),
                    'publishable_key' => $stripeKey && !str_starts_with($stripeKey, '${') ? $stripeKey : null,
                ],
                'globalpay' => [
                    'is_configured' => $this->globalPayService->isConfigured(),
                    'app_id' => $this->globalPayService->getAppId(),
                    'environment' => $this->globalPayService->getEnvironment(),
                ],
            ],
        ]);
    }

    /**
     * Create or retrieve a Hosted Payment Page redirect URL for Global Payments.
     */
    public function createHostedLink(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_number' => 'required|string|exists:orders,order_number',
            'return_url' => 'nullable|string',
            'cancel_url' => 'nullable|string',
        ]);

        $order = Order::where('order_number', $validated['order_number'])->firstOrFail();

        $returnUrl = $validated['return_url'] ?? url('/payment/success?order=' . $order->order_number . '&provider=globalpay');
        $cancelUrl = $validated['cancel_url'] ?? url('/checkout?order=' . $order->order_number . '&cancelled=1');

        try {
            $hppUrl = $this->globalPayService->createHostedPaymentLink($order, $returnUrl, $cancelUrl);

            return response()->json([
                'success' => true,
                'hpp_url' => $hppUrl,
                'order_number' => $order->order_number,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create hosted payment link: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Process Global Payments charge for an existing order.
     */
    public function processGlobalPay(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_number' => 'required|string|exists:orders,order_number',
            'payment_token' => 'nullable|string',
            'card_number' => 'nullable|string',
            'expiry_month' => 'nullable|string',
            'expiry_year' => 'nullable|string',
            'cvv' => 'nullable|string',
            'cardholder_name' => 'nullable|string',
        ]);

        $order = Order::where('order_number', $validated['order_number'])->firstOrFail();

        if ($order->payment_status === 'paid') {
            return response()->json([
                'success' => true,
                'message' => 'Order is already marked as paid.',
                'order_number' => $order->order_number,
            ]);
        }

        try {
            $paymentMethodData = [];

            if (!empty($validated['payment_token'])) {
                $paymentMethodData = [
                    'id' => $validated['payment_token'],
                    'entry_mode' => 'ECOM',
                ];
            } elseif (!empty($validated['card_number'])) {
                $cleanCardNumber = preg_replace('/\D/', '', $validated['card_number']);
                $paymentMethodData = [
                    'entry_mode' => 'ECOM',
                    'card' => [
                        'number' => $cleanCardNumber,
                        'expiry_month' => str_pad($validated['expiry_month'], 2, '0', STR_PAD_LEFT),
                        'expiry_year' => strlen($validated['expiry_year']) === 2 ? '20' . $validated['expiry_year'] : $validated['expiry_year'],
                        'cvv' => $validated['cvv'],
                        'cardholder_name' => $validated['cardholder_name'] ?? ($order->customer ? $order->customer->first_name . ' ' . $order->customer->last_name : 'Valued Customer'),
                    ],
                ];
            } else {
                throw new Exception('Payment token or card details must be provided.');
            }

            $result = $this->globalPayService->processSale($order, $paymentMethodData);

            if ($result['success']) {
                $previousStatus = $order->status;
                $order->update([
                    'payment_status' => 'paid',
                    'payment_method' => 'globalpay',
                    'payment_transaction_id' => $result['transaction_id'] ?? 'gp_txn_' . \Illuminate\Support\Str::random(10),
                    'status' => 'pending',
                ]);

                // Trigger notifications and printing on successful payment
                User::query()->each(fn (User $admin) => $admin->notify(new NewOrderPlacedNotification($order)));
                if ($order->customer) {
                    $order->customer->notify(new CustomerOrderConfirmationNotification($order));
                }
                $this->realtimeBroadcastService->broadcastOrderCreated($order);

                try {
                    $this->cloudPrntService->queueOrderReceipt($order);
                } catch (Exception $e) {
                    logger()->error("Failed auto-queuing print job for order #{$order->order_number}: " . $e->getMessage());
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Payment processed successfully via Global Payments.',
                    'transaction_id' => $order->payment_transaction_id,
                    'order_number' => $order->order_number,
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment was not approved: ' . ($result['message'] ?? 'Declined by issuer'),
                ], 422);
            }
        } catch (Exception $e) {
            Log::error("Global Payments Processing Error: " . $e->getMessage(), ['order' => $order->order_number]);
            return response()->json([
                'success' => false,
                'message' => 'Payment processing failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Admin: Test payment gateway connection.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $provider = $request->input('provider', 'globalpay');

        if ($provider === 'globalpay') {
            $appId = $request->input('globalpay_app_id');
            $appKey = $request->input('globalpay_app_key');

            if ($appId) $this->storeConfigService->set('globalpay_app_id', $appId);
            if ($appKey) $this->storeConfigService->set('globalpay_app_key', $appKey);

            $result = $this->globalPayService->testConnection();
            return response()->json($result);
        } elseif ($provider === 'stripe') {
            $stripeSecret = $request->input('stripe_secret_key') 
                ?: config('services.stripe.secret') 
                ?: env('STRIPE_SECRET');

            if (empty($stripeSecret)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stripe Secret Key is required.',
                ]);
            }

            try {
                \Stripe\Stripe::setApiKey($stripeSecret);
                $account = \Stripe\Account::retrieve();
                return response()->json([
                    'success' => true,
                    'message' => "Successfully connected to Stripe! Account: " . ($account->email ?? $account->id ?? 'Active'),
                ]);
            } catch (Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stripe connection error: ' . $e->getMessage(),
                ]);
            }
        }

        return response()->json(['success' => false, 'message' => 'Unknown provider.'], 422);
    }

    /**
     * Global Payments Webhook endpoint.
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('Global Payments Webhook received:', $payload);

        // Handle transaction notifications
        $event = $payload['event'] ?? $payload['type'] ?? null;
        $reference = $payload['data']['reference'] ?? $payload['reference'] ?? null;

        if ($reference) {
            $order = Order::where('order_number', $reference)->first();
            if ($order && $order->payment_status !== 'paid') {
                if (in_array(strtoupper($event ?? ''), ['TRANSACTION_SUCCESS', 'SALE_SUCCESS', 'CAPTURED'])) {
                    $order->update([
                        'payment_status' => 'paid',
                        'status' => 'pending',
                    ]);
                    $this->realtimeBroadcastService->broadcastOrderCreated($order);
                }
            }
        }

        return response()->json(['success' => true]);
    }
}
