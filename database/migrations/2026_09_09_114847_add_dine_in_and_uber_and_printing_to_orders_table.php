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
            // Table / Dine-In fields
            $table->string('table_number')->nullable()->after('type');

            // Uber Direct fields
            $table->string('delivery_provider')->nullable()->default(null)->after('delivery_fee'); // uber_direct, manual
            $table->string('uber_delivery_id')->nullable()->after('delivery_provider');
            $table->text('uber_tracking_url')->nullable()->after('uber_delivery_id');
            $table->string('uber_status')->nullable()->after('uber_tracking_url'); // pending, pickup, dropoff, delivered, canceled
            $table->string('uber_courier_name')->nullable()->after('uber_status');
            $table->string('uber_courier_phone')->nullable()->after('uber_courier_name');
            $table->json('uber_courier_location')->nullable()->after('uber_courier_phone');
            $table->decimal('uber_fee', 10, 2)->nullable()->after('uber_courier_location');

            // Printing status fields
            $table->timestamp('printed_at')->nullable()->after('payment_transaction_id');
            $table->integer('print_count')->default(0)->after('printed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'table_number',
                'delivery_provider',
                'uber_delivery_id',
                'uber_tracking_url',
                'uber_status',
                'uber_courier_name',
                'uber_courier_phone',
                'uber_courier_location',
                'uber_fee',
                'printed_at',
                'print_count'
            ]);
        });
    }
};
