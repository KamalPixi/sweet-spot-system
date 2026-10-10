<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'category_id' => $this->category_id,
            'product_id' => $this->product_id,
            'product_variation_id' => $this->product_variation_id,
            'product_name' => $this->product_name,
            'variation_name' => $this->variation_name,
            'is_box' => (bool) $this->is_box,
            'box_size' => $this->box_size,
            'box_items' => $this->box_items,
            'price' => $this->price,
            'quantity' => $this->quantity,
            'total' => $this->total,
            'category' => $this->product?->category?->name ?? $this->category?->name,
        ];
    }
}
