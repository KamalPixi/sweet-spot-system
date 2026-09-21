<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    /**
     * Storefront: List active reviews.
     */
    public function index(): JsonResponse
    {
        $reviews = Review::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('created_at', 'desc')
            ->get();

        $avgRating = $reviews->count() > 0 ? round($reviews->avg('rating'), 1) : 5.0;

        return response()->json([
            'success' => true,
            'data' => $reviews,
            'meta' => [
                'total' => $reviews->count(),
                'average_rating' => $avgRating,
            ],
        ]);
    }

    /**
     * Admin: List all reviews (active and inactive).
     */
    public function adminIndex(): JsonResponse
    {
        $reviews = Review::orderBy('sort_order')
            ->orderBy('created_at', 'desc')
            ->get();

        $avgRating = $reviews->where('is_active', true)->count() > 0 
            ? round($reviews->where('is_active', true)->avg('rating'), 1) 
            : 5.0;

        return response()->json([
            'success' => true,
            'data' => $reviews,
            'meta' => [
                'total' => $reviews->count(),
                'active_count' => $reviews->where('is_active', true)->count(),
                'average_rating' => $avgRating,
            ],
        ]);
    }

    /**
     * Admin: Create a review.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'author_name' => 'required|string|max:255',
            'quote' => 'required|string',
            'source' => 'nullable|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $review = Review::create([
            'author_name' => $validated['author_name'],
            'quote' => $validated['quote'],
            'source' => $validated['source'] ?? 'Google Review',
            'rating' => $validated['rating'] ?? 5,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review created successfully.',
            'data' => $review,
        ]);
    }

    /**
     * Admin: Update a review.
     */
    public function update(Request $request, Review $review): JsonResponse
    {
        $validated = $request->validate([
            'author_name' => 'required|string|max:255',
            'quote' => 'required|string',
            'source' => 'nullable|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $review->update([
            'author_name' => $validated['author_name'],
            'quote' => $validated['quote'],
            'source' => $validated['source'] ?? 'Google Review',
            'rating' => $validated['rating'],
            'sort_order' => $validated['sort_order'] ?? $review->sort_order,
            'is_active' => $validated['is_active'] ?? $review->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review updated successfully.',
            'data' => $review,
        ]);
    }

    /**
     * Admin: Toggle active status.
     */
    public function toggleActive(Review $review): JsonResponse
    {
        $review->update([
            'is_active' => !$review->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review visibility updated successfully.',
            'data' => $review,
        ]);
    }

    /**
     * Admin: Delete a review.
     */
    public function destroy(Review $review): JsonResponse
    {
        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully.',
        ]);
    }
}
