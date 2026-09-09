<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categoriesData = [
            [
                'name' => 'Cakes', 
                'order' => 1, 
                'image' => 'categories/cakes.jpg',
                'icon' => 'Cake',
                'url' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop'
            ],
            [
                'name' => 'Puddings', 
                'order' => 2, 
                'image' => 'categories/puddings.jpg',
                'icon' => 'Dessert',
                'url' => 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=600&auto=format&fit=crop'
            ],
            [
                'name' => 'Braids', 
                'order' => 3, 
                'image' => 'categories/braids.jpg',
                'icon' => 'Croissant',
                'url' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop'
            ],
            [
                'name' => 'Toasts', 
                'order' => 4, 
                'image' => 'categories/toasts.jpg',
                'icon' => 'Flame',
                'url' => 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?q=80&w=600&auto=format&fit=crop'
            ],
            [
                'name' => 'Sandwiches', 
                'order' => 5, 
                'image' => 'categories/sandwiches.jpg',
                'icon' => 'Utensils',
                'url' => 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=600&auto=format&fit=crop'
            ],
            [
                'name' => 'Donuts', 
                'order' => 6, 
                'image' => 'categories/donuts.jpg',
                'icon' => 'CircleDot',
                'url' => 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600&auto=format&fit=crop'
            ],
            [
                'name' => 'Coffee', 
                'order' => 7, 
                'image' => 'categories/coffee.jpg',
                'icon' => 'Coffee',
                'url' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop'
            ],
            [
                'name' => 'Water', 
                'order' => 8, 
                'image' => 'categories/water.jpg',
                'icon' => 'GlassWater',
                'url' => 'https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=600&auto=format&fit=crop'
            ],
        ];

        foreach ($categoriesData as $cat) {
            $category = Category::updateOrCreate(
                ['slug' => Str::slug($cat['name'])],
                [
                    'name' => $cat['name'],
                    'status' => true,
                    'order' => $cat['order'],
                    'icon' => $cat['icon'],
                ]
            );

            // Download and save image locally
            $this->downloadAndSaveImage($cat['url'], $cat['image']);

            $category->images()->delete();
            $category->images()->create(['url' => $cat['image'], 'is_primary' => true]);
        }
    }

    private function downloadAndSaveImage(string $url, string $path): void
    {
        $fullPath = storage_path('app/public/' . $path);
        $dir = dirname($fullPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        try {
            $contents = file_get_contents($url);
            if ($contents !== false) {
                file_put_contents($fullPath, $contents);
                $this->command->info("Downloaded: {$path}");
            }
        } catch (\Exception $e) {
            $this->command->warn("Failed to download image for {$path}: " . $e->getMessage());
        }
    }
}
