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
            'status' => $this->status,
            'collection_time' => $this->collection_time,
            'notes' => $this->notes,
            'subtotal' => $this->subtotal,
            'delivery_fee' => $this->delivery_fee,
            'total' => $this->total,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'payment_transaction_id' => $this->payment_transaction_id,
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
