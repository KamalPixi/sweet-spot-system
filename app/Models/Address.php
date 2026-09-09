<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['addressable_id', 'addressable_type', 'address_line_1', 'address_line_2', 'city', 'postcode', 'type', 'distance_from_store', 'is_default'])]
class Address extends Model
{
    protected function casts(): array
    {
        return [
            'distance_from_store' => 'decimal:2',
            'is_default' => 'boolean',
        ];
    }

    public function addressable(): MorphTo
    {
        return $this->morphTo();
    }
}
