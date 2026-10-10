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
        if (Schema::hasTable('categories') && !Schema::hasColumn('categories', 'box_options')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->json('box_options')->nullable()->after('available_days');
            });
        }

        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                if (!Schema::hasColumn('order_items', 'category_id')) {
                    $table->foreignId('category_id')->nullable()->after('order_id')->constrained('categories')->nullOnDelete();
                }
                if (!Schema::hasColumn('order_items', 'is_box')) {
                    $table->boolean('is_box')->default(false)->after('variation_name');
                }
                if (!Schema::hasColumn('order_items', 'box_size')) {
                    $table->integer('box_size')->nullable()->after('is_box');
                }
                if (!Schema::hasColumn('order_items', 'box_items')) {
                    $table->json('box_items')->nullable()->after('box_size');
                }
                if (Schema::hasColumn('order_items', 'product_id')) {
                    $table->foreignId('product_id')->nullable()->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('categories') && Schema::hasColumn('categories', 'box_options')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropColumn('box_options');
            });
        }

        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropConstrainedForeignId('category_id');
                $table->dropColumn(['is_box', 'box_size', 'box_items']);
            });
        }
    }
};
