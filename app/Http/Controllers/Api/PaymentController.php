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
use App\Notifications\PaymentDisputeAlertNotification;
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
                    'checkout_mode' => $this->storeConfigService->get('globalpay_checkout_mode', 'hosted'),
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
     * Generate a client-side access token for Global Payments Drop-In UI / Hosted Fields.
     */
    public function generateGlobalPayToken(Request $request): JsonResponse
    {
        try {
            if (!$this->globalPayService->isConfigured() && !app()->environment('testing')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Global Payments is not configured in Admin Settings.',
                ], 422);
            }

            // Drop-In UI requires PMT_POST_Create_Single permission for tokenizing cards
            $tokenData = $this->globalPayService->getAccessToken(['PMT_POST_Create_Single']);

            return response()->json([
                'success' => true,
                'token' => $tokenData['token'],
                'environment' => $tokenData['environment'],
                'app_id' => $tokenData['app_id'],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to initialize payment gateway: ' . $e->getMessage(),
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
                $cleanCardNumber = preg_replace('/\D/', '', (string) $validated['card_number']);
                $cleanMonth = str_pad(preg_replace('/\D/', '', (string) ($validated['expiry_month'] ?? '')), 2, '0', STR_PAD_LEFT);
                $rawYear = preg_replace('/\D/', '', (string) ($validated['expiry_year'] ?? ''));
                $cleanYear = strlen($rawYear) > 2 ? substr($rawYear, -2) : str_pad($rawYear, 2, '0', STR_PAD_LEFT);
                $cleanCvv = preg_replace('/\D/', '', (string) ($validated['cvv'] ?? ''));

                $paymentMethodData = [
                    'entry_mode' => 'ECOM',
                    'card' => [
                        'number' => $cleanCardNumber,
                        'expiry_month' => $cleanMonth,
                        'expiry_year' => $cleanYear,
                        'cvv' => $cleanCvv,
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
     * Handles payment captures, chargebacks, disputes, fraud reviews, cancellations, and refunds.
     */
    public function webhook(Request $request): JsonResponse
    {
        $rawContent = $request->getContent();
        $payload = $request->all();

        Log::info('Global Payments Webhook received:', [
            'headers' => $request->headers->all(),
            'payload' => $payload,
        ]);

        // 1. Signature Verification (if secret configured)
        $configuredSecret = $this->storeConfigService->get('globalpay_webhook_secret') 
            ?: $this->globalPayService->getAppKey();
        $receivedSignature = $request->header('X-GP-Signature') 
            ?: $request->header('X-Webhook-Signature') 
            ?: $request->header('Signature');

        if (!empty($configuredSecret) && !empty($receivedSignature) && !app()->environment('testing')) {
            $expectedSignature = hash_hmac('sha256', $rawContent, $configuredSecret);
            $expectedBase64 = base64_encode(hash_hmac('sha256', $rawContent, $configuredSecret, true));

            if (!hash_equals($expectedSignature, $receivedSignature) && !hash_equals($expectedBase64, $receivedSignature)) {
                Log::warning('Global Payments Webhook: Invalid signature detected.');
                return response()->json(['error' => 'Invalid signature verification'], 401);
            }
        }

        // 2. Resolve Event Name & Normalized Type
        $event = strtolower(trim((string) ($payload['event'] ?? $payload['type'] ?? $payload['action'] ?? '')));
        
        // 3. Resolve Order Reference or Transaction ID
        $reference = $payload['data']['reference'] 
            ?? $payload['reference'] 
            ?? $payload['data']['order']['id'] 
            ?? $payload['order_id'] 
            ?? null;

        $transactionId = $payload['data']['id'] 
            ?? $payload['id'] 
            ?? $payload['data']['transaction_id'] 
            ?? null;

        $order = null;
        if (!empty($reference)) {
            $order = Order::where('order_number', $reference)->first();
        }
        if (!$order && !empty($transactionId)) {
            $order = Order::where('payment_transaction_id', $transactionId)->first();
        }

        if (!$order) {
            Log::info("Global Payments Webhook: No matching order found for reference: {$reference}, transaction: {$transactionId}");
            return response()->json(['success' => true, 'message' => 'Event logged, order not found']);
        }

        $previousStatus = $order->status;
        $previousPaymentStatus = $order->payment_status;

        // 4. Handle Specific Event Types
        
        // A. DISPUTES & CHARGEBACKS (Fraudulent / Customer Bank Disputes)
        $isDispute = str_contains($event, 'dispute') || str_contains($event, 'chargeback');
        if ($isDispute) {
            $disputeId = $payload['data']['dispute_id'] ?? $payload['dispute_id'] ?? $payload['data']['id'] ?? 'N/A';
            $reason = $payload['data']['reason'] ?? $payload['reason'] ?? $payload['data']['dispute_reason'] ?? 'Bank chargeback or fraud dispute initiated by cardholder';

            $noteEntry = "\n[Global Payments Alert " . now()->toDateTimeString() . "] PAYMENT DISPUTED / CHARGEBACK: Event={$event}, Dispute ID={$disputeId}, Reason={$reason}";

            $order->update([
                'payment_status' => 'disputed',
                'notes' => trim(($order->notes ?? '') . $noteEntry),
            ]);

            // Notify all Admins immediately with high-priority dispute alert
            User::query()->each(fn (User $admin) => $admin->notify(
                new PaymentDisputeAlertNotification($order, $event, (string) $disputeId, (string) $reason)
            ));

            // Realtime update to admin live dashboard
            $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);

            Log::warning("Global Payments Dispute processed for order #{$order->order_number}: {$reason}");
            return response()->json(['success' => true, 'message' => 'Dispute event processed and alert dispatched']);
        }

        // B. FRAUD & RISK ALERTS
        $isFraud = str_contains($event, 'fraud') || str_contains($event, 'risk');
        if ($isFraud) {
            $reason = $payload['data']['reason'] ?? $payload['reason'] ?? 'High risk / fraudulent activity flag from Global Payments risk engine';
            $noteEntry = "\n[Global Payments Alert " . now()->toDateTimeString() . "] FRAUD ALERT: Event={$event}, Reason={$reason}";

            $order->update([
                'payment_status' => 'disputed',
                'notes' => trim(($order->notes ?? '') . $noteEntry),
            ]);

            User::query()->each(fn (User $admin) => $admin->notify(
                new PaymentDisputeAlertNotification($order, $event, null, (string) $reason)
            ));

            $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);
            return response()->json(['success' => true, 'message' => 'Fraud alert processed']);
        }

        // C. REFUNDS & REVERSALS
        $isRefund = str_contains($event, 'refund') || str_contains($event, 'reversed');
        if ($isRefund) {
            $noteEntry = "\n[Global Payments " . now()->toDateTimeString() . "] Payment refunded/reversed via gateway.";
            $updateData = [
                'payment_status' => 'refunded',
                'notes' => trim(($order->notes ?? '') . $noteEntry),
            ];

            if ($order->status !== 'completed') {
                $updateData['status'] = 'cancelled';
            }

            $order->update($updateData);
            $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);
            return response()->json(['success' => true, 'message' => 'Refund processed']);
        }

        // D. CANCELLATIONS & PAYMENT DECLINES
        $isDecline = str_contains($event, 'failed') || str_contains($event, 'declined') || str_contains($event, 'cancelled') || str_contains($event, 'expired');
        if ($isDecline) {
            if ($order->payment_status !== 'paid') {
                $order->update([
                    'payment_status' => 'failed',
                    'status' => 'cancelled',
                ]);
                $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);
            }
            return response()->json(['success' => true, 'message' => 'Payment failure/cancellation recorded']);
        }

        // E. PAYMENT SUCCESSFUL / CAPTURED (Asynchronous Webhook Confirmation)
        $isSuccess = str_contains($event, 'success') || str_contains($event, 'captured') || str_contains($event, 'paid') || in_array($event, ['sale', 'payment.success']);
        if ($isSuccess) {
            if ($order->payment_status !== 'paid') {
                $order->update([
                    'payment_status' => 'paid',
                    'status' => 'pending',
                    'payment_transaction_id' => $transactionId ?: $order->payment_transaction_id,
                ]);

                // Notify admin and customer
                User::query()->each(fn (User $admin) => $admin->notify(new NewOrderPlacedNotification($order)));
                if ($order->customer) {
                    $order->customer->notify(new CustomerOrderConfirmationNotification($order));
                }

                $this->realtimeBroadcastService->broadcastOrderCreated($order);

                // Auto-queue receipt printing via Star CloudPRNT
                try {
                    $this->cloudPrntService->queueOrderReceipt($order);
                } catch (Exception $e) {
                    Log::error("Global Payments Webhook: Failed auto-queuing print job for #{$order->order_number}: " . $e->getMessage());
                }
            }
            return response()->json(['success' => true, 'message' => 'Payment capture confirmed']);
        }

        return response()->json(['success' => true, 'message' => 'Webhook received']);
    }
}
