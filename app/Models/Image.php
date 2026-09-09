<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['imageable_id', 'imageable_type', 'url', 'is_primary'])]
class Image extends Model
{
    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
        ];
    }

    /**
     * Get the owning imageable model.
     */
    public function imageable(): MorphTo
    {
        return $this->morphTo();
    }
}
