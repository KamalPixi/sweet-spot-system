<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Services\GoogleReviewsService;
use App\Services\StoreConfigService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

class ReviewController extends Controller
{
    protected GoogleReviewsService $googleReviewsService;
    protected StoreConfigService $storeConfigService;

    public function __construct(
        GoogleReviewsService $googleReviewsService,
        StoreConfigService $storeConfigService
    ) {
        $this->googleReviewsService = $googleReviewsService;
        $this->storeConfigService = $storeConfigService;
    }

    /**
     * Storefront: List active reviews.
     */
    public function index(): JsonResponse
    {
        $reviews = Review::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('created_at', 'desc')
            ->get();

        $storedGoogleRating = $this->storeConfigService->get('google_rating');
        $storedTotalRatings = $this->storeConfigService->get('google_user_ratings_total');

        $avgRating = $storedGoogleRating !== null 
            ? (float) $storedGoogleRating 
            : ($reviews->count() > 0 ? round($reviews->avg('rating'), 1) : 5.0);

        $totalRatings = $storedTotalRatings !== null 
            ? (int) $storedTotalRatings 
            : $reviews->count();

        return response()->json([
            'success' => true,
            'data' => $reviews,
            'meta' => [
                'total' => $reviews->count(),
                'average_rating' => $avgRating,
                'user_ratings_total' => $totalRatings,
                'google_maps_url' => $this->storeConfigService->get('google_maps_url'),
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

        $storedGoogleRating = $this->storeConfigService->get('google_rating');
        $storedTotalRatings = $this->storeConfigService->get('google_user_ratings_total');

        $avgRating = $storedGoogleRating !== null 
            ? (float) $storedGoogleRating 
            : ($reviews->where('is_active', true)->count() > 0 
                ? round($reviews->where('is_active', true)->avg('rating'), 1) 
                : 5.0);

        return response()->json([
            'success' => true,
            'data' => $reviews,
            'meta' => [
                'total' => $reviews->count(),
                'active_count' => $reviews->where('is_active', true)->count(),
                'average_rating' => $avgRating,
                'user_ratings_total' => $storedTotalRatings ? (int) $storedTotalRatings : $reviews->count(),
                'google_place_id' => $this->googleReviewsService->getPlaceId(),
                'has_google_api_key' => !empty($this->googleReviewsService->getApiKey()),
                'google_maps_url' => $this->storeConfigService->get('google_maps_url'),
            ],
        ]);
    }

    /**
     * Admin: Sync reviews from Google Places API (New).
     */
    public function syncGoogle(Request $request): JsonResponse
    {
        try {
            $apiKey = $request->input('api_key');
            $placeId = $request->input('place_id');

            // If new credentials were provided in the sync request, save them to StoreConfig
            if ($apiKey) {
                $this->storeConfigService->set('google_places_api_key', $apiKey);
            }
            if ($placeId) {
                $this->storeConfigService->set('google_place_id', $placeId);
            }

            $result = $this->googleReviewsService->syncReviews($apiKey, $placeId);

            $reviews = Review::orderBy('sort_order')->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'message' => "Successfully synced {$result['synced_count']} 5-star Google reviews from {$result['place_name']}.",
                'data' => $reviews,
                'meta' => [
                    'total' => $reviews->count(),
                    'active_count' => $reviews->where('is_active', true)->count(),
                    'average_rating' => (float) $result['overall_rating'],
                    'user_ratings_total' => (int) $result['total_ratings_count'],
                    'place_name' => $result['place_name'],
                    'synced_count' => $result['synced_count'],
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to sync Google reviews: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Admin: Create a review manually.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'author_name' => 'required|string|max:255',
            'author_photo_url' => 'nullable|string|max:1000',
            'quote' => 'required|string',
            'source' => 'nullable|string|max:255',
            'relative_time' => 'nullable|string|max:255',
            'review_url' => 'nullable|string|max:1000',
            'rating' => 'required|integer|min:1|max:5',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $review = Review::create([
            'author_name' => $validated['author_name'],
            'author_photo_url' => $validated['author_photo_url'] ?? null,
            'quote' => $validated['quote'],
            'source' => $validated['source'] ?? 'Google Review',
            'relative_time' => $validated['relative_time'] ?? null,
            'review_url' => $validated['review_url'] ?? null,
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
            'author_photo_url' => 'nullable|string|max:1000',
            'quote' => 'required|string',
            'source' => 'nullable|string|max:255',
            'relative_time' => 'nullable|string|max:255',
            'review_url' => 'nullable|string|max:1000',
            'rating' => 'required|integer|min:1|max:5',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $review->update([
            'author_name' => $validated['author_name'],
            'author_photo_url' => $validated['author_photo_url'] ?? $review->author_photo_url,
            'quote' => $validated['quote'],
            'source' => $validated['source'] ?? 'Google Review',
            'relative_time' => $validated['relative_time'] ?? $review->relative_time,
            'review_url' => $validated['review_url'] ?? $review->review_url,
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
