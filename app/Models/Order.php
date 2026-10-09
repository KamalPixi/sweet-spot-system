<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'order_number',
    'customer_id',
    'delivery_address_id',
    'type',
    'table_number',
    'status',
    'preparing_at',
    'ready_at',
    'completed_at',
    'cancelled_at',
    'collection_time',
    'notes',
    'subtotal',
    'delivery_fee',
    'delivery_provider',
    'uber_delivery_id',
    'uber_tracking_url',
    'uber_status',
    'uber_courier_name',
    'uber_courier_phone',
    'uber_courier_location',
    'uber_fee',
    'total',
    'payment_status',
    'payment_method',
    'payment_transaction_id',
    'printed_at',
    'print_count'
])]
class Order extends Model
{
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'uber_fee' => 'decimal:2',
            'total' => 'decimal:2',
            'uber_courier_location' => 'array',
            'preparing_at' => 'datetime',
            'ready_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'printed_at' => 'datetime',
            'print_count' => 'integer',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function deliveryAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'delivery_address_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function printJobs(): HasMany
    {
        return $this->hasMany(PrintJob::class);
    }
}
