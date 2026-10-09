<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\StoreConfig;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GlobalPayIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected Product $product;
    protected ProductVariation $variation;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'email' => 'admin@sweetspot.com',
        ]);

        StoreConfig::create(['key' => 'store_name', 'value' => 'Sweet Spot Test Kitchen']);
        StoreConfig::create(['key' => 'payment_gateway', 'value' => 'globalpay']);
        StoreConfig::create(['key' => 'globalpay_app_id', 'value' => 'mock_app_id_12345']);
        StoreConfig::create(['key' => 'globalpay_app_key', 'value' => 'mock_app_key_67890']);
        StoreConfig::create(['key' => 'globalpay_environment', 'value' => 'sandbox']);

        $category = Category::create([
            'name' => 'Desserts',
            'slug' => 'desserts',
            'status' => true,
            'order' => 1
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Warm Cookie Dough',
            'slug' => 'warm-cookie-dough',
            'status' => true,
            'has_variations' => false,
            'base_price' => 7.50,
        ]);

        $this->variation = ProductVariation::create([
            'product_id' => $this->product->id,
            'name' => 'Single Portion',
            'price' => 7.50,
            'stock' => 20,
        ]);
    }

    /**
     * 1. Test Payment Providers API returns active gateway config.
     */
    public function test_payment_providers_endpoint_returns_globalpay_config(): void
    {
        $response = $this->getJson('/api/payment/providers');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'active_gateway' => 'globalpay',
                    'globalpay' => [
                        'is_configured' => true,
                        'app_id' => 'mock_app_id_12345',
                        'environment' => 'sandbox',
                    ]
                ]
            ]);
    }

    /**
     * 2. Test Customer can place an order with Global Payments method.
     */
    public function test_order_creation_with_globalpay_payment_method(): void
    {
        $response = $this->postJson('/api/orders', [
            'type' => 'dine_in',
            'table_number' => 'Table 8',
            'payment_method' => 'globalpay',
            'customer' => [
                'first_name' => 'Sarah',
                'last_name' => 'Connor',
                'phone' => '07123456789',
                'email' => 'sarah@example.com',
            ],
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_variation_id' => $this->variation->id,
                    'quantity' => 2,
                ]
            ]
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $orderNumber = $response->json('data.order_number');
        $this->assertNotEmpty($orderNumber);

        $order = Order::where('order_number', $orderNumber)->first();
        $this->assertNotNull($order);
        $this->assertEquals('globalpay', $order->payment_method);
        $this->assertEquals('awaiting_payment', $order->status);
        $this->assertEquals('unpaid', $order->payment_status);
    }

    /**
     * 3. Test Global Payments charge processing marks order as paid and pending.
     */
    public function test_globalpay_charge_processing_marks_order_as_paid(): void
    {
        $customer = \App\Models\Customer::create([
            'first_name' => 'Sarah',
            'last_name' => 'Connor',
            'phone' => '+447000111222',
            'is_guest' => true,
        ]);

        $order = Order::create([
            'order_number' => 'SS-TESTGP01',
            'customer_id' => $customer->id,
            'type' => 'dine_in',
            'table_number' => 'Table 1',
            'status' => 'awaiting_payment',
            'subtotal' => 15.00,
            'delivery_fee' => 0.00,
            'total' => 15.00,
            'payment_status' => 'unpaid',
            'payment_method' => 'globalpay',
        ]);

        $response = $this->postJson('/api/payment/globalpay/process', [
            'order_number' => 'SS-TESTGP01',
            'card_number' => '4000000000000002',
            'expiry_month' => '12',
            'expiry_year' => '28',
            'cvv' => '123',
            'cardholder_name' => 'Sarah Connor',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'order_number' => 'SS-TESTGP01',
            ]);

        $order->refresh();
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals('pending', $order->status);
        $this->assertNotEmpty($order->payment_transaction_id);
    }

    /**
     * 4. Test Admin can test connection with credentials.
     */
    public function test_admin_can_test_globalpay_connection(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/payment/test-connection', [
            'provider' => 'globalpay',
            'globalpay_app_id' => 'test_app_id',
            'globalpay_app_key' => 'test_app_key',
        ]);

        $response->assertStatus(200);
        $this->assertArrayHasKey('success', $response->json());
    }
}
