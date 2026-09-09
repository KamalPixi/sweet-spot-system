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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('delivery_address_id')->nullable()->constrained('addresses')->nullOnDelete();
            $table->string('type'); // 'delivery' or 'collection'
            $table->string('status')->default('pending'); // pending, paid, preparing, ready, completed, cancelled
            $table->string('collection_time')->nullable(); // stored as formatted date-time string or raw datetime
            $table->text('notes')->nullable(); // order instructions
            $table->decimal('subtotal', 10, 2);
            $table->decimal('delivery_fee', 10, 2)->default(0.00);
            $table->decimal('total', 10, 2);
            $table->string('payment_status')->default('unpaid'); // unpaid, paid, failed
            $table->string('payment_method')->nullable(); // stripe, cash, etc.
            $table->string('payment_transaction_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
