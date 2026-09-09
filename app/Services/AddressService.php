<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Model;

class AddressService
{
    protected GeocodingService $geocodingService;
    protected StoreConfigService $storeConfigService;

    public function __construct(GeocodingService $geocodingService, StoreConfigService $storeConfigService)
    {
        $this->geocodingService = $geocodingService;
        $this->storeConfigService = $storeConfigService;
    }

    /**
     * Store or update a polymorphic address.
     */
    public function saveAddress(Model $addressable, array $data): Address
    {
        // 1. If it's a Customer address, calculate distance from store postcode
        $distance = null;
        if ($addressable instanceof Customer) {
            $storePostcode = $this->storeConfigService->get('store_postcode', 'W1D 1AN');
            $storeCoords = $this->geocodingService->geocode($storePostcode);
            $customerCoords = $this->geocodingService->geocode($data['postcode']);

            if ($storeCoords && $customerCoords) {
                $distance = $this->geocodingService->calculateDistance($storeCoords, $customerCoords);
            }
        }

        // 2. Set default constraint: if this address is default, reset others
        $isDefault = filter_var($data['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if ($isDefault) {
            $addressable->addresses()->update(['is_default' => false]);
        }

        // 3. Prevent address duplication (match by postcode and line 1)
        $address = $addressable->addresses()
            ->where('postcode', $data['postcode'])
            ->where('address_line_1', $data['address_line_1'])
            ->first();

        $addressData = [
            'address_line_1' => $data['address_line_1'],
            'address_line_2' => $data['address_line_2'] ?? null,
            'city' => $data['city'],
            'postcode' => $data['postcode'],
            'type' => $data['type'] ?? 'home',
            'distance_from_store' => $distance,
            'is_default' => $isDefault,
        ];

        if ($address) {
            $address->update($addressData);
            return $address;
        }

        return $addressable->addresses()->create($addressData);
    }
}
