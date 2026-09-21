<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\UberDirectService;
use App\Services\RealtimeBroadcastService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Exception;

class UberDirectController extends Controller
{
    protected UberDirectService $uberDirectService;
    protected RealtimeBroadcastService $realtimeBroadcastService;

    public function __construct(
        UberDirectService $uberDirectService,
        RealtimeBroadcastService $realtimeBroadcastService
    ) {
        $this->uberDirectService = $uberDirectService;
        $this->realtimeBroadcastService = $realtimeBroadcastService;
    }

    /**
     * Calculate Uber Direct delivery quote for a given address.
     */
    public function getQuote(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'address_line_1' => 'required|string',
            'address_line_2' => 'nullable|string',
            'city' => 'required|string',
            'postcode' => 'required|string',
        ]);

        try {
            $dropoff = [
                'street_address' => array_filter([$validated['address_line_1'], $validated['address_line_2'] ?? null]),
                'city' => $validated['city'],
                'postal_code' => $validated['postcode'],
                'country' => 'GB',
            ];

            $quote = $this->uberDirectService->getDeliveryQuote($dropoff);

            return response()->json([
                'success' => true,
                'data' => $quote,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Admin: Manually dispatch courier via chosen provider for an order.
     */
    public function dispatchOrder(Request $request, int $orderId): JsonResponse
    {
        $order = Order::findOrFail($orderId);

        if ($order->type !== 'delivery') {
            return response()->json([
                'success' => false,
                'message' => 'Only delivery orders can be dispatched via courier.',
            ], 400);
        }

        $provider = $request->input('provider', 'uber_direct');

        try {
            $result = $this->uberDirectService->createDelivery($order, $provider);
            $this->realtimeBroadcastService->broadcastOrderUpdated($order, $order->status);

            return response()->json([
                'success' => true,
                'message' => 'Courier dispatched successfully.',
                'data' => $result,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Admin: Advance simulated delivery status (pending -> pickup -> dropoff -> delivered).
     */
    public function advanceDeliveryStatus(Request $request, int $orderId): JsonResponse
    {
        $order = Order::findOrFail($orderId);

        if ($order->type !== 'delivery') {
            return response()->json([
                'success' => false,
                'message' => 'Only delivery orders can have delivery status advanced.',
            ], 400);
        }

        try {
            $previousStatus = $order->status;
            $result = $this->uberDirectService->advanceDeliveryStatus($order);
            $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);

            return response()->json([
                'success' => true,
                'message' => "Courier status advanced to '{$result['uber_status']}'.",
                'data' => $result,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Handle incoming webhooks from Uber Direct.
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('Uber Direct Webhook received:', $payload);

        $eventType = $payload['event_type'] ?? $payload['type'] ?? null;
        $deliveryId = $payload['delivery_id'] ?? $payload['data']['id'] ?? null;

        if (!$deliveryId) {
            return response()->json(['status' => 'ignored'], 200);
        }

        $order = Order::where('uber_delivery_id', $deliveryId)->first();
        if (!$order) {
            return response()->json(['status' => 'order_not_found'], 200);
        }

        $status = $payload['data']['status'] ?? $payload['status'] ?? null;
        $courier = $payload['data']['courier'] ?? $payload['courier'] ?? null;
        $courierLocation = $payload['data']['location'] ?? $payload['location'] ?? null;

        $updateData = [];

        if ($status) {
            $updateData['uber_status'] = $status;

            // Map Uber status to store order status where appropriate
            if ($status === 'delivered') {
                $updateData['status'] = 'completed';
            } elseif (in_array($status, ['pickup', 'dropoff'])) {
                $updateData['status'] = 'ready'; // Out for delivery
            } elseif ($status === 'canceled') {
                $updateData['uber_status'] = 'canceled';
            }
        }

        if ($courier) {
            if (!empty($courier['name'])) {
                $updateData['uber_courier_name'] = $courier['name'];
            }
            if (!empty($courier['phone_number'])) {
                $updateData['uber_courier_phone'] = $courier['phone_number'];
            }
        }

        if ($courierLocation) {
            $updateData['uber_courier_location'] = $courierLocation;
        }

        if (!empty($updateData)) {
            $previousStatus = $order->status;
            $order->update($updateData);
            $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);
        }

        return response()->json(['status' => 'processed']);
    }
}
