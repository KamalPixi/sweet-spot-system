<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Exception;

class OrderService
{
    protected CustomerService $customerService;
    protected AddressService $addressService;
    protected StoreConfigService $storeConfigService;
    protected CollectionSlotService $collectionSlotService;

    public function __construct(
        CustomerService $customerService,
        AddressService $addressService,
        StoreConfigService $storeConfigService,
        CollectionSlotService $collectionSlotService
    ) {
        $this->customerService = $customerService;
        $this->addressService = $addressService;
        $this->storeConfigService = $storeConfigService;
        $this->collectionSlotService = $collectionSlotService;
    }

    /**
     * Create a new Order (Guest or Authenticated Customer).
     */
    public function createOrder(array $data, ?Customer $authCustomer = null): Order
    {
        return DB::transaction(function () use ($data, $authCustomer) {
            // 1. Resolve Customer
            $customer = $authCustomer;
            if (!$customer) {
                // Guest profile checkout
                $customer = $this->customerService->findOrCreateGuest([
                    'first_name' => $data['customer']['first_name'] ?? null,
                    'last_name' => $data['customer']['last_name'] ?? null,
                    'email' => $data['customer']['email'] ?? null,
                    'phone' => $data['customer']['phone'] ?? null,
                ]);
            }

            // 2. Validate Order Type details
            $type = $data['type']; // 'delivery' or 'collection'
            $deliveryAddressId = null;
            $deliveryFee = 0.00;
            $collectionTime = null;

            if ($type === 'delivery') {
                if (empty($data['address'])) {
                    throw new Exception('Delivery address is required for home delivery orders.');
                }

                // Save or retrieve the delivery address
                $address = $this->addressService->saveAddress($customer, [
                    'address_line_1' => $data['address']['address_line_1'],
                    'address_line_2' => $data['address']['address_line_2'] ?? null,
                    'city' => $data['address']['city'],
                    'postcode' => $data['address']['postcode'],
                    'type' => $data['address']['type'] ?? 'home',
                    'is_default' => $data['address']['is_default'] ?? false,
                ]);

                // Verify distance
                $maxRadius = (float) $this->storeConfigService->get('store_delivery_radius_miles', '5.0');
                if ($address->distance_from_store === null || $address->distance_from_store > $maxRadius) {
                    throw new Exception("Delivery address is outside our {$maxRadius} mile delivery radius.");
                }

                $deliveryAddressId = $address->id;

                // Delivery fee is calculated after subtotal below (free delivery threshold check)

            } elseif ($type === 'collection') {
                if (empty($data['collection_time'])) {
                    throw new Exception('Collection time is required for collection orders.');
                }

                $collectionTime = $data['collection_time'];
                // Validate that the slot is available
                $slotDate = substr($collectionTime, 0, 10); // Extract date Y-m-d
                $availableSlots = $this->collectionSlotService->getAvailableSlots($slotDate);
                
                $slotExists = false;
                foreach ($availableSlots as $slot) {
                    if ($slot['datetime'] === $collectionTime) {
                        if (!$slot['is_available']) {
                            throw new Exception('The selected collection time slot is fully booked.');
                        }
                        $slotExists = true;
                        break;
                    }
                }

                if (!$slotExists) {
                    throw new Exception('The selected collection time slot is invalid or outside operating hours.');
                }
            } elseif ($type === 'dine_in') {
                if (empty($data['table_number'])) {
                    throw new Exception('Table number is required for dine-in table orders.');
                }
            } else {
                throw new Exception('Invalid order type. Must be delivery, collection, or dine_in.');
            }

            // 3. Process Cart Items
            if (empty($data['items']) || !is_array($data['items'])) {
                throw new Exception('Order must contain at least one item.');
            }

            $processedItems = [];
            $subtotal = 0.00;

            foreach ($data['items'] as $item) {
                // Verify category day-based availability
                $fulfillmentDay = null;
                if ($type === 'collection' && !empty($data['collection_time'])) {
                    $fulfillmentDay = strtolower(\Carbon\Carbon::parse($data['collection_time'])->format('l'));
                } elseif (!empty($data['fulfillment_day'])) {
                    $fulfillmentDay = strtolower($data['fulfillment_day']);
                } elseif (!empty($data['day'])) {
                    $fulfillmentDay = strtolower($data['day']);
                } else {
                    $fulfillmentDay = strtolower(now(config('app.timezone', 'Europe/London'))->format('l'));
                }

                if (!empty($item['is_box'])) {
                    $category = Category::where('status', true)->findOrFail($item['category_id']);

                    if (!$category->isAvailableOnDay($fulfillmentDay)) {
                        $availMsg = $category->formatted_available_days;
                        throw new Exception("Category '{$category->name}' is not available for this order (Available: {$availMsg}).");
                    }

                    $boxSize = (int) ($item['box_size'] ?? 0);
                    if ($boxSize <= 0) {
                        throw new Exception("Invalid box size for '{$category->name}'.");
                    }

                    // Find configured box option for price verification
                    $boxOptions = $category->box_options ?? [];
                    $matchedOption = null;
                    foreach ($boxOptions as $opt) {
                        if ((int) ($opt['size'] ?? 0) === $boxSize && ($opt['status'] ?? true)) {
                            $matchedOption = $opt;
                            break;
                        }
                    }

                    if (!$matchedOption) {
                        throw new Exception("Box of {$boxSize} is not available for '{$category->name}'.");
                    }

                    $boxPrice = (float) $matchedOption['price'];
                    $boxName = $matchedOption['name'] ?? "Box of {$boxSize}";

                    // Verify box items assortment
                    $rawBoxItems = $item['box_items'] ?? [];
                    if (empty($rawBoxItems) || !is_array($rawBoxItems)) {
                        throw new Exception("Please pick items to fill your {$boxName}.");
                    }

                    $totalBoxCount = 0;
                    $processedBoxItems = [];

                    foreach ($rawBoxItems as $bItem) {
                        $bQty = (int) ($bItem['quantity'] ?? 0);
                        if ($bQty <= 0) continue;
                        $totalBoxCount += $bQty;

                        $p = Product::where('status', true)->where('category_id', $category->id)->findOrFail($bItem['product_id']);
                        $variation = null;
                        $displayName = $p->name;

                        if (!empty($bItem['product_variation_id'])) {
                            $variation = ProductVariation::where('product_id', $p->id)->findOrFail($bItem['product_variation_id']);
                            $displayName = "{$p->name} ({$variation->name})";

                            // Decrement variation stock if applicable
                            if ($variation->stock !== null) {
                                if ($variation->stock < $bQty) {
                                    throw new Exception("Not enough stock for '{$displayName}' in box. Available: {$variation->stock}");
                                }
                                $variation->decrement('stock', $bQty);
                            }
                        } elseif ($p->has_variations && !empty($bItem['variation_name'])) {
                            $variation = ProductVariation::where('product_id', $p->id)->where('name', $bItem['variation_name'])->first();
                            if ($variation) {
                                $displayName = "{$p->name} ({$variation->name})";
                                if ($variation->stock !== null) {
                                    if ($variation->stock < $bQty) {
                                        throw new Exception("Not enough stock for '{$displayName}' in box. Available: {$variation->stock}");
                                    }
                                    $variation->decrement('stock', $bQty);
                                }
                            }
                        }

                        $processedBoxItems[] = [
                            'product_id' => $p->id,
                            'product_variation_id' => $variation ? $variation->id : null,
                            'variation_name' => $variation ? $variation->name : ($bItem['variation_name'] ?? null),
                            'product_name' => $displayName,
                            'quantity' => $bQty,
                        ];
                    }

                    if ($totalBoxCount !== $boxSize) {
                        throw new Exception("{$boxName} requires exactly {$boxSize} items (currently selected {$totalBoxCount}).");
                    }

                    $qty = (int) ($item['quantity'] ?? 1);
                    if ($qty <= 0) {
                        throw new Exception("Quantity for {$boxName} must be greater than zero.");
                    }

                    $itemTotal = round($boxPrice * $qty, 2);
                    $subtotal += $itemTotal;

                    $processedItems[] = [
                        'category_id' => $category->id,
                        'product_id' => null,
                        'product_variation_id' => null,
                        'product_name' => "{$category->name} ({$boxName})",
                        'variation_name' => $boxName,
                        'is_box' => true,
                        'box_size' => $boxSize,
                        'box_items' => $processedBoxItems,
                        'price' => $boxPrice,
                        'quantity' => $qty,
                        'total' => $itemTotal,
                    ];
                } else {
                    $product = Product::where('status', true)->with('category')->findOrFail($item['product_id']);

                    if ($product->category && (!$product->category->status || !$product->category->isAvailableOnDay($fulfillmentDay))) {
                        $availMsg = $product->category->formatted_available_days;
                        throw new Exception("Product '{$product->name}' is from category '{$product->category->name}' which is not available for this order (Available: {$availMsg}).");
                    }

                    $variation = null;
                    $price = 0.00;
                    $variationName = null;

                    if ($product->has_variations) {
                        if (empty($item['product_variation_id'])) {
                            throw new Exception("Product '{$product->name}' requires a variation choice.");
                        }
                        $variation = ProductVariation::where('product_id', $product->id)->findOrFail($item['product_variation_id']);
                        $price = (float) $variation->price;
                        $variationName = $variation->name;

                        // Optional Stock check
                        if ($variation->stock !== null) {
                            if ($variation->stock < $item['quantity']) {
                                throw new Exception("Not enough stock for '{$product->name} ({$variation->name})'. Available: {$variation->stock}");
                            }
                            // Decrement stock
                            $variation->decrement('stock', $item['quantity']);
                        }
                    } else {
                        $price = (float) $product->base_price;
                    }

                    $qty = (int) $item['quantity'];
                    if ($qty <= 0) {
                        throw new Exception("Quantity for product '{$product->name}' must be greater than zero.");
                    }

                    $itemTotal = round($price * $qty, 2);
                    $subtotal += $itemTotal;

                    $processedItems[] = [
                        'category_id' => $product->category_id,
                        'product_id' => $product->id,
                        'product_variation_id' => $variation ? $variation->id : null,
                        'product_name' => $product->name,
                        'variation_name' => $variationName,
                        'is_box' => false,
                        'box_size' => null,
                        'box_items' => null,
                        'price' => $price,
                        'quantity' => $qty,
                        'total' => $itemTotal,
                    ];
                }
            }

            // Calculate delivery fee after subtotal is known
            if ($type === 'delivery') {
                $flatFee = (float) ($this->storeConfigService->get('store_delivery_base_fee')
                    ?? $this->storeConfigService->get('delivery_fee', '3.00'));
                $freeThreshold = $this->storeConfigService->get('free_delivery_threshold');
                if ($freeThreshold !== null && $subtotal >= (float) $freeThreshold) {
                    $deliveryFee = 0.00;
                } else {
                    $deliveryFee = $flatFee;
                }
            }

            $total = round($subtotal + $deliveryFee, 2);

            // 4. Create Order record
            $orderNumber = 'SS-' . strtoupper(Str::random(8));
            // Ensure uniqueness of order number
            while (Order::where('order_number', $orderNumber)->exists()) {
                $orderNumber = 'SS-' . strtoupper(Str::random(8));
            }

            $paymentMethod = $data['payment_method'] ?? 'stripe';
            // Orders that require online card payment start as 'awaiting_payment' and are only
            // promoted to 'pending' once payment is confirmed (via Stripe Webhook or Global Payments confirmation).
            // This prevents abandoned / cancelled checkout sessions cluttering the admin list.
            $initialStatus = in_array($paymentMethod, ['stripe', 'globalpay']) ? 'awaiting_payment' : 'pending';

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $customer->id,
                'delivery_address_id' => $deliveryAddressId,
                'type' => $type,
                'table_number' => $data['table_number'] ?? null,
                'status' => $initialStatus,
                'collection_time' => $collectionTime,
                'notes' => $data['notes'] ?? null,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'delivery_provider' => $data['delivery_provider'] ?? ($type === 'delivery' ? 'uber_direct' : null),
                'total' => $total,
                'payment_status' => 'unpaid',
                'payment_method' => $paymentMethod,
                'payment_transaction_id' => $data['payment_transaction_id'] ?? null,
            ]);

            // 5. Create OrderItems
            foreach ($processedItems as $pItem) {
                $order->items()->create($pItem);
            }

            return $order;
        });
    }
}
