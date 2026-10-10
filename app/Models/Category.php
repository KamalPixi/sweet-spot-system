<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['name', 'slug', 'icon', 'status', 'show_in_footer', 'order'])]
class Category extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'show_in_footer' => 'boolean',
            'order'  => 'integer',
        ];
    }

    public function products(): HasMany
    {
        return $table = $this->hasMany(Product::class)->orderBy('id');
    }

    public function images(): MorphMany
    {
        return $this->morphMany(Image::class, 'imageable');
    }
}
