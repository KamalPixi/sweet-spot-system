<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostcodeCheckResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'postcode' => $this['postcode'] ?? null,
            'is_allowed' => (bool) ($this['is_allowed'] ?? false),
            'distance_miles' => $this['distance_miles'] ?? null,
            'delivery_fee' => $this['delivery_fee'] ?? null,
            'max_radius_miles' => $this['max_radius_miles'] ?? null,
            'coordinates' => $this['coordinates'] ?? null,
        ];
    }
}
