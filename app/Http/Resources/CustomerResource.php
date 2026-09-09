<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'is_guest' => (bool) $this->is_guest,
            'addresses' => $this->relationLoaded('addresses')
                ? $this->addresses->map(fn ($address) => [
                    'id' => $address->id,
                    'address_line_1' => $address->address_line_1,
                    'address_line_2' => $address->address_line_2,
                    'city' => $address->city,
                    'postcode' => $address->postcode,
                    'type' => $address->type,
                    'distance_from_store' => $address->distance_from_store,
                    'is_default' => (bool) $address->is_default,
                ])->values()
                : [],
        ];
    }
}
