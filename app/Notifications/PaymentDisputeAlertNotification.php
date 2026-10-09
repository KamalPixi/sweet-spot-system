<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class PaymentDisputeAlertNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Order $order,
        private readonly string $event,
        private readonly ?string $disputeId = null,
        private readonly ?string $reason = null
    ) {
    }

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (!empty($notifiable->email) && filter_var($notifiable->email, FILTER_VALIDATE_EMAIL)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $adminOrderUrl = url('/admin?tab=orders&search=' . $this->order->order_number);

        $mail = (new MailMessage)
            ->error()
            ->subject("⚠️ URGENT: Payment Dispute / Chargeback Alert - Order #{$this->order->order_number}")
            ->greeting('Attention ' . ($notifiable->name ?: 'Administrator') . ',')
            ->line("A payment dispute or chargeback notification was received from Global Payments.")
            ->line("**Order Number:** #{$this->order->order_number}")
            ->line("**Order Total:** £" . number_format((float) $this->order->total, 2))
            ->line("**Event Type:** " . strtoupper($this->event));

        if ($this->disputeId) {
            $mail->line("**Dispute Reference ID:** {$this->disputeId}");
        }

        if ($this->reason) {
            $mail->line("**Dispute Reason / Details:** {$this->reason}");
        }

        return $mail
            ->line("Immediate review is recommended in your Global Payments Merchant Portal.")
            ->action('View Order in Admin Dashboard', $adminOrderUrl);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'payment_dispute',
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'event' => $this->event,
            'dispute_id' => $this->disputeId,
            'reason' => $this->reason,
            'title' => "Payment Dispute Alert (#{$this->order->order_number})",
            'message' => "Dispute received for order #{$this->order->order_number} (£" . number_format((float) $this->order->total, 2) . "). Reason: " . ($this->reason ?: 'Bank inquiry / dispute opened'),
            'amount' => (float) $this->order->total,
            'created_at' => now()->toIso8601String(),
        ];
    }
}
