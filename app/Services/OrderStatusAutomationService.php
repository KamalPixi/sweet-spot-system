<?php

namespace App\Services;

use App\Models\Order;
use App\Notifications\OrderStatusUpdatedNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class OrderStatusAutomationService
{
    public function __construct(
        protected StoreConfigService $storeConfigService,
        protected RealtimeBroadcastService $realtimeBroadcastService,
        protected CloudPrntService $cloudPrntService
    ) {}

    /**
     * Transition order to 'preparing' upon payment clearance and receipt printing trigger.
     */
    public function markAsPreparing(Order $order): Order
    {
        $order->loadMissing(['customer', 'items', 'deliveryAddress']);
        $previousStatus = $order->status;

        $updateData = [
            'status' => 'preparing',
            'preparing_at' => $order->preparing_at ?? now(),
        ];

        if ($order->payment_status !== 'paid') {
            $updateData['payment_status'] = 'paid';
        }

        $order->update($updateData);

        // Notify customer of status progression
        if ($previousStatus !== 'preparing' && $order->customer) {
            try {
                $order->customer->notify(new OrderStatusUpdatedNotification($order, $previousStatus));
            } catch (\Throwable $e) {
                Log::warning("Could not send OrderStatusUpdatedNotification for order #{$order->order_number}: " . $e->getMessage());
            }
        }

        // Broadcast realtime update
        $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);

        return $order;
    }

    /**
     * Transition order to 'ready' (e.g. after preparing timer elapses).
     */
    public function markAsReady(Order $order): Order
    {
        $order->loadMissing(['customer', 'items', 'deliveryAddress']);
        $previousStatus = $order->status;

        $order->update([
            'status' => 'ready',
            'ready_at' => $order->ready_at ?? now(),
        ]);

        if ($previousStatus !== 'ready' && $order->customer) {
            try {
                $order->customer->notify(new OrderStatusUpdatedNotification($order, $previousStatus));
            } catch (\Throwable $e) {
                Log::warning("Could not send OrderStatusUpdatedNotification for order #{$order->order_number}: " . $e->getMessage());
            }
        }

        $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);

        return $order;
    }

    /**
     * Transition order to 'completed' (e.g. after ready timer elapses).
     */
    public function markAsCompleted(Order $order): Order
    {
        $order->loadMissing(['customer', 'items', 'deliveryAddress']);
        $previousStatus = $order->status;

        $order->update([
            'status' => 'completed',
            'completed_at' => $order->completed_at ?? now(),
        ]);

        if ($previousStatus !== 'completed' && $order->customer) {
            try {
                $order->customer->notify(new OrderStatusUpdatedNotification($order, $previousStatus));
            } catch (\Throwable $e) {
                Log::warning("Could not send OrderStatusUpdatedNotification for order #{$order->order_number}: " . $e->getMessage());
            }
        }

        $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);

        return $order;
    }

    /**
     * Transition order to 'cancelled' upon payment decline, failure, or customer cancellation.
     */
    public function markAsCancelled(Order $order, ?string $reason = null): Order
    {
        $order->loadMissing(['customer', 'items', 'deliveryAddress']);
        $previousStatus = $order->status;

        $updateData = [
            'status' => 'cancelled',
            'payment_status' => 'failed',
            'cancelled_at' => $order->cancelled_at ?? now(),
        ];

        if ($reason) {
            $note = "\n[" . now()->toDateTimeString() . "] Order cancelled: " . $reason;
            $updateData['notes'] = trim(($order->notes ?? '') . $note);
        }

        $order->update($updateData);

        // Cancel any active print jobs if queued
        try {
            $this->cloudPrntService->cancelOrderJobs($order->id);
        } catch (\Throwable $e) {
            Log::warning("Could not cancel print jobs for order #{$order->order_number}: " . $e->getMessage());
        }

        $this->realtimeBroadcastService->broadcastOrderUpdated($order, $previousStatus);

        return $order;
    }

    /**
     * Scan active orders and auto-advance eligible orders based on store configured time limits.
     */
    public function autoAdvanceEligibleOrders(): array
    {
        $isEnabled = (bool) (int) ($this->storeConfigService->get('auto_status_transition_enabled', '1'));
        if (!$isEnabled) {
            return [
                'advanced_to_ready' => 0,
                'advanced_to_completed' => 0,
            ];
        }

        $prepMinutes = max(1, (int) ($this->storeConfigService->get('auto_status_preparing_minutes', '15')));
        $readyMinutes = max(1, (int) ($this->storeConfigService->get('auto_status_ready_minutes', '5')));

        $now = now();
        $advancedToReadyCount = 0;
        $advancedToCompletedCount = 0;

        // 1. Advance 'preparing' -> 'ready' (after $prepMinutes)
        $preparingOrders = Order::where('status', 'preparing')->get();
        foreach ($preparingOrders as $order) {
            $startTime = $order->preparing_at ?: $order->updated_at ?: $order->created_at;
            if ($startTime && $now->greaterThanOrEqualTo(Carbon::parse($startTime)->addMinutes($prepMinutes))) {
                $this->markAsReady($order);
                $advancedToReadyCount++;
            }
        }

        // 2. Advance 'ready' -> 'completed' (after $readyMinutes)
        $readyOrders = Order::where('status', 'ready')->get();
        foreach ($readyOrders as $order) {
            $startTime = $order->ready_at ?: $order->updated_at ?: $order->created_at;
            if ($startTime && $now->greaterThanOrEqualTo(Carbon::parse($startTime)->addMinutes($readyMinutes))) {
                $this->markAsCompleted($order);
                $advancedToCompletedCount++;
            }
        }

        return [
            'advanced_to_ready' => $advancedToReadyCount,
            'advanced_to_completed' => $advancedToCompletedCount,
        ];
    }
}
