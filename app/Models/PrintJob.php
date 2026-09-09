<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'order_id',
    'job_token',
    'printer_mac',
    'status',
    'content_type',
    'content',
    'error_message',
    'attempts',
    'printed_at'
])]
class PrintJob extends Model
{
    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'printed_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
