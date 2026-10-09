<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\GoogleReviewsService;
use Exception;

class SyncGoogleReviewsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reviews:sync-google {--place_id= : Optional custom Google Place ID} {--api_key= : Optional custom Google API Key}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync 5-star customer reviews from Google Places API (New) for Sweet Spot';

    /**
     * Execute the console command.
     */
    public function handle(GoogleReviewsService $googleReviewsService): int
    {
        $this->info('Starting Google Reviews sync for Sweet Spot...');

        $customPlaceId = $this->option('place_id');
        $customApiKey = $this->option('api_key');

        try {
            $result = $googleReviewsService->syncReviews($customApiKey, $customPlaceId);

            $this->info("✓ Successfully synced {$result['synced_count']} 5-star reviews from {$result['place_name']}.");
            $this->line("  Overall Rating: {$result['overall_rating']} ★ ({$result['total_ratings_count']} total reviews)");

            return Command::SUCCESS;
        } catch (Exception $e) {
            $this->error("Failed to sync Google reviews: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
