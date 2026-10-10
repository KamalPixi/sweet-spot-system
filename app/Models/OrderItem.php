<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'order_id',
    'category_id',
    'product_id',
    'product_variation_id',
    'product_name',
    'variation_name',
    'is_box',
    'box_size',
    'box_items',
    'price',
    'quantity',
    'total'
])]
class OrderItem extends Model
{
    protected function casts(): array
    {
        return [
            'is_box' => 'boolean',
            'box_size' => 'integer',
            'box_items' => 'array',
            'price' => 'decimal:2',
            'quantity' => 'integer',
            'total' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class, 'product_variation_id');
    }
}
