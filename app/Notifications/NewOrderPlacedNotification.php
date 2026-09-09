<?php

namespace App\Notifications;

use App\Models\Order;
use App\Channels\TextlocalChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class NewOrderPlacedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Order $order)
    {
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

    public function toMail(object $notifiable): MailMessage
    {
        $orderUrl = url('/order/' . $this->order->order_number);
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
            "Hi %s, your Pudding London order %s (£%s) is received. Track it here: %s",
            $notifiable->first_name ?: 'there',
            $this->order->order_number,
            number_format((float) $this->order->total, 2),
            url('/order/' . $this->order->order_number)
        );
    }

    public function toArray(object $notifiable): array
    {
        $customerName = trim(($this->order->customer?->first_name ?? '') . ' ' . ($this->order->customer?->last_name ?? ''));
        $fulfilment = $this->order->type === 'delivery' ? 'delivery' : 'collection';

        return [
            'category'        => 'orders',
            'event'           => 'new_order',
            'audience'        => 'admin',
            'title'           => 'New order received',
            'message'         => sprintf(
                '%s placed %s for %s.',
                $customerName !== '' ? $customerName : 'A customer',
                $this->order->order_number,
                '£' . number_format((float) $this->order->total, 2)
            ),
            'order_id'        => $this->order->id,
            'order_number'    => $this->order->order_number,
            'customer_name'   => $customerName,
            'fulfilment_type' => $fulfilment,
            'amount'          => (float) $this->order->total,
            'action_url'      => '/admin',
            'priority'        => 'high',
        ];
    }
}
