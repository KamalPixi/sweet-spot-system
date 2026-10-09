<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreConfig;
use App\Models\StoreOpeningHour;
use App\Services\OrderStatusAutomationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderStatusAutomationTest extends TestCase
{
    use RefreshDatabase;

    protected Customer $customer;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        StoreConfig::create(['key' => 'store_name', 'value' => 'Sweet Spot Test']);
        StoreConfig::create(['key' => 'store_postcode', 'value' => 'W1D 1AN']);
        StoreConfig::create(['key' => 'auto_status_transition_enabled', 'value' => '1']);
        StoreConfig::create(['key' => 'auto_status_preparing_minutes', 'value' => '15']);
        StoreConfig::create(['key' => 'auto_status_ready_minutes', 'value' => '5']);

        StoreOpeningHour::create([
            'day_of_week' => 'Monday',
            'open_time' => '08:00:00',
            'close_time' => '22:00:00',
            'slot_interval' => 15,
            'is_closed' => false,
        ]);

        $category = Category::create([
            'name' => 'Desserts',
            'slug' => 'desserts',
            'status' => true,
            'order' => 1,
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Waffle Delight',
            'slug' => 'waffle-delight',
            'status' => true,
            'base_price' => 7.50,
            'has_variations' => false,
        ]);

        $this->customer = Customer::create([
            'first_name' => 'Sarah',
            'last_name' => 'Connor',
            'email' => 'sarah@example.com',
            'phone' => '+447123456789',
            'is_guest' => false,
        ]);
    }

    public function test_order_starts_in_pending_or_awaiting_payment(): void
    {
        $order = Order::create([
            'order_number' => 'SS-TEST01',
            'customer_id' => $this->customer->id,
            'type' => 'collection',
            'collection_time' => '2026-10-12 12:00:00',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'subtotal' => 7.50,
            'delivery_fee' => 0.00,
            'total' => 7.50,
        ]);

        $this->assertEquals('pending', $order->status);
        $this->assertEquals('unpaid', $order->payment_status);
        $this->assertNull($order->preparing_at);
    }

    public function test_cleared_payment_transitions_order_to_preparing_with_timestamp(): void
    {
        $order = Order::create([
            'order_number' => 'SS-TEST02',
            'customer_id' => $this->customer->id,
            'type' => 'collection',
            'collection_time' => '2026-10-12 12:00:00',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'subtotal' => 7.50,
            'delivery_fee' => 0.00,
            'total' => 7.50,
        ]);

        $automationService = app(OrderStatusAutomationService::class);
        $automationService->markAsPreparing($order);

        $order->refresh();
        $this->assertEquals('preparing', $order->status);
        $this->assertEquals('paid', $order->payment_status);
        $this->assertNotNull($order->preparing_at);
    }

    public function test_order_in_preparing_auto_advances_to_ready_after_15_minutes(): void
    {
        Carbon::setTestNow('2026-10-10 14:00:00');

        $order = Order::create([
            'order_number' => 'SS-TEST03',
            'customer_id' => $this->customer->id,
            'type' => 'collection',
            'collection_time' => '2026-10-10 14:30:00',
            'status' => 'preparing',
            'preparing_at' => now(),
            'payment_status' => 'paid',
            'subtotal' => 7.50,
            'delivery_fee' => 0.00,
            'total' => 7.50,
        ]);

        // Advance time by 10 minutes -> Still in preparing
        Carbon::setTestNow('2026-10-10 14:10:00');
        $this->artisan('orders:auto-advance')->assertSuccessful();

        $order->refresh();
        $this->assertEquals('preparing', $order->status);
        $this->assertNull($order->ready_at);

        // Advance time by another 6 minutes (total 16 minutes) -> Moves to ready
        Carbon::setTestNow('2026-10-10 14:16:00');
        $this->artisan('orders:auto-advance')->assertSuccessful();

        $order->refresh();
        $this->assertEquals('ready', $order->status);
        $this->assertNotNull($order->ready_at);
    }

    public function test_order_in_ready_auto_advances_to_completed_after_5_minutes(): void
    {
        Carbon::setTestNow('2026-10-10 14:00:00');

        $order = Order::create([
            'order_number' => 'SS-TEST04',
            'customer_id' => $this->customer->id,
            'type' => 'collection',
            'collection_time' => '2026-10-10 14:30:00',
            'status' => 'ready',
            'preparing_at' => now()->subMinutes(15),
            'ready_at' => now(),
            'payment_status' => 'paid',
            'subtotal' => 7.50,
            'delivery_fee' => 0.00,
            'total' => 7.50,
        ]);

        // Advance time by 3 minutes -> Still ready
        Carbon::setTestNow('2026-10-10 14:03:00');
        $this->artisan('orders:auto-advance')->assertSuccessful();

        $order->refresh();
        $this->assertEquals('ready', $order->status);
        $this->assertNull($order->completed_at);

        // Advance time by 6 minutes (total 6 minutes in ready) -> Moves to completed
        Carbon::setTestNow('2026-10-10 14:06:00');
        $this->artisan('orders:auto-advance')->assertSuccessful();

        $order->refresh();
        $this->assertEquals('completed', $order->status);
        $this->assertNotNull($order->completed_at);
    }

    public function test_declined_or_failed_payment_marks_order_cancelled(): void
    {
        $order = Order::create([
            'order_number' => 'SS-TEST05',
            'customer_id' => $this->customer->id,
            'type' => 'collection',
            'collection_time' => '2026-10-10 14:30:00',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'subtotal' => 7.50,
            'delivery_fee' => 0.00,
            'total' => 7.50,
        ]);

        $automationService = app(OrderStatusAutomationService::class);
        $automationService->markAsCancelled($order, 'Card declined by bank');

        $order->refresh();
        $this->assertEquals('cancelled', $order->status);
        $this->assertEquals('failed', $order->payment_status);
        $this->assertNotNull($order->cancelled_at);
    }

    public function test_admin_custom_timers_are_respected(): void
    {
        // Change preparing time to 8 minutes and ready time to 2 minutes
        StoreConfig::updateOrCreate(['key' => 'auto_status_preparing_minutes'], ['value' => '8']);
        StoreConfig::updateOrCreate(['key' => 'auto_status_ready_minutes'], ['value' => '2']);

        Carbon::setTestNow('2026-10-10 15:00:00');

        $order = Order::create([
            'order_number' => 'SS-TEST06',
            'customer_id' => $this->customer->id,
            'type' => 'collection',
            'collection_time' => '2026-10-10 15:30:00',
            'status' => 'preparing',
            'preparing_at' => now(),
            'payment_status' => 'paid',
            'subtotal' => 7.50,
            'delivery_fee' => 0.00,
            'total' => 7.50,
        ]);

        // Advance 9 minutes -> Moves to ready
        Carbon::setTestNow('2026-10-10 15:09:00');
        $this->artisan('orders:auto-advance')->assertSuccessful();

        $order->refresh();
        $this->assertEquals('ready', $order->status);

        // Advance 3 minutes -> Moves to completed
        Carbon::setTestNow('2026-10-10 15:12:00');
        $this->artisan('orders:auto-advance')->assertSuccessful();

        $order->refresh();
        $this->assertEquals('completed', $order->status);
    }
}
