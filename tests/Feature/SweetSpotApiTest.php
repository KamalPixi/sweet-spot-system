<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\StoreConfig;
use App\Models\StoreOpeningHour;
use App\Models\Customer;
use App\Models\Address;
use App\Models\Order;
use App\Models\NewsletterSubscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SweetSpotApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic operational configurations
        StoreConfig::create(['key' => 'store_name', 'value' => 'Sweet Spot System Test']);
        StoreConfig::create(['key' => 'store_postcode', 'value' => 'W1D 1AN']); // Soho
        StoreConfig::create(['key' => 'store_delivery_radius_miles', 'value' => '5.0']);
        StoreConfig::create(['key' => 'store_delivery_base_fee', 'value' => '2.50']);
        StoreConfig::create(['key' => 'store_delivery_charge_per_mile', 'value' => '1.50']);

        // Seed store opening hours for Mondays
        StoreOpeningHour::create([
            'day_of_week' => 'Monday',
            'open_time' => '08:00:00',
            'close_time' => '22:00:00',
            'slot_interval' => 15,
            'is_closed' => false,
        ]);

        // Seed a sample category & product with variations
        $category = Category::create([
            'name' => 'Cakes',
            'slug' => 'cakes',
            'status' => true,
            'order' => 1
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Red Velvet Cake',
            'slug' => 'red-velvet-cake',
            'status' => true,
            'has_variations' => true,
        ]);

        ProductVariation::create([
            'product_id' => $product->id,
            'name' => 'Single Slice',
            'price' => 4.50,
            'weight' => 200,
            'sku' => 'CAKE-RV-SLICE'
        ]);

        ProductVariation::create([
            'product_id' => $product->id,
            'name' => 'Whole Cake',
            'price' => 35.00,
            'weight' => 1500,
            'sku' => 'CAKE-RV-WHOLE'
        ]);
    }

    /**
     * Test storefront configs retrieve.
     */
    public function test_can_retrieve_storefront_configs(): void
    {
        $response = $this->getJson('/api/configs');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.store_name', 'Sweet Spot System Test')
            ->assertJsonPath('data.store_postcode', 'W1D 1AN');
    }

    /**
     * Test postcode distance check.
     */
    public function test_postcode_checks_work(): void
    {
        // Check invalid postcode format
        $response = $this->postJson('/api/check-postcode', ['postcode' => 'INVALID']);
        $response->assertStatus(422);

        // Check valid postcode that maps nearby (using the deterministic geocoder test)
        // Store is W1D 1AN. Let's use W1D 1AN itself (should have 0 distance, which is allowed)
        $response = $this->postJson('/api/check-postcode', ['postcode' => 'W1D 1AN']);
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_allowed', true)
            ->assertJsonPath('data.distance_miles', 0)
            ->assertJsonPath('data.delivery_fee', 2.50); // only base fee
    }

    /**
     * Test active catalog retrieval.
     */
    public function test_can_retrieve_menu_catalog(): void
    {
        $response = $this->getJson('/api/menu-catalog');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'products' => [
                            '*' => [
                                'id',
                                'name',
                                'has_variations',
                                'variations' => [
                                    '*' => ['id', 'name', 'price']
                                ]
                            ]
                        ]
                    ]
                ]
            ]);
    }

    /**
     * Test newsletter subscription.
     */
    public function test_can_subscribe_to_newsletter(): void
    {
        $response = $this->postJson('/api/newsletter/subscribe', [
            'email' => 'subscriber@test.com'
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('newsletter_subscribers', [
            'email' => 'subscriber@test.com',
            'is_active' => true
        ]);
    }

    /**
     * Test successful delivery guest order checkout.
     */
    public function test_guest_can_checkout_for_delivery(): void
    {
        $product = Product::first();
        $variation = ProductVariation::first();

        $payload = [
            'type' => 'delivery',
            'notes' => 'Leave at the front gate, please.',
            'customer' => [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'phone' => '+447123456789',
                'email' => 'john.doe@example.com'
            ],
            'address' => [
                'address_line_1' => '10 Soho Square',
                'city' => 'London',
                'postcode' => 'W1D 1AN' // Same as store postcode to avoid out of radius errors
            ],
            'items' => [
                [
                    'product_id' => $product->id,
                    'product_variation_id' => $variation->id,
                    'quantity' => 2
                ]
            ]
        ];

        $response = $this->postJson('/api/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'subtotal',
                    'delivery_fee',
                    'total',
                    'customer' => ['first_name', 'last_name', 'phone'],
                    'delivery_address' => ['address_line_1', 'postcode']
                ]
            ]);

        $this->assertDatabaseHas('customers', [
            'first_name' => 'John',
            'phone' => '+447123456789',
            'is_guest' => true
        ]);

        $this->assertDatabaseHas('orders', [
            'type' => 'delivery',
            'notes' => 'Leave at the front gate, please.',
            'payment_status' => 'unpaid',
            'subtotal' => 9.00, // 4.50 * 2
            'delivery_fee' => 2.50,
            'total' => 11.50
        ]);
    }

    /**
     * Test guest can checkout with stripe payment method.
     */
    public function test_guest_can_checkout_with_stripe_payment_method(): void
    {
        $product = Product::first();
        $variation = ProductVariation::first();

        $payload = [
            'type' => 'delivery',
            'notes' => 'Stripe order test.',
            'payment_method' => 'stripe',
            'customer' => [
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'phone' => '+447987654321',
                'email' => 'jane.smith@example.com'
            ],
            'address' => [
                'address_line_1' => '20 Soho Square',
                'city' => 'London',
                'postcode' => 'W1D 1AN'
            ],
            'items' => [
                [
                    'product_id' => $product->id,
                    'product_variation_id' => $variation->id,
                    'quantity' => 1
                ]
            ]
        ];

        $response = $this->postJson('/api/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'client_secret',
                ]
            ]);

        $orderId = $response->json('data.id');
        $order = Order::find($orderId);

        $this->assertNotNull($order->payment_transaction_id);
        $this->assertStringStartsWith('mock_txn_', $order->payment_transaction_id);
        $this->assertStringStartsWith('mock_secret_', $response->json('data.client_secret'));
    }

    /**
     * Test guest can checkout with email only (minimal guest fields).
     */
    public function test_guest_can_checkout_with_email_only(): void
    {
        $product = Product::first();
        $variation = ProductVariation::first();

        $payload = [
            'type' => 'delivery',
            'notes' => 'Email only guest order test.',
            'payment_method' => 'stripe',
            'customer' => [
                'email' => 'guest-email@example.com'
            ],
            'address' => [
                'address_line_1' => '30 Soho Square',
                'city' => 'London',
                'postcode' => 'W1D 1AN'
            ],
            'items' => [
                [
                    'product_id' => $product->id,
                    'product_variation_id' => $variation->id,
                    'quantity' => 1
                ]
            ]
        ];

        $response = $this->postJson('/api/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $orderId = $response->json('data.id');
        $order = Order::find($orderId);
        $customer = $order->customer;

        $this->assertNull($customer->first_name);
        $this->assertNull($customer->last_name);
        $this->assertEquals('guest-email@example.com', $customer->email);
        $this->assertNotNull($customer->phone);
        $this->assertStringStartsWith('+4479', $customer->phone);
    }


    /**
     * Test Stripe webhook payment_intent.succeeded updates order state.
     */
    public function test_stripe_webhook_succeeded_updates_order_state(): void
    {
        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane.smith@example.com',
            'phone' => '+447987654321',
            'is_guest' => true,
        ]);

        $order = Order::create([
            'customer_id' => $customer->id,
            'order_number' => 'SS-ST-SUCCESS',
            'type' => 'collection',
            'status' => 'unpaid', // initial status
            'payment_status' => 'unpaid',
            'payment_method' => 'stripe',
            'payment_transaction_id' => 'pi_test_success_123',
            'subtotal' => 10.00,
            'delivery_fee' => 0.00,
            'total' => 10.00,
        ]);

        $payload = [
            'type' => 'payment_intent.succeeded',
            'data' => [
                'object' => [
                    'id' => 'pi_test_success_123',
                    'amount' => 1000,
                    'currency' => 'gbp',
                ]
            ]
        ];

        $response = $this->postJson('/api/payment/webhook', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $order->refresh();
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals('pending', $order->status);
    }

    /**
     * Test Stripe webhook payment_intent.payment_failed updates order state.
     */
    public function test_stripe_webhook_failed_updates_order_state(): void
    {
        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane.smith@example.com',
            'phone' => '+447987654321',
            'is_guest' => true,
        ]);

        $order = Order::create([
            'customer_id' => $customer->id,
            'order_number' => 'SS-ST-FAILED',
            'type' => 'collection',
            'status' => 'unpaid',
            'payment_status' => 'unpaid',
            'payment_method' => 'stripe',
            'payment_transaction_id' => 'pi_test_failed_123',
            'subtotal' => 10.00,
            'delivery_fee' => 0.00,
            'total' => 10.00,
        ]);

        $payload = [
            'type' => 'payment_intent.payment_failed',
            'data' => [
                'object' => [
                    'id' => 'pi_test_failed_123',
                    'amount' => 1000,
                    'currency' => 'gbp',
                ]
            ]
        ];

        $response = $this->postJson('/api/payment/webhook', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $order->refresh();
        $this->assertEquals('failed', $order->payment_status);
        $this->assertEquals('cancelled', $order->status);
    }


    /**
     * Test admin can retrieve and update opening hours.
     */
    public function test_admin_can_manage_opening_hours(): void
    {
        $admin = \App\Models\User::create([
            'name' => 'Test Admin',
            'email' => 'admin-test@test.com',
            'password' => bcrypt('password'),
        ]);

        // Unauthenticated request should fail
        $response = $this->getJson('/api/admin/opening-hours');
        $response->assertStatus(401);

        // Authenticated request should succeed
        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/opening-hours');
        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Update request
        $hour = StoreOpeningHour::first();
        $updateResponse = $this->actingAs($admin, 'sanctum')->putJson("/api/admin/opening-hours/{$hour->id}", [
            'open_time' => '09:00:00',
            'close_time' => '21:00:00',
            'slot_interval' => 30,
            'is_closed' => true,
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('store_opening_hours', [
            'id' => $hour->id,
            'open_time' => '09:00:00',
            'close_time' => '21:00:00',
            'slot_interval' => 30,
            'is_closed' => true,
        ]);
    }

    /**
     * Test public retrieval of opening hours.
     */
    public function test_can_retrieve_public_opening_hours(): void
    {
        $response = $this->getJson('/api/opening-hours');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }
}

