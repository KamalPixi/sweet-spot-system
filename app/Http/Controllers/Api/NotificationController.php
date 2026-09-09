<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $limit = min((int) $request->query('limit', 20), 50);

        // Determine what audience this notifiable is.
        // Admins (App\Models\User) see audience='admin' notifications.
        // Customers (App\Models\Customer) see audience='customer' | no audience field.
        $isCustomer = $user instanceof \App\Models\Customer;

        $notifications = $user->notifications()
            ->latest()
            ->limit($limit)
            ->get()
            ->filter(function ($notification) use ($isCustomer) {
                $audience = $notification->data['audience'] ?? null;

                if ($isCustomer) {
                    // Exclude anything explicitly tagged as admin-only.
                    return $audience !== 'admin';
                }

                // Admins: exclude customer-only notifications.
                return $audience !== 'customer';
            })
            ->values();

        // Unread count also audience-filtered.
        $unreadCount = $user->unreadNotifications()
            ->get()
            ->filter(function ($notification) use ($isCustomer) {
                $audience = $notification->data['audience'] ?? null;
                return $isCustomer ? $audience !== 'admin' : $audience !== 'customer';
            })
            ->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'notifications' => NotificationResource::collection($notifications)->resolve($request),
                'unread_count'  => $unreadCount,
            ],
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }

    public function clearAll(Request $request): JsonResponse
    {
        $request->user()->notifications()->delete();

        return response()->json([
            'success' => true,
            'message' => 'All notifications deleted.',
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted.',
        ]);
    }
}
