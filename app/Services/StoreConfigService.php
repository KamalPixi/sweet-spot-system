<?php

namespace App\Services;

use App\Models\StoreConfig;

class StoreConfigService
{
    public function get(string $key, $default = null): ?string
    {
        $config = StoreConfig::where('key', $key)->first();
        return $config ? $config->value : $default;
    }

    public function set(string $key, ?string $value): StoreConfig
    {
        return StoreConfig::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    public function getAll(): array
    {
        return StoreConfig::pluck('value', 'key')->toArray();
    }
}
