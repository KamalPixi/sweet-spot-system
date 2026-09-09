<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Exception;

class UberDirectService
{
    protected ?string $clientId;
    protected ?string $clientSecret;
    protected ?string $customerId;
    protected string $env;
    protected string $baseUrl;
    protected StoreConfigService $storeConfigService;

    public function __construct(StoreConfigService $storeConfigService)
    {
        $this->storeConfigService = $storeConfigService;
        $this->clientId = config('services.uber_direct.client_id');
        $this->clientSecret = config('services.uber_direct.client_secret');
        $this->customerId = config('services.uber_direct.customer_id');
        $this->env = config('services.uber_direct.env', 'sandbox');

        $this->baseUrl = $this->env === 'production'
            ? 'https://api.uber.com/v1/customers'
            : 'https://api.uber.com/v1/customers';
    }

    /**
     * Check whether Uber Direct credentials are fully configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->clientId) && !empty($this->clientSecret) && !empty($this->customerId);
    }

    /**
     * Obtain an OAuth 2.0 Bearer Token (Cached for duration).
     */
    public function getAccessToken(): string
    {
        return Cache::remember('uber_direct_oauth_token', 1800, function () {
            if (!$this->isConfigured()) {
                return 'mock_uber_direct_token';
            }

            $response = Http::asForm()->post('https://auth.uber.com/oauth/v2/token', [
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'grant_type' => 'client_credentials',
                'scope' => 'eats.deliveries',
            ]);

            if ($response->failed()) {
                Log::error('Uber Direct OAuth failure: ' . $response->body());
                throw new Exception('Failed to authenticate with Uber Direct API.');
            }

            $data = $response->json();
            return $data['access_token'];
        });
    }

    /**
     * Request a delivery price & ETA quote from Uber Direct.
     */
    public function getDeliveryQuote(array $dropoffAddress, ?array $pickupAddress = null): array
    {
        if (!$this->isConfigured()) {
            // Realistic simulated mock response for local testing and sandbox setup
            return [
                'id' => 'mock_quote_' . uniqid(),
                'fee' => 4.50,
                'currency' => 'GBP',
                'pickup_eta' => now()->addMinutes(15)->toIso8601String(),
                'dropoff_eta' => now()->addMinutes(35)->toIso8601String(),
                'duration_minutes' => 20,
            ];
        }

        $token = $this->getAccessToken();
        $storeAddress = $pickupAddress ?: $this->getStorePickupDetails();

        $payload = [
            'pickup_address' => json_encode($storeAddress),
            'dropoff_address' => json_encode($dropoffAddress),
        ];

        $response = Http::withToken($token)
            ->post("{$this->baseUrl}/{$this->customerId}/delivery_quotes", $payload);

        if ($response->failed()) {
            Log::error('Uber Direct quote failure: ' . $response->body());
            throw new Exception('Could not fetch Uber Direct delivery quote: ' . ($response->json('message') ?? 'Unknown error'));
        }

        $data = $response->json();
        return [
            'id' => $data['id'] ?? null,
            'fee' => round(($data['fee'] ?? 0) / 100, 2),
            'currency' => $data['currency_type'] ?? 'GBP',
            'pickup_eta' => $data['pickup_eta'] ?? null,
            'dropoff_eta' => $data['dropoff_eta'] ?? null,
            'duration_minutes' => $data['duration'] ?? 20,
        ];
    }

    /**
     * Create/Dispatch a live courier delivery with Uber Direct for an order.
     */
    public function createDelivery(Order $order): array
    {
        $order->loadMissing(['customer', 'deliveryAddress', 'items']);

        if (!$order->deliveryAddress) {
            throw new Exception('Order has no delivery address.');
        }

        if (!$this->isConfigured()) {
            // Simulated mock dispatch response
            $mockDeliveryId = 'mock_uber_' . uniqid();
            $trackingUrl = "https://track.uber.com/v1/deliveries/{$mockDeliveryId}";

            $order->update([
                'delivery_provider' => 'uber_direct',
                'uber_delivery_id' => $mockDeliveryId,
                'uber_tracking_url' => $trackingUrl,
                'uber_status' => 'pending',
                'uber_courier_name' => 'Pending Assignment',
            ]);

            return [
                'id' => $mockDeliveryId,
                'tracking_url' => $trackingUrl,
                'status' => 'pending',
                'fee' => 4.50,
            ];
        }

        $token = $this->getAccessToken();
        $storeDetails = $this->getStorePickupDetails();

        $dropoff = [
            'street_address' => array_filter([
                $order->deliveryAddress->address_line_1,
                $order->deliveryAddress->address_line_2,
            ]),
            'city' => $order->deliveryAddress->city,
            'postal_code' => $order->deliveryAddress->postcode,
            'country' => 'GB',
        ];

        $manifestItems = [];
        foreach ($order->items as $item) {
            $manifestItems[] = [
                'name' => $item->product_name . ($item->variation_name ? " ({$item->variation_name})" : ''),
                'quantity' => (int) $item->quantity,
                'price' => (int) round($item->price * 100),
            ];
        }

        $payload = [
            'pickup_name' => $storeDetails['name'],
            'pickup_address' => json_encode($storeDetails['address']),
            'pickup_phone_number' => $storeDetails['phone_number'],
            'dropoff_name' => trim(($order->customer?->first_name ?? 'Guest') . ' ' . ($order->customer?->last_name ?? '')),
            'dropoff_address' => json_encode($dropoff),
            'dropoff_phone_number' => $order->customer?->phone ?? '+447000000000',
            'manifest_items' => $manifestItems,
            'external_store_id' => 'sweet-spot-london',
            'external_id' => $order->order_number,
        ];

        $response = Http::withToken($token)
            ->post("{$this->baseUrl}/{$this->customerId}/deliveries", $payload);

        if ($response->failed()) {
            Log::error("Uber Direct create delivery failure for {$order->order_number}: " . $response->body());
            throw new Exception('Uber Direct delivery creation failed: ' . ($response->json('message') ?? 'API error'));
        }

        $data = $response->json();

        $order->update([
            'delivery_provider' => 'uber_direct',
            'uber_delivery_id' => $data['id'] ?? null,
            'uber_tracking_url' => $data['tracking_url'] ?? null,
            'uber_status' => $data['status'] ?? 'pending',
            'uber_fee' => isset($data['fee']) ? round($data['fee'] / 100, 2) : null,
            'uber_courier_name' => $data['courier']['name'] ?? null,
            'uber_courier_phone' => $data['courier']['phone_number'] ?? null,
        ]);

        return $data;
    }

    /**
     * Cancel an active Uber Direct delivery.
     */
    public function cancelDelivery(Order $order, string $reason = 'Cancelled by store'): bool
    {
        if (empty($order->uber_delivery_id)) {
            return false;
        }

        if (!$this->isConfigured()) {
            $order->update([
                'uber_status' => 'canceled',
            ]);
            return true;
        }

        $token = $this->getAccessToken();
        $response = Http::withToken($token)
            ->post("{$this->baseUrl}/{$this->customerId}/deliveries/{$order->uber_delivery_id}/cancel", [
                'reason' => $reason,
            ]);

        if ($response->successful()) {
            $order->update(['uber_status' => 'canceled']);
            return true;
        }

        return false;
    }

    /**
     * Return configured store pickup details.
     */
    protected function getStorePickupDetails(): array
    {
        $storeName = $this->storeConfigService->get('store_name', 'Sweet Spot System');
        $address = $this->storeConfigService->get('store_address', '123 Baker Street, London');
        $postcode = $this->storeConfigService->get('store_postcode', 'NW1 6XE');
        $phone = $this->storeConfigService->get('store_phone', '+442079460000');

        return [
            'name' => $storeName,
            'phone_number' => $phone,
            'address' => [
                'street_address' => [$address],
                'city' => 'London',
                'postal_code' => $postcode,
                'country' => 'GB',
            ]
        ];
    }
}
