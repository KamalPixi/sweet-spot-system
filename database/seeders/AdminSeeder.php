<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\StoreConfig;
use App\Models\StoreOpeningHour;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Default Admin User
        User::updateOrCreate(
            ['email' => 'admin@sweetspotlondon.co.uk'],
            [
                'name' => 'Admin Staff',
                'password' => bcrypt('password'),
            ]
        );

        // 2. Create Store Configurations
        $configs = [
            'store_name' => 'Sweet Spot',
            'store_postcode' => 'IG11 8UW', // Soho, London
            'store_delivery_radius_miles' => '3.0',
            'store_delivery_charge_per_mile' => '1.50',
            'store_delivery_base_fee' => '2.50',
            'store_address' => '19, Faircross Parade, Upney Ln, Barking',
            'store_latitude' => '51.545587548659775',
            'store_longitude' => '0.09481839827376755',
            'store_email' => 'contact@sweetspotlondon.co.uk',
            'store_phone' => '+44 20 3795 5048',
            'store_logo' => '/storage/brand_logo.png',
            'store_logo_white' => '/storage/brand_logo_white.png',
        ];

        // Copy default logo to storage
        $logoSource = public_path('images/logo-colored.png');
        $logoDest = storage_path('app/public/brand_logo.png');
        if (file_exists($logoSource)) {
            $destDir = dirname($logoDest);
            if (!is_dir($destDir)) {
                mkdir($destDir, 0755, true);
            }
            copy($logoSource, $logoDest);
        }

        // Copy default white logo to storage
        $logoWhiteSource = public_path('images/footer-logo.png');
        $logoWhiteDest = storage_path('app/public/brand_logo_white.png');
        if (file_exists($logoWhiteSource)) {
            copy($logoWhiteSource, $logoWhiteDest);
        }

        foreach ($configs as $key => $value) {
            StoreConfig::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        // 3. Create Store Opening Hours (7 Days)
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        foreach ($days as $day) {
            StoreOpeningHour::updateOrCreate(
                ['day_of_week' => $day],
                [
                    'open_time' => '08:00:00',
                    'close_time' => '22:00:00',
                    'slot_interval' => 15,
                    'is_closed' => false,
                ]
            );
        }
    }
}
