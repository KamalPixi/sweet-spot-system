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
        Schema::create('print_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->string('job_token')->unique();
            $table->string('printer_mac')->nullable()->index();
            $table->string('status')->default('queued')->index(); // queued, printing, printed, failed
            $table->string('content_type')->default('text/vnd.star.markup');
            $table->longText('content');
            $table->text('error_message')->nullable();
            $table->integer('attempts')->default(0);
            $table->timestamp('printed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('print_jobs');
    }
};
