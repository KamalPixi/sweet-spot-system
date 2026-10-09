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
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('preparing_at')->nullable()->after('status');
            $table->timestamp('ready_at')->nullable()->after('preparing_at');
            $table->timestamp('completed_at')->nullable()->after('ready_at');
            $table->timestamp('cancelled_at')->nullable()->after('completed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'preparing_at',
                'ready_at',
                'completed_at',
                'cancelled_at',
            ]);
        });
    }
};
