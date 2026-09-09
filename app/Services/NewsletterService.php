<?php

namespace App\Services;

use App\Models\NewsletterSubscriber;

class NewsletterService
{
    /**
     * Subscribe an email to the newsletter.
     */
    public function subscribe(string $email): NewsletterSubscriber
    {
        return NewsletterSubscriber::updateOrCreate(
            ['email' => $email],
            ['is_active' => true]
        );
    }

    /**
     * Unsubscribe an email from the newsletter.
     */
    public function unsubscribe(string $email): bool
    {
        $subscriber = NewsletterSubscriber::where('email', $email)->first();
        if ($subscriber) {
            return $subscriber->update(['is_active' => false]);
        }
        return false;
    }

    /**
     * Get all active subscribers.
     */
    public function getActiveSubscribers()
    {
        return NewsletterSubscriber::where('is_active', true)->get();
    }
}
