<?php

namespace App\Services;

use App\Events\RealtimeEvent;
use App\Models\Customer;
use App\Models\Order;

class RealtimeBroadcastService
{
    public function broadcastToAdmin(array $payload, string $eventName = 'realtime.event'): void
    {
        try {
            broadcast(new RealtimeEvent('admin.live', $payload, $eventName))->toOthers();
        } catch (\Throwable $e) {
            // Reverb/Pusher is offline. Fail silently so HTTP request succeeds.
            report($e);
        }
    }

    public function broadcastToCustomer(Customer|int $customer, array $payload, string $eventName = 'realtime.event'): void
    {
        try {
            $customerId = $customer instanceof Customer ? $customer->id : $customer;
            broadcast(new RealtimeEvent("customer.live.{$customerId}", $payload, $eventName))->toOthers();
        } catch (\Throwable $e) {
            // Reverb/Pusher is offline. Fail silently so HTTP request succeeds.
            report($e);
        }
    }

    public function broadcastOrderCreated(Order $order): void
    {
        $customerName = trim(($order->customer?->first_name ?? '') . ' ' . ($order->customer?->last_name ?? '')) ?: 'A customer';

        $this->broadcastToAdmin([
            'event_type' => 'order.created',
            'scope' => 'admin',
            'title' => 'New order received',
            'message' => sprintf(
                '%s placed %s for %s.',
                $customerName,
                $order->order_number,
                '£' . number_format((float) $order->total, 2)
            ),
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'priority' => 'high',
            'action_url' => '/admin/orders/'.$order->order_number,
            'refresh' => ['dashboard', 'orders', 'reports', 'notifications'],
        ]);
    }

    public function broadcastOrderUpdated(Order $order, ?string $previousStatus = null): void
    {
        $statusLabel = ucfirst((string) $order->status);

        $this->broadcastToAdmin([
            'event_type' => 'order.updated',
            'scope' => 'admin',
            'title' => 'Order updated',
            'message' => sprintf('Order %s is now %s.', $order->order_number, $statusLabel),
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'previous_status' => $previousStatus,
            'priority' => in_array($order->status, ['ready', 'completed', 'cancelled'], true) ? 'high' : 'normal',
            'action_url' => '/admin/orders/'.$order->order_number,
            'refresh' => ['orders', 'reports', 'notifications'],
        ]);

        if ($order->customer) {
            $this->broadcastToCustomer($order->customer, [
                'event_type' => 'order.status_updated',
                'scope' => 'customer',
                'title' => 'Order status updated',
                'message' => sprintf('Your order %s is now %s.', $order->order_number, $statusLabel),
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'previous_status' => $previousStatus,
                'priority' => in_array($order->status, ['ready', 'completed', 'cancelled'], true) ? 'high' : 'normal',
                'action_url' => '/track/'.$order->order_number,
                'refresh' => ['orders'],
            ]);
        }
    }
}
