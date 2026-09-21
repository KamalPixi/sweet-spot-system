<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->string('author_name');
            $table->text('quote');
            $table->string('source')->default('Google Review');
            $table->unsignedTinyInteger('rating')->default(5);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Seed initial reviews for Local Love section
        DB::table('reviews')->insert([
            [
                'author_name' => 'Sarah A.',
                'quote' => 'The cookie dough is absolutely out of this world! Warm, gooey, and perfect.',
                'source' => 'Google Review',
                'rating' => 5,
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'author_name' => 'Michael R.',
                'quote' => 'Best dessert spot in Barking! Exceptional service and the milkshakes are unmatched.',
                'source' => 'Google Review',
                'rating' => 5,
                'is_active' => true,
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'author_name' => 'Emma T.',
                'quote' => 'Super fast delivery and everything arrived piping hot. Will definitely order again!',
                'source' => 'Google Review',
                'rating' => 5,
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
