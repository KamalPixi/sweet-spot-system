<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('store_configs')->where('key', 'brand_logos')->delete();
    }

    public function down(): void
    {
        // No rollback needed for removed section
    }
};
