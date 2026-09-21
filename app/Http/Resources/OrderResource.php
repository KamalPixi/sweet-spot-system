<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'customer_id' => $this->customer_id,
            'delivery_address_id' => $this->delivery_address_id,
            'type' => $this->type,
            'table_number' => $this->table_number,
            'status' => $this->status,
            'collection_time' => $this->collection_time,
            'notes' => $this->notes,
            'subtotal' => $this->subtotal,
            'delivery_fee' => $this->delivery_fee,
            'delivery_provider' => $this->delivery_provider,
            'uber_delivery_id' => $this->uber_delivery_id,
            'uber_tracking_url' => $this->uber_tracking_url,
            'uber_status' => $this->uber_status,
            'uber_courier_name' => $this->uber_courier_name,
            'uber_courier_phone' => $this->uber_courier_phone,
            'uber_courier_location' => $this->uber_courier_location,
            'uber_fee' => $this->uber_fee,
            // Clean helper aliases for courier info across providers
            'courier_name' => $this->uber_courier_name,
            'courier_phone' => $this->uber_courier_phone,
            'courier_status' => $this->uber_status,
            'courier_tracking_url' => $this->uber_tracking_url,
            'total' => $this->total,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'payment_transaction_id' => $this->payment_transaction_id,
            'printed_at' => $this->printed_at,
            'print_count' => $this->print_count,
            'has_active_print_job' => $this->relationLoaded('printJobs')
                ? $this->printJobs->whereIn('status', ['queued', 'printing'])->isNotEmpty()
                : $this->printJobs()->whereIn('status', ['queued', 'printing'])->exists(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'customer' => $this->relationLoaded('customer')
                ? new OrderCustomerResource($this->customer)
                : null,
            'delivery_address' => $this->relationLoaded('deliveryAddress')
                ? new OrderAddressResource($this->deliveryAddress)
                : null,
            'items' => $this->relationLoaded('items')
                ? OrderItemResource::collection($this->items)
                : [],
        ];
    }
}
