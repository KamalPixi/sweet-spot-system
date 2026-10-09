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
     * 5. Test client can generate Drop-In UI client access token.
     */
    public function test_client_can_generate_dropin_ui_token(): void
    {
        $response = $this->postJson('/api/payment/globalpay/token', []);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertNotEmpty($response->json('token'));
        $this->assertNotEmpty($response->json('environment'));
    }

    /**
     * 6. Test Webhook: Dispute / Chargeback marks order as disputed and notifies admin.
     */
    public function test_webhook_dispute_event_marks_order_as_disputed_and_notifies_admin(): void
    {
        \Illuminate\Support\Facades\Notification::fake();

        $customer = \App\Models\Customer::create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '+447000111333',
            'is_guest' => true,
        ]);

        $order = Order::create([
            'order_number' => 'SS-DISPUTE01',
            'customer_id' => $customer->id,
            'type' => 'delivery',
            'status' => 'completed',
            'subtotal' => 30.00,
            'delivery_fee' => 2.50,
            'total' => 32.50,
            'payment_status' => 'paid',
            'payment_method' => 'globalpay',
            'payment_transaction_id' => 'trn_dispute_123',
        ]);

        $payload = [
            'event' => 'dispute.created',
            'data' => [
                'id' => 'trn_dispute_123',
                'reference' => 'SS-DISPUTE01',
                'dispute_id' => 'disp_998877',
                'reason' => 'Fraudulent transaction reported by cardholder bank',
                'amount' => '3250',
            ],
        ];

        $response = $this->postJson('/api/webhooks/globalpay', $payload);

        $response->assertStatus(200);

        $order->refresh();
        $this->assertEquals('disputed', $order->payment_status);
        $this->assertStringContainsString('PAYMENT DISPUTED / CHARGEBACK', $order->notes);
        $this->assertStringContainsString('disp_998877', $order->notes);

        \Illuminate\Support\Facades\Notification::assertSentTo(
            $this->admin,
            \App\Notifications\PaymentDisputeAlertNotification::class
        );
    }

    /**
     * 7. Test Webhook: Fraud / Risk alert marks order and notifies admin.
     */
    public function test_webhook_fraud_alert_marks_order_and_notifies_admin(): void
    {
        \Illuminate\Support\Facades\Notification::fake();

        $customer = \App\Models\Customer::create([
            'first_name' => 'Alice',
            'last_name' => 'Smith',
            'phone' => '+447000111444',
            'is_guest' => true,
        ]);

        $order = Order::create([
            'order_number' => 'SS-FRAUD01',
            'customer_id' => $customer->id,
            'type' => 'collection',
            'status' => 'pending',
            'subtotal' => 20.00,
            'delivery_fee' => 0.00,
            'total' => 20.00,
            'payment_status' => 'paid',
            'payment_method' => 'globalpay',
            'payment_transaction_id' => 'trn_fraud_456',
        ]);

        $payload = [
            'event' => 'fraud.alert',
            'data' => [
                'reference' => 'SS-FRAUD01',
                'reason' => 'Stolen card credential match in global database',
            ],
        ];

        $response = $this->postJson('/api/webhooks/globalpay', $payload);
        $response->assertStatus(200);

        $order->refresh();
        $this->assertEquals('disputed', $order->payment_status);
        $this->assertStringContainsString('FRAUD ALERT', $order->notes);

        \Illuminate\Support\Facades\Notification::assertSentTo(
            $this->admin,
            \App\Notifications\PaymentDisputeAlertNotification::class
        );
    }

    /**
     * 8. Test Webhook: Refund / Reversal cancels order and marks payment as refunded.
     */
    public function test_webhook_refund_marks_order_as_refunded(): void
    {
        $customer = \App\Models\Customer::create([
            'first_name' => 'Bob',
            'last_name' => 'Jones',
            'phone' => '+447000111555',
            'is_guest' => true,
        ]);

        $order = Order::create([
            'order_number' => 'SS-REFUND01',
            'customer_id' => $customer->id,
            'type' => 'collection',
            'status' => 'pending',
            'subtotal' => 18.00,
            'delivery_fee' => 0.00,
            'total' => 18.00,
            'payment_status' => 'paid',
            'payment_method' => 'globalpay',
            'payment_transaction_id' => 'trn_refund_789',
        ]);

        $payload = [
            'event' => 'transaction.refunded',
            'data' => [
                'reference' => 'SS-REFUND01',
            ],
        ];

        $response = $this->postJson('/api/webhooks/globalpay', $payload);
        $response->assertStatus(200);

        $order->refresh();
        $this->assertEquals('refunded', $order->payment_status);
        $this->assertEquals('cancelled', $order->status);
    }
}
