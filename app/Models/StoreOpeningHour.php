<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['day_of_week', 'open_time', 'close_time', 'slot_interval', 'is_closed'])]
class StoreOpeningHour extends Model
{
    protected function casts(): array
    {
        return [
            'is_closed' => 'boolean',
            'slot_interval' => 'integer',
        ];
    }
}
