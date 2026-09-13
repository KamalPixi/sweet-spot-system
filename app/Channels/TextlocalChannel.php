<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TextlocalChannel
{
    /**
     * Send the given notification.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toTextlocal')) {
            return;
        }

        $message = $notification->toTextlocal($notifiable);
        if (empty($message)) {
            return;
        }

        // Get the phone number from the notifiable model (Customer or User)
        $phone = $notifiable->phone ?? null;
        if (empty($phone)) {
            return;
        }

        // Standardise phone number format for UK (remove spacing, replace 0 with 44)
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleanPhone, '07')) {
            $cleanPhone = '44' . substr($cleanPhone, 1);
        }

        $apiKey = config('services.textlocal.key') ?: env('TEXTLOCAL_API_KEY');
        $sender = config('services.textlocal.sender') ?: env('TEXTLOCAL_SENDER', 'SweetSpot');

        if (empty($apiKey) || $apiKey === 'your_api_key_here') {
            Log::info("SMS SIMULATION [Textlocal] to {$cleanPhone} (Sender: {$sender}): {$message}");
            return;
        }

        try {
            $response = Http::asForm()->post('https://api.txtlocal.com/send/', [
                'apikey' => $apiKey,
                'numbers' => $cleanPhone,
                'sender' => substr($sender, 0, 11), // Textlocal sender name max length is 11 chars
                'message' => $message,
            ]);

            if ($response->failed()) {
                Log::error("SMS textlocal dispatch failed to {$cleanPhone}: " . $response->body());
            } else {
                $resData = $response->json();
                if (isset($resData['status']) && $resData['status'] === 'failure') {
                    Log::error("SMS textlocal reported failure to {$cleanPhone}: " . json_encode($resData));
                }
            }
        } catch (\Throwable $e) {
            Log::error("SMS textlocal connection error sending to {$cleanPhone}: " . $e->getMessage());
        }
    }
}
