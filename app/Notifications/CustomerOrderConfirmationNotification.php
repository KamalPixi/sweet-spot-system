<?php

namespace App\Notifications;

use App\Models\Order;
use App\Channels\TextlocalChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Sent exclusively to the Customer after they place an order.
 * Keeps admin-facing messages (NewOrderPlacedNotification) separate
 * so they never leak into the customer notification feed.
 */
class CustomerOrderConfirmationNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Order $order) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (!empty($notifiable->email) && filter_var($notifiable->email, FILTER_VALIDATE_EMAIL)) {
            $channels[] = 'mail';
        }

        if (!empty($notifiable->phone) && !str_contains($notifiable->phone, '000000000')) {
            $channels[] = TextlocalChannel::class;
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $orderUrl       = url('/track/' . $this->order->order_number);
        $fulfilmentText = $this->order->type === 'delivery' ? 'Home Delivery' : 'Store Collection';

        $email = (new MailMessage)
            ->subject('Order Confirmation: ' . $this->order->order_number)
            ->greeting('Hello ' . ($notifiable->first_name ?: 'there') . '!')
            ->line('Thank you for ordering with Pudding London. We have received your order.')
            ->line('**Order Number:** ' . $this->order->order_number)
            ->line('**Fulfilment Type:** ' . $fulfilmentText)
            ->line('**Total Amount:** £' . number_format((float) $this->order->total, 2));

        if ($this->order->type === 'collection') {
            $email->line('**Collection Date/Time:** ' . $this->order->collection_time);
        }

        return $email
            ->action('Track Your Order', $orderUrl)
            ->line('Thank you for choosing Pudding London!');
    }

    public function toTextlocal(object $notifiable): string
    {
        return sprintf(
            "Hi %s, your Pudding London order %s (£%s) is confirmed. Track it here: %s",
            $notifiable->first_name ?: 'there',
            $this->order->order_number,
            number_format((float) $this->order->total, 2),
            url('/track/' . $this->order->order_number)
        );
    }

    public function toArray(object $notifiable): array
    {
        $fulfilment = $this->order->type === 'delivery' ? 'delivery' : 'collection';

        return [
            'category'       => 'orders',
            'event'          => 'order_confirmed',
            'audience'       => 'customer',
            'title'          => 'Order confirmed!',
            'message'        => sprintf(
                'Your order %s (£%s) has been received and is being prepared.',
                $this->order->order_number,
                number_format((float) $this->order->total, 2)
            ),
            'order_id'       => $this->order->id,
            'order_number'   => $this->order->order_number,
            'fulfilment_type'=> $fulfilment,
            'amount'         => (float) $this->order->total,
            'action_url'     => '/track/' . $this->order->order_number,
            'priority'       => 'high',
        ];
    }
}
