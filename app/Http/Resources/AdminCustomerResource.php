<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminCustomerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $firstName = trim((string) ($this->first_name ?? ''));
        $lastName = trim((string) ($this->last_name ?? ''));
        $fullName = trim($firstName . ' ' . $lastName);

        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $fullName !== '' ? $fullName : 'Unnamed customer',
            'email' => $this->email,
            'phone' => $this->phone,
            'is_guest' => (bool) $this->is_guest,
            'orders_count' => (int) ($this->orders_count ?? 0),
            'completed_orders_count' => (int) ($this->completed_orders_count ?? 0),
            'total_spent' => (float) ($this->orders_sum_total ?? 0),
            'last_order_at' => $this->orders_max_created_at,
            'joined_at' => $this->created_at,
        ];
    }
}
