<?php

namespace App\Services;

use App\Models\Review;
use App\Models\StoreConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class GoogleReviewsService
{
    protected StoreConfigService $storeConfigService;

    public function __construct(StoreConfigService $storeConfigService)
    {
        $this->storeConfigService = $storeConfigService;
    }

    /**
     * Get the active Google Places API Key.
     */
    public function getApiKey(): ?string
    {
        return $this->storeConfigService->get('google_places_api_key')
            ?: env('GOOGLE_PLACES_API_KEY')
            ?: 'AIzaSyCQpJraLjnumbY2_qkhnhV_J2ESMmQmnZ8';
    }

    /**
     * Get the active Google Place ID.
     */
    public function getPlaceId(): ?string
    {
        return $this->storeConfigService->get('google_place_id')
            ?: env('GOOGLE_PLACE_ID')
            ?: 'ChIJ2YYyijyl2EcRsXdfidBY8k8';
    }

    /**
     * Sync 5-star reviews from Google Places API (New).
     */
    public function syncReviews(?string $apiKey = null, ?string $placeId = null): array
    {
        $apiKey = $apiKey ?: $this->getApiKey();
        $placeId = $placeId ?: $this->getPlaceId();

        if (empty($apiKey) || empty($placeId)) {
            throw new Exception('Google Places API Key and Place ID are required.');
        }

        $url = "https://places.googleapis.com/v1/places/{$placeId}";

        $response = Http::withHeaders([
            'X-Goog-Api-Key' => $apiKey,
            'X-Goog-FieldMask' => 'id,displayName,formattedAddress,rating,userRatingCount,reviews,googleMapsUri',
        ])->timeout(15)->get($url);

        if (!$response->successful()) {
            $errorMsg = $response->json('error.message') ?? $response->body();
            Log::error("Google Places API sync error: {$errorMsg}");
            throw new Exception("Google Places API error: {$errorMsg}");
        }

        $data = $response->json();
        $reviews = $data['reviews'] ?? [];

        // Save overall place rating and total reviews count to store configs
        if (isset($data['rating'])) {
            $this->storeConfigService->set('google_rating', (string) $data['rating']);
        }
        if (isset($data['userRatingCount'])) {
            $this->storeConfigService->set('google_user_ratings_total', (string) $data['userRatingCount']);
        }
        if (isset($data['googleMapsUri'])) {
            $this->storeConfigService->set('google_maps_url', (string) $data['googleMapsUri']);
        }

        $syncedCount = 0;
        $fiveStarCount = 0;

        foreach ($reviews as $gReview) {
            $rating = (int) ($gReview['rating'] ?? 5);

            // Filter: strictly 5-star reviews only
            if ($rating !== 5) {
                continue;
            }

            $fiveStarCount++;
            $reviewId = $gReview['name'] ?? null;
            $authorName = $gReview['authorAttribution']['displayName'] ?? 'Google Customer';
            $authorPhoto = $gReview['authorAttribution']['photoUri'] ?? null;
            $quote = $gReview['text']['text'] ?? $gReview['originalText']['text'] ?? '';
            $relativeTime = $gReview['relativePublishTimeDescription'] ?? null;
            $reviewUrl = $gReview['googleMapsUri'] ?? null;

            if (empty($quote)) {
                continue;
            }

            // Upsert review by google_review_id or matching author & quote
            $review = null;
            if ($reviewId) {
                $review = Review::where('google_review_id', $reviewId)->first();
            }

            if (!$review) {
                $review = Review::where('author_name', $authorName)
                    ->where('source', 'Google Review')
                    ->first();
            }

            if ($review) {
                $review->update([
                    'google_review_id' => $reviewId ?: $review->google_review_id,
                    'author_name' => $authorName,
                    'author_photo_url' => $authorPhoto ?: $review->author_photo_url,
                    'quote' => $quote,
                    'rating' => 5,
                    'source' => 'Google Review',
                    'relative_time' => $relativeTime ?: $review->relative_time,
                    'review_url' => $reviewUrl ?: $review->review_url,
                    'is_active' => true,
                ]);
            } else {
                Review::create([
                    'google_review_id' => $reviewId,
                    'author_name' => $authorName,
                    'author_photo_url' => $authorPhoto,
                    'quote' => $quote,
                    'rating' => 5,
                    'source' => 'Google Review',
                    'relative_time' => $relativeTime,
                    'review_url' => $reviewUrl,
                    'is_active' => true,
                    'sort_order' => Review::max('sort_order') + 1,
                ]);
            }

            $syncedCount++;
        }

        return [
            'success' => true,
            'place_name' => $data['displayName']['text'] ?? 'Sweet Spot',
            'overall_rating' => $data['rating'] ?? 5.0,
            'total_ratings_count' => $data['userRatingCount'] ?? count($reviews),
            'five_star_reviews_found' => $fiveStarCount,
            'synced_count' => $syncedCount,
        ];
    }
}
