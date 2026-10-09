<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->string('google_review_id')->nullable()->unique()->after('id');
            $table->string('author_photo_url', 1000)->nullable()->after('author_name');
            $table->string('relative_time')->nullable()->after('source');
            $table->string('review_url', 1000)->nullable()->after('relative_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn([
                'google_review_id',
                'author_photo_url',
                'relative_time',
                'review_url',
            ]);
        });
    }
};
