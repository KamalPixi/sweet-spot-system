<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariation;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get categories mapped by name
        $categories = Category::all()->keyBy('name');

        if ($categories->isEmpty()) {
            $this->command->warn('No categories found. Please run CategorySeeder first.');
            return;
        }

        // --- CAKES ---
        $redVelvet = Product::create([
            'category_id' => $categories['Cakes']->id,
            'name' => 'Red Velvet Cake Slice',
            'slug' => Str::slug('Red Velvet Cake Slice'),
            'description' => 'A delicious, rich red velvet cake with a smooth cream cheese frosting.',
            'status' => true,
            'has_variations' => true,
        ]);
        $redVelvet->images()->create(['url' => 'products/red-velvet.jpg', 'is_primary' => true]);
        $redVelvet->images()->create(['url' => 'products/red-velvet-side.jpg', 'is_primary' => false]);
        
        ProductVariation::create(['product_id' => $redVelvet->id, 'name' => 'Single Slice', 'price' => 4.50, 'weight' => 200, 'sku' => 'CAKE-RV-SLICE']);
        ProductVariation::create(['product_id' => $redVelvet->id, 'name' => 'Double Slice Box', 'price' => 8.00, 'weight' => 400, 'sku' => 'CAKE-RV-DOUBLE']);
        ProductVariation::create(['product_id' => $redVelvet->id, 'name' => 'Whole Cake (12 Slices)', 'price' => 35.00, 'weight' => 1500, 'sku' => 'CAKE-RV-WHOLE']);

        $chocFudge = Product::create([
            'category_id' => $categories['Cakes']->id,
            'name' => 'Chocolate Fudge Cake',
            'slug' => Str::slug('Chocolate Fudge Cake'),
            'description' => 'Decadent chocolate sponge layered with smooth chocolate fudge icing.',
            'status' => true,
            'has_variations' => true,
        ]);
        $chocFudge->images()->create(['url' => 'products/choc-fudge.jpg', 'is_primary' => true]);
        
        ProductVariation::create(['product_id' => $chocFudge->id, 'name' => 'Single Slice', 'price' => 4.00, 'weight' => 200, 'sku' => 'CAKE-CF-SLICE']);
        ProductVariation::create(['product_id' => $chocFudge->id, 'name' => 'Whole Cake (12 Slices)', 'price' => 30.00, 'weight' => 1500, 'sku' => 'CAKE-CF-WHOLE']);

        $strawberryCheesecake = Product::create([
            'category_id' => $categories['Cakes']->id,
            'name' => 'Strawberry Cheesecake',
            'slug' => Str::slug('Strawberry Cheesecake'),
            'description' => 'Creamy baked vanilla cheesecake topped with fresh strawberries and strawberry glaze.',
            'base_price' => 5.00,
            'status' => true,
            'has_variations' => false,
        ]);
        $strawberryCheesecake->images()->create(['url' => 'products/strawberry-cheesecake.jpg', 'is_primary' => true]);

        $carrotCake = Product::create([
            'category_id' => $categories['Cakes']->id,
            'name' => 'Classic Carrot Cake Slice',
            'slug' => Str::slug('Classic Carrot Cake Slice'),
            'description' => 'Moist carrot cake slice infused with spices, walnuts, and topped with cream cheese frosting.',
            'base_price' => 4.20,
            'status' => true,
            'has_variations' => false,
        ]);
        $carrotCake->images()->create(['url' => 'products/carrot-cake.jpg', 'is_primary' => true]);

        $lemonDrizzle = Product::create([
            'category_id' => $categories['Cakes']->id,
            'name' => 'Lemon Drizzle Cake Slice',
            'slug' => Str::slug('Lemon Drizzle Cake Slice'),
            'description' => 'Zesty lemon sponge soaked with a sweet lemon syrup and drizzled with icing.',
            'base_price' => 3.80,
            'status' => true,
            'has_variations' => false,
        ]);
        $lemonDrizzle->images()->create(['url' => 'products/lemon-drizzle.jpg', 'is_primary' => true]);


        // --- PUDDINGS ---
        $stickyToffee = Product::create([
            'category_id' => $categories['Puddings']->id,
            'name' => 'Sticky Toffee Pudding',
            'slug' => Str::slug('Sticky Toffee Pudding'),
            'description' => 'A classic British dessert consisting of a very moist sponge cake, made with finely chopped dates, covered in a rich toffee sauce.',
            'status' => true,
            'has_variations' => true,
        ]);
        $stickyToffee->images()->create(['url' => 'products/sticky-toffee.jpg', 'is_primary' => true]);
        
        ProductVariation::create(['product_id' => $stickyToffee->id, 'name' => 'Regular Serving', 'price' => 5.50, 'weight' => 250, 'sku' => 'PUD-STP-REG']);
        ProductVariation::create(['product_id' => $stickyToffee->id, 'name' => 'Large Serving', 'price' => 9.50, 'weight' => 500, 'sku' => 'PUD-STP-LRG']);

        $breadButter = Product::create([
            'category_id' => $categories['Puddings']->id,
            'name' => 'Bread and Butter Pudding',
            'slug' => Str::slug('Bread and Butter Pudding'),
            'description' => 'A traditional bread pudding made with slices of buttered bread scattered with raisins and baked in an egg custard.',
            'status' => true,
            'has_variations' => false,
            'base_price' => 5.00,
            'base_weight' => 300,
        ]);
        $breadButter->images()->create(['url' => 'products/bread-butter.jpg', 'is_primary' => true]);


        // --- BRAIDS ---
        $cinnamonBraid = Product::create([
            'category_id' => $categories['Braids']->id,
            'name' => 'Cinnamon Braid',
            'slug' => Str::slug('Cinnamon Braid'),
            'description' => 'Sweet yeast bread braided with cinnamon and sugar swirls, topped with vanilla glaze.',
            'status' => true,
            'has_variations' => false,
            'base_price' => 3.50,
            'base_weight' => 150,
        ]);
        $cinnamonBraid->images()->create(['url' => 'products/cinnamon-braid.jpg', 'is_primary' => true]);

        $almondBraid = Product::create([
            'category_id' => $categories['Braids']->id,
            'name' => 'Almond Cardamom Braid',
            'slug' => Str::slug('Almond Cardamom Braid'),
            'description' => 'Flaky braided pastry filled with sweet almond paste and hint of warm cardamom.',
            'status' => true,
            'has_variations' => false,
            'base_price' => 3.80,
            'base_weight' => 150,
        ]);
        $almondBraid->images()->create(['url' => 'products/almond-braid.jpg', 'is_primary' => true]);


        // --- TOASTS ---
        $avoToast = Product::create([
            'category_id' => $categories['Toasts']->id,
            'name' => 'Avocado Sourdough Toast',
            'slug' => Str::slug('Avocado Sourdough Toast'),
            'description' => 'Mashed avocado on toasted artisan sourdough, topped with pumpkin seeds, red chili flakes, and extra virgin olive oil.',
            'status' => true,
            'has_variations' => false,
            'base_price' => 6.50,
            'base_weight' => 250,
        ]);
        $avoToast->images()->create(['url' => 'products/avocado-toast.jpg', 'is_primary' => true]);

        $nutellaToast = Product::create([
            'category_id' => $categories['Toasts']->id,
            'name' => 'Nutella Banana Toast',
            'slug' => Str::slug('Nutella Banana Toast'),
            'description' => 'Thick toasted brioche bread generously spread with Nutella, topped with fresh banana slices and a sprinkle of powdered sugar.',
            'status' => true,
            'has_variations' => false,
            'base_price' => 5.00,
            'base_weight' => 200,
        ]);
        $nutellaToast->images()->create(['url' => 'products/nutella-toast.jpg', 'is_primary' => true]);


        // --- SANDWICHES ---
        $clubSandwich = Product::create([
            'category_id' => $categories['Sandwiches']->id,
            'name' => 'Classic Club Sandwich',
            'slug' => Str::slug('Classic Club Sandwich'),
            'description' => 'Triple-decker toasted sandwich with grilled chicken breast, crispy bacon, lettuce, tomato, and light mayonnaise.',
            'status' => true,
            'has_variations' => false,
            'base_price' => 7.50,
            'base_weight' => 300,
        ]);
        $clubSandwich->images()->create(['url' => 'products/club-sandwich.jpg', 'is_primary' => true]);

        $capreseCiabatta = Product::create([
            'category_id' => $categories['Sandwiches']->id,
            'name' => 'Caprese Ciabatta',
            'slug' => Str::slug('Caprese Ciabatta'),
            'description' => 'Toasted ciabatta filled with fresh buffalo mozzarella, vine tomatoes, basil pesto, and balsamic glaze.',
            'status' => true,
            'has_variations' => false,
            'base_price' => 6.80,
            'base_weight' => 280,
        ]);
        $capreseCiabatta->images()->create(['url' => 'products/caprese-ciabatta.jpg', 'is_primary' => true]);


        // --- DONUTS ---
        $glazedDonut = Product::create([
            'category_id' => $categories['Donuts']->id,
            'name' => 'Glazed Ring Donut',
            'slug' => Str::slug('Glazed Ring Donut'),
            'description' => 'Fluffy, classic ring donut dipped in a sweet sugar glaze.',
            'status' => true,
            'has_variations' => true,
        ]);
        $glazedDonut->images()->create(['url' => 'products/glazed-donut.jpg', 'is_primary' => true]);
        
        ProductVariation::create(['product_id' => $glazedDonut->id, 'name' => 'Single Donut', 'price' => 2.00, 'weight' => 80, 'sku' => 'DON-GLZ-SINGLE']);
        ProductVariation::create(['product_id' => $glazedDonut->id, 'name' => 'Box of 4', 'price' => 7.00, 'weight' => 320, 'sku' => 'DON-GLZ-BOX4']);
        ProductVariation::create(['product_id' => $glazedDonut->id, 'name' => 'Box of 12', 'price' => 18.00, 'weight' => 960, 'sku' => 'DON-GLZ-BOX12']);

        $saltedCaramelDonut = Product::create([
            'category_id' => $categories['Donuts']->id,
            'name' => 'Salted Caramel Donut',
            'slug' => Str::slug('Salted Caramel Donut'),
            'description' => 'Donut filled with luxurious salted caramel, glazed and topped with caramelized honeycomb pieces.',
            'status' => true,
            'has_variations' => false,
            'base_price' => 2.50,
            'base_weight' => 90,
        ]);
        $saltedCaramelDonut->images()->create(['url' => 'products/caramel-donut.jpg', 'is_primary' => true]);


        // --- COFFEE ---
        $cappuccino = Product::create([
            'category_id' => $categories['Coffee']->id,
            'name' => 'Cappuccino',
            'slug' => Str::slug('Cappuccino'),
            'description' => 'Espresso with steamed milk and a thick layer of foam, dusted with cocoa powder.',
            'status' => true,
            'has_variations' => true,
        ]);
        $cappuccino->images()->create(['url' => 'products/cappuccino.jpg', 'is_primary' => true]);
        
        ProductVariation::create(['product_id' => $cappuccino->id, 'name' => 'Small', 'price' => 3.00, 'weight' => 220, 'sku' => 'COF-CAP-SM']);
        ProductVariation::create(['product_id' => $cappuccino->id, 'name' => 'Large', 'price' => 3.80, 'weight' => 340, 'sku' => 'COF-CAP-LG']);

        $latte = Product::create([
            'category_id' => $categories['Coffee']->id,
            'name' => 'Latte',
            'slug' => Str::slug('Latte'),
            'description' => 'Espresso with steamed milk and a thin layer of foam on top.',
            'status' => true,
            'has_variations' => true,
        ]);
        $latte->images()->create(['url' => 'products/latte.jpg', 'is_primary' => true]);
        
        ProductVariation::create(['product_id' => $latte->id, 'name' => 'Small', 'price' => 3.00, 'weight' => 220, 'sku' => 'COF-LAT-SM']);
        ProductVariation::create(['product_id' => $latte->id, 'name' => 'Large', 'price' => 3.80, 'weight' => 340, 'sku' => 'COF-LAT-LG']);

        $espresso = Product::create([
            'category_id' => $categories['Coffee']->id,
            'name' => 'Espresso',
            'slug' => Str::slug('Espresso'),
            'description' => 'Strong, full-bodied espresso shot.',
            'status' => true,
            'has_variations' => true,
        ]);
        $espresso->images()->create(['url' => 'products/espresso.jpg', 'is_primary' => true]);
        
        ProductVariation::create(['product_id' => $espresso->id, 'name' => 'Single Shot', 'price' => 2.20, 'weight' => 40, 'sku' => 'COF-ESP-SGL']);
        ProductVariation::create(['product_id' => $espresso->id, 'name' => 'Double Shot', 'price' => 2.80, 'weight' => 80, 'sku' => 'COF-ESP-DBL']);


        // --- WATER ---
        $stillWater = Product::create([
            'category_id' => $categories['Water']->id,
            'name' => 'Still Mineral Water',
            'slug' => Str::slug('Still Mineral Water'),
            'description' => 'Pure still mineral water in a glass bottle.',
            'status' => true,
            'has_variations' => true,
        ]);
        $stillWater->images()->create(['url' => 'products/still-water.jpg', 'is_primary' => true]);
        
        ProductVariation::create(['product_id' => $stillWater->id, 'name' => '330ml', 'price' => 1.80, 'weight' => 330, 'sku' => 'WAT-ST-330']);
        ProductVariation::create(['product_id' => $stillWater->id, 'name' => '750ml', 'price' => 3.00, 'weight' => 750, 'sku' => 'WAT-ST-750']);

        $sparklingWater = Product::create([
            'category_id' => $categories['Water']->id,
            'name' => 'Sparkling Mineral Water',
            'slug' => Str::slug('Sparkling Mineral Water'),
            'description' => 'Refreshing carbonated sparkling mineral water in a glass bottle.',
            'status' => true,
            'has_variations' => true,
        ]);
        $sparklingWater->images()->create(['url' => 'products/sparkling-water.jpg', 'is_primary' => true]);
        
        ProductVariation::create(['product_id' => $sparklingWater->id, 'name' => '330ml', 'price' => 1.80, 'weight' => 330, 'sku' => 'WAT-SP-330']);
        ProductVariation::create(['product_id' => $sparklingWater->id, 'name' => '750ml', 'price' => 3.00, 'weight' => 750, 'sku' => 'WAT-SP-750']);


        // Connect Related Products
        $cappuccino->relatedProducts()->attach([
            $cinnamonBraid->id,
            $avoToast->id,
            $glazedDonut->id
        ]);

        $redVelvet->relatedProducts()->attach([
            $latte->id,
            $stickyToffee->id
        ]);

        $stickyToffee->relatedProducts()->attach([
            $stillWater->id,
            $cappuccino->id
        ]);

        // Update seeded products with default ingredients and allergens
        $ingredientsMap = [
            'red-velvet-cake-slice' => 'Wheat flour, unsalted butter, granulated sugar, fresh organic eggs, premium cocoa solids, double cream, vanilla bean paste, chocolate curls. ALLERGENS: CONTAINS GLUTEN, WHEAT, DAIRY, AND EGGS. CRAFTED IN A KITCHEN THAT HANDLES NUTS AND SESAME.',
            'chocolate-fudge-cake' => 'Wheat flour, unsalted butter, caster sugar, organic eggs, premium cocoa powder, dark chocolate (70%), double cream, raising agents. ALLERGENS: CONTAINS GLUTEN, WHEAT, DAIRY, AND EGGS. MAY CONTAIN TRACES OF SOY AND NUTS.',
            'strawberry-cheesecake' => 'Cream cheese, digestive biscuits (wheat flour, wholemeal), unsalted butter, caster sugar, double cream, fresh strawberries, strawberry glaze, vanilla extract. ALLERGENS: CONTAINS GLUTEN, WHEAT, AND DAIRY. MAY CONTAIN NUTS.',
            'classic-carrot-cake-slice' => 'Grated carrots, wheat flour, vegetable oil, brown sugar, organic eggs, chopped walnuts, spices (cinnamon, nutmeg), cream cheese frosting. ALLERGENS: CONTAINS GLUTEN, WHEAT, DAIRY, EGGS, AND WALNUTS (NUTS).',
            'lemon-drizzle-cake-slice' => 'Wheat flour, unsalted butter, granulated sugar, fresh eggs, fresh lemon juice, lemon zest, icing sugar, raising agents. ALLERGENS: CONTAINS GLUTEN, WHEAT, DAIRY, AND EGGS.',
            'sticky-toffee-pudding' => 'Finely chopped dates, wheat flour, dark brown sugar, unsalted butter, fresh eggs, double cream, black treacle, baking soda. ALLERGENS: CONTAINS GLUTEN, WHEAT, DAIRY, AND EGGS.',
            'bread-and-butter-pudding' => 'Sliced brioche bread, unsalted butter, raisins, fresh eggs, whole milk, double cream, caster sugar, nutmeg, cinnamon. ALLERGENS: CONTAINS GLUTEN, WHEAT, DAIRY, AND EGGS.',
            'cinnamon-braid' => 'Wheat flour, yeast, butter, sugar, ground cinnamon, organic eggs, milk, vanilla glaze. ALLERGENS: CONTAINS GLUTEN, WHEAT, DAIRY, AND EGGS.',
            'almond-cardamom-braid' => 'Wheat flour, yeast, butter, ground almonds, sugar, ground cardamom, organic eggs, flaked almonds. ALLERGENS: CONTAINS GLUTEN, WHEAT, DAIRY, EGGS, AND ALMONDS (NUTS).',
            'avocado-sourdough-toast' => 'Artisan sourdough bread (wheat flour, rye flour, water, salt), fresh Haas avocados, extra virgin olive oil, pumpkin seeds, red chili flakes, sea salt. ALLERGENS: CONTAINS GLUTEN AND WHEAT. VEGAN.',
            'nutella-banana-toast' => 'Thick brioche bread (wheat flour, eggs, butter), Nutella spread (sugar, palm oil, hazelnuts, cocoa, skimmed milk powder, soy lecithin), fresh bananas, powdered sugar. ALLERGENS: CONTAINS GLUTEN, WHEAT, DAIRY, SOY, AND HAZELNUTS (NUTS).',
            'classic-club-sandwich' => 'White sliced bread, grilled chicken breast, crispy bacon, iceberg lettuce, vine tomatoes, mayonnaise (egg yolk, oil, vinegar). ALLERGENS: CONTAINS GLUTEN, WHEAT, AND EGGS.',
            'caprese-ciabatta' => 'Toasted ciabatta bread, fresh buffalo mozzarella, vine tomatoes, basil pesto (basil, pine nuts, parmesan, olive oil), balsamic glaze. ALLERGENS: CONTAINS GLUTEN, WHEAT, DAIRY, AND PINE NUTS.',
            'glazed-ring-donut' => 'Wheat flour, yeast, milk, unsalted butter, organic eggs, sugar, vanilla glaze. ALLERGENS: CONTAINS GLUTEN, WHEAT, DAIRY, AND EGGS.',
            'salted-caramel-donut' => 'Wheat flour, yeast, milk, butter, eggs, salted caramel filling (sugar, condensed milk, butter, sea salt), honeycomb pieces. ALLERGENS: CONTAINS GLUTEN, WHEAT, DAIRY, AND EGGS.',
            'cappuccino' => 'Freshly ground arabica espresso beans, steamed whole milk, organic cocoa powder dusting. ALLERGENS: CONTAINS DAIRY.',
            'latte' => 'Freshly ground arabica espresso beans, steamed whole milk. ALLERGENS: CONTAINS DAIRY.',
            'espresso' => 'Freshly ground arabica espresso beans, hot water.',
            'still-mineral-water' => '100% natural still mineral water.',
            'sparkling-mineral-water' => '100% natural carbonated mineral water.',
        ];

        foreach ($ingredientsMap as $slug => $ingredients) {
            Product::where('slug', $slug)->update(['ingredients' => $ingredients]);
        }

        // Download and save all product images locally
        $this->downloadProductImages();
    }

    private function downloadProductImages(): void
    {
        $imageUrls = [
            'products/red-velvet.jpg' => 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?q=80&w=600&auto=format&fit=crop',
            'products/red-velvet-side.jpg' => 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?q=80&w=600&auto=format&fit=crop',
            'products/choc-fudge.jpg' => 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600&auto=format&fit=crop',
            'products/strawberry-cheesecake.jpg' => 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600&auto=format&fit=crop',
            'products/carrot-cake.jpg' => 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?q=80&w=600&auto=format&fit=crop',
            'products/lemon-drizzle.jpg' => 'https://images.unsplash.com/photo-1519869325930-281384150729?q=80&w=600&auto=format&fit=crop',
            'products/sticky-toffee.jpg' => 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=600&auto=format&fit=crop',
            'products/bread-butter.jpg' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop',
            'products/cinnamon-braid.jpg' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop',
            'products/almond-braid.jpg' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop',
            'products/avocado-toast.jpg' => 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?q=80&w=600&auto=format&fit=crop',
            'products/nutella-toast.jpg' => 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?q=80&w=600&auto=format&fit=crop',
            'products/club-sandwich.jpg' => 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=600&auto=format&fit=crop',
            'products/caprese-ciabatta.jpg' => 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=600&auto=format&fit=crop',
            'products/glazed-donut.jpg' => 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600&auto=format&fit=crop',
            'products/caramel-donut.jpg' => 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600&auto=format&fit=crop',
            'products/cappuccino.jpg' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop',
            'products/latte.jpg' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop',
            'products/espresso.jpg' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop',
            'products/still-water.jpg' => 'https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=600&auto=format&fit=crop',
            'products/sparkling-water.jpg' => 'https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=600&auto=format&fit=crop',
        ];

        foreach ($imageUrls as $path => $url) {
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
}
