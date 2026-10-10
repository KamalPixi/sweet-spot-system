<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['name', 'slug', 'icon', 'status', 'show_in_footer', 'available_days', 'box_options', 'order'])]
class Category extends Model
{
    use SoftDeletes;

    protected $appends = ['formatted_available_days'];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'show_in_footer' => 'boolean',
            'available_days' => 'array',
            'box_options' => 'array',
            'order'  => 'integer',
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class)->orderBy('id');
    }

    public function images(): MorphMany
    {
        return $this->morphMany(Image::class, 'imageable');
    }

    /**
     * Check if this category is available on a given day of the week (e.g. 'monday', 'saturday').
     */
    public function isAvailableOnDay(?string $day = null): bool
    {
        $days = $this->available_days;
        if (empty($days) || !is_array($days)) {
            return true;
        }

        $targetDay = strtolower($day ?: now(config('app.timezone', 'Europe/London'))->format('l'));
        $normalizedDays = array_map('strtolower', $days);

        if (in_array('all', $normalizedDays) || empty($normalizedDays)) {
            return true;
        }

        return in_array($targetDay, $normalizedDays);
    }

    /**
     * Scope query to categories available on the specified day (or today).
     */
    public function scopeAvailableOnDay(Builder $query, ?string $day = null): Builder
    {
        $targetDay = strtolower($day ?: now(config('app.timezone', 'Europe/London'))->format('l'));

        return $query->where(function (Builder $q) use ($targetDay) {
            $q->whereNull('available_days')
              ->orWhere('available_days', '[]')
              ->orWhere('available_days', 'like', '%"' . $targetDay . '"%')
              ->orWhere('available_days', 'like', '%"all"%');
        });
    }

    /**
     * Human-readable label of available days (e.g., "Every day", "Mon, Wed, Fri", "Weekends").
     */
    public function getFormattedAvailableDaysAttribute(): string
    {
        $days = $this->available_days;
        if (empty($days) || !is_array($days)) {
            return 'Every day';
        }

        $normalized = array_map('strtolower', $days);
        if (in_array('all', $normalized) || count($normalized) >= 7) {
            return 'Every day';
        }

        $dayNames = [
            'monday' => 'Mon',
            'tuesday' => 'Tue',
            'wednesday' => 'Wed',
            'thursday' => 'Thu',
            'friday' => 'Fri',
            'saturday' => 'Sat',
            'sunday' => 'Sun',
        ];

        $sorted = [];
        foreach ($dayNames as $full => $short) {
            if (in_array($full, $normalized)) {
                $sorted[] = $short;
            }
        }

        if (count($sorted) === 2 && in_array('Sat', $sorted) && in_array('Sun', $sorted)) {
            return 'Weekends only';
        }

        if (count($sorted) === 5 && !in_array('Sat', $sorted) && !in_array('Sun', $sorted)) {
            return 'Weekdays (Mon–Fri)';
        }

        return empty($sorted) ? 'Every day' : implode(', ', $sorted);
    }
}
