<?php

namespace App\Notifications;

use App\Models\Order;
use App\Channels\TextlocalChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class OrderStatusUpdatedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Order $order,
        private readonly ?string $previousStatus = null
    ) {
    }

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        // Only send email if email exists and is valid
        if (!empty($notifiable->email) && filter_var($notifiable->email, FILTER_VALIDATE_EMAIL)) {
            $channels[] = 'mail';
        }

        // Only send SMS if phone exists and is not dummy (+440000000000...)
        if (!empty($notifiable->phone) && !str_contains($notifiable->phone, '000000000')) {
            $channels[] = TextlocalChannel::class;
        }

        return $channels;
    }

    private function getFriendlyStatus(): string
    {
        $status = strtolower((string) $this->order->status);
        $type = strtolower((string) $this->order->type);

        if ($status === 'pending') {
            return 'Pending';
        }
        if ($status === 'preparing') {
            return 'Preparing';
        }
        if ($status === 'ready') {
            return $type === 'delivery' ? 'Out for Delivery' : 'Ready for Collection';
        }
        if ($status === 'completed') {
            return $type === 'delivery' ? 'Delivered' : 'Collected';
        }
        if ($status === 'cancelled') {
            return 'Cancelled';
        }

        return ucfirst($status);
    }

    public function toMail(object $notifiable): MailMessage
    {
        $orderUrl = url('/order/' . $this->order->order_number);
        $status = $this->getFriendlyStatus();

        return (new MailMessage)
            ->subject("Order Status Update: {$this->order->order_number} is {$status}")
            ->greeting('Hello ' . ($notifiable->first_name ?: 'there') . '!')
            ->line("Your order status has been updated for order: **{$this->order->order_number}**.")
            ->line("The order status is now: **{$status}**.")
            ->action('Track Your Order', $orderUrl)
            ->line('Thank you for choosing Pudding London!');
    }

    public function toTextlocal(object $notifiable): string
    {
        $status = $this->getFriendlyStatus();
        return sprintf(
            "Hi %s, your Pudding London order %s is now %s. Track status here: %s",
            $notifiable->first_name ?: 'there',
            $this->order->order_number,
            $status,
            url('/order/' . $this->order->order_number)
        );
    }

    public function toArray(object $notifiable): array
    {
        return [
            'category'       => 'orders',
            'event'          => 'order_status_updated',
            'audience'       => 'customer',
            'title'          => 'Order status updated',
            'message'        => sprintf(
                'Your order %s is now %s.',
                $this->order->order_number,
                $this->getFriendlyStatus()
            ),
            'order_id'       => $this->order->id,
            'order_number'   => $this->order->order_number,
            'previous_status'=> $this->previousStatus,
            'status'         => $this->order->status,
            'action_url'     => '/track/' . $this->order->order_number,
            'priority'       => in_array($this->order->status, ['ready', 'completed', 'cancelled'], true) ? 'high' : 'normal',
        ];
    }
}
