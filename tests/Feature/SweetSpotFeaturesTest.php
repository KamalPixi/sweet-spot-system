<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\PrintJob;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\StoreConfig;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SweetSpotFeaturesTest extends TestCase
{
    use RefreshDatabase;

    protected Product $product;
    protected ProductVariation $variation;

    protected function setUp(): void
    {
        parent::setUp();

        StoreConfig::create(['key' => 'store_name', 'value' => 'Sweet Spot Test Kitchen']);
        StoreConfig::create(['key' => 'store_phone', 'value' => '+442079460000']);
        StoreConfig::create(['key' => 'store_postcode', 'value' => 'W1D 1AN']);
        StoreConfig::create(['key' => 'store_delivery_radius_miles', 'value' => '5.0']);
        StoreConfig::create(['key' => 'store_delivery_base_fee', 'value' => '3.00']);

        $category = Category::create([
            'name' => 'Signature Bakes',
            'slug' => 'signature-bakes',
            'status' => true,
            'order' => 1
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Lotus Biscoff Pudding',
            'slug' => 'lotus-biscoff-pudding',
            'status' => true,
            'has_variations' => true,
        ]);

        $this->variation = ProductVariation::create([
            'product_id' => $this->product->id,
            'name' => 'Standard Jar',
            'price' => 6.50,
            'stock' => 50,
        ]);
    }

    /**
     * 1. Test Table QR code validation & Dine-In Order Placement.
     */
    public function test_customer_can_order_for_dine_in_with_table_number(): void
    {
        // Verify table validation endpoint
        $verifyRes = $this->getJson('/api/tables/validate/14');
        $verifyRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('table_number', '14');

        // Place Dine-In order
        $payload = [
            'type' => 'dine_in',
            'table_number' => '14',
            'notes' => 'Extra spoons please',
            'payment_method' => 'cash_in_store',
            'customer' => [
                'first_name' => 'Alex',
                'last_name' => 'TableGuest',
                'phone' => '+447000111222',
            ],
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_variation_id' => $this->variation->id,
                    'quantity' => 2,
                ]
            ]
        ];

        $orderRes = $this->postJson('/api/orders', $payload);
        $orderRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.type', 'dine_in')
            ->assertJsonPath('data.table_number', '14')
            ->assertJsonPath('data.delivery_fee', '0.00')
            ->assertJsonPath('data.total', '13.00');

        $this->assertDatabaseHas('orders', [
            'type' => 'dine_in',
            'table_number' => '14',
            'notes' => 'Extra spoons please',
            'subtotal' => 13.00,
            'delivery_fee' => 0.00,
            'total' => 13.00,
        ]);

        // Verify a Star CloudPRNT print job was automatically created
        $this->assertDatabaseHas('print_jobs', [
            'status' => 'queued',
        ]);
    }

    /**
     * 2. Test Uber Direct quote and webhook lifecycle.
     */
    public function test_uber_direct_quotation_and_webhook(): void
    {
        // Test quote endpoint
        $quoteRes = $this->postJson('/api/delivery/uber/quote', [
            'address_line_1' => '221B Baker Street',
            'city' => 'London',
            'postcode' => 'NW1 6XE',
        ]);

        $quoteRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => ['id', 'fee', 'currency', 'duration_minutes']
            ]);

        // Create an order for Uber delivery
        $customer = Customer::create([
            'first_name' => 'Sherlock',
            'last_name' => 'Holmes',
            'phone' => '+447000999888',
            'is_guest' => true,
        ]);

        $order = Order::create([
            'order_number' => 'SS-UBER-101',
            'customer_id' => $customer->id,
            'type' => 'delivery',
            'status' => 'pending',
            'delivery_provider' => 'uber_direct',
            'uber_delivery_id' => 'del_uber_test_123',
            'subtotal' => 15.00,
            'delivery_fee' => 4.50,
            'total' => 19.50,
        ]);

        // Simulate incoming Uber Direct Webhook: Courier assigned and en route
        $webhookPayload = [
            'event_type' => 'delivery.status_changed',
            'delivery_id' => 'del_uber_test_123',
            'data' => [
                'status' => 'pickup',
                'courier' => [
                    'name' => 'Dave Driver',
                    'phone_number' => '+447111222333',
                ],
                'location' => [
                    'lat' => 51.5237,
                    'lng' => -0.1585,
                ]
            ]
        ];

        $webhookRes = $this->postJson('/api/webhooks/uber-direct', $webhookPayload);
        $webhookRes->assertStatus(200)
            ->assertJsonPath('status', 'processed');

        $order->refresh();
        $this->assertEquals('pickup', $order->uber_status);
        $this->assertEquals('Dave Driver', $order->uber_courier_name);
        $this->assertEquals('+447111222333', $order->uber_courier_phone);
        $this->assertEquals(51.5237, $order->uber_courier_location['lat']);

        // Now test tracking lookup endpoint exposes these live fields
        $trackRes = $this->getJson("/api/orders/track/{$order->order_number}");
        $trackRes->assertStatus(200)
            ->assertJsonPath('data.uber_status', 'pickup')
            ->assertJsonPath('data.uber_courier_name', 'Dave Driver')
            ->assertJsonPath('data.uber_courier_location.lat', 51.5237);
    }

    /**
     * 3. Test Star Micronics CloudPRNT (TSP100) polling, job download, and delete lifecycle.
     */
    public function test_star_cloudprnt_polling_and_job_lifecycle(): void
    {
        // Create an order
        $customer = Customer::create([
            'first_name' => 'Alice',
            'last_name' => 'Wonderland',
            'phone' => '+447000333444',
            'is_guest' => true,
        ]);

        $order = Order::create([
            'order_number' => 'SS-PRINT-001',
            'customer_id' => $customer->id,
            'type' => 'dine_in',
            'table_number' => '7',
            'status' => 'pending',
            'subtotal' => 6.50,
            'delivery_fee' => 0.00,
            'total' => 6.50,
            'payment_status' => 'paid',
        ]);

        $order->items()->create([
            'product_id' => $this->product->id,
            'product_variation_id' => $this->variation->id,
            'product_name' => 'Lotus Biscoff Pudding',
            'variation_name' => 'Standard Jar',
            'price' => 6.50,
            'quantity' => 1,
            'total' => 6.50,
        ]);

        // 1. Admin triggers manual print
        $admin = User::create([
            'name' => 'Kitchen Admin',
            'email' => 'kitchen@sweetspot.com',
            'password' => bcrypt('secret'),
        ]);

        $printRes = $this->actingAs($admin, 'sanctum')->postJson("/api/admin/orders/{$order->id}/print");
        $printRes->assertStatus(200)
            ->assertJsonPath('success', true);

        $jobToken = $printRes->json('data.job_token');
        $this->assertNotEmpty($jobToken);

        // 2. Printer Polls (POST /api/cloudprnt/poll)
        $pollRes = $this->postJson('/api/cloudprnt/poll', [
            'printerMAC' => '00:11:62:04:04:14',
            'statusCode' => '23 0 0 0 0 0',
        ]);

        $pollRes->assertStatus(200)
            ->assertJsonPath('jobReady', true)
            ->assertJsonPath('jobToken', $jobToken);

        // 3. Printer Downloads Ticket (GET /api/cloudprnt/job/{jobToken})
        $getJobRes = $this->get("/api/cloudprnt/job/{$jobToken}");
        $getJobRes->assertStatus(200);
        $this->assertStringContainsStringIgnoringCase('Sweet Spot Test Kitchen', $getJobRes->getContent());
        $this->assertStringContainsString('DINE-IN - TABLE #7', $getJobRes->getContent());
        $this->assertStringContainsString('SS-PRINT-001', $getJobRes->getContent());
        $this->assertStringContainsString('Lotus Biscoff Pudding', $getJobRes->getContent());

        // 4. Printer Confirms Finished Print (DELETE /api/cloudprnt/job/{jobToken})
        $deleteRes = $this->deleteJson("/api/cloudprnt/job/{$jobToken}?code=200");
        $deleteRes->assertStatus(200);

        // Assert job status changed to 'printed'
        $job = PrintJob::where('job_token', $jobToken)->first();
        $this->assertEquals('printed', $job->status);
        $this->assertNotNull($job->printed_at);

        $order->refresh();
        $this->assertEquals(1, $order->print_count);
        $this->assertNotNull($order->printed_at);

        // 5. Subsequent poll shows no job ready
        $pollAfterRes = $this->postJson('/api/cloudprnt/poll', [
            'printerMAC' => '00:11:62:04:04:14',
            'statusCode' => '23 0 0 0 0 0',
        ]);

        $pollAfterRes->assertStatus(200)
            ->assertJsonPath('jobReady', false);
    }
}
