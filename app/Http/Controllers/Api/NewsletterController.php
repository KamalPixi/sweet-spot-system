<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\NewsletterEmailRequest;
use App\Http\Resources\NewsletterSubscriberResource;
use App\Models\NewsletterSubscriber;
use App\Services\NewsletterService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NewsletterController extends Controller
{
    protected NewsletterService $newsletterService;

    public function __construct(NewsletterService $newsletterService)
    {
        $this->newsletterService = $newsletterService;
    }

    /**
     * Subscribe an email.
     */
    public function subscribe(NewsletterEmailRequest $request): JsonResponse
    {
        $email = $request->validated()['email'];
        $alreadySubscribed = NewsletterSubscriber::where('email', $email)
            ->where('is_active', true)
            ->exists();

        $subscriber = $this->newsletterService->subscribe($email);

        return response()->json([
            'success' => true,
            'already_subscribed' => $alreadySubscribed,
            'message' => $alreadySubscribed 
                ? 'You are already subscribed to our newsletter!' 
                : 'Thank you for subscribing to our newsletter!',
            'data' => (new NewsletterSubscriberResource($subscriber))->resolve($request),
        ]);
    }

    /**
     * Check subscription status for a given email.
     */
    public function status(Request $request): JsonResponse
    {
        $email = $request->query('email');

        if (!$email) {
            return response()->json(['subscribed' => false]);
        }

        $subscribed = NewsletterSubscriber::where('email', $email)
            ->where('is_active', true)
            ->exists();

        return response()->json(['subscribed' => $subscribed]);
    }

    /**
     * Unsubscribe an email.
     */
    public function unsubscribe(NewsletterEmailRequest $request): JsonResponse
    {
        $success = $this->newsletterService->unsubscribe($request->validated()['email']);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'You have been unsubscribed from our newsletter.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Email address not found or not active.',
        ], 404);
    }

    /**
     * View active subscribers list (Admin).
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => NewsletterSubscriberResource::collection($this->newsletterService->getActiveSubscribers())->resolve(request()),
        ]);
    }
}
