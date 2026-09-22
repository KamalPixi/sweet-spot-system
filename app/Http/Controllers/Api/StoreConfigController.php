<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckPostcodeRequest;
use App\Http\Requests\UpdateStoreConfigRequest;
use App\Http\Resources\PostcodeCheckResource;
use App\Services\StoreConfigService;
use App\Services\GeocodingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StoreConfigController extends Controller
{
    protected StoreConfigService $storeConfigService;
    protected GeocodingService $geocodingService;

    public function __construct(StoreConfigService $storeConfigService, GeocodingService $geocodingService)
    {
        $this->storeConfigService = $storeConfigService;
        $this->geocodingService = $geocodingService;
    }

    /**
     * Get all store settings.
     */
    public function index(): JsonResponse
    {
        $configs = $this->storeConfigService->getAll();
        $stripeKey = config('services.stripe.key') ?: env('STRIPE_KEY');
        if ($stripeKey && !str_starts_with($stripeKey, '${')) {
            $configs['stripe_publishable_key'] = $stripeKey;
        }

        return response()->json([
            'success' => true,
            'data' => $configs,
        ]);
    }

    /**
     * Check if a postcode is within delivery distance, returning computed fees.
     */
    public function checkPostcode(CheckPostcodeRequest $request): JsonResponse
    {
        $postcode = $request->validated()['postcode'];

        if (!$this->geocodingService->isValidPostcode($postcode)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid UK postcode format.',
            ], 422);
        }

        $storeLat = $this->storeConfigService->get('store_latitude');
        $storeLng = $this->storeConfigService->get('store_longitude');

        if ($storeLat !== null && $storeLng !== null) {
            $storeCoords = ['lat' => (float) $storeLat, 'lng' => (float) $storeLng];
        } else {
            $storePostcode = $this->storeConfigService->get('store_postcode', 'W1D 1AN');
            $storeCoords = $this->geocodingService->geocode($storePostcode);
        }

        $customerCoords = $this->geocodingService->geocode($postcode);

        if (!$storeCoords || !$customerCoords) {
            return response()->json([
                'success' => false,
                'message' => 'Could not determine location for this postcode.',
            ], 422);
        }

        $distance = $this->geocodingService->calculateDistance($storeCoords, $customerCoords);
        
        $maxRadius = (float) $this->storeConfigService->get('store_delivery_radius_miles', '3.0');
        $baseFee = (float) $this->storeConfigService->get('store_delivery_base_fee', '2.50');
        $perMileFee = (float) $this->storeConfigService->get('store_delivery_charge_per_mile', '1.50');

        $isAllowed = $distance <= $maxRadius;
        $deliveryFee = $isAllowed ? round($baseFee + ($distance * $perMileFee), 2) : 0.00;

        return response()->json([
            'success' => true,
            'data' => (new PostcodeCheckResource([
                'postcode' => strtoupper(str_replace(' ', '', $postcode)),
                'is_allowed' => $isAllowed,
                'distance_miles' => $distance,
                'delivery_fee' => $deliveryFee,
                'max_radius_miles' => $maxRadius,
                'coordinates' => $customerCoords,
            ]))->resolve($request),
        ]);
    }

    /**
     * Update configuration (Admin).
     */
    public function update(UpdateStoreConfigRequest $request): JsonResponse
    {
        $configs = $request->validated()['configs'];

        // Handle store logo upload
        if ($request->hasFile('store_logo')) {
            $file = $request->file('store_logo');
            if ($file->isValid()) {
                $path = $file->store('store', 'public');
                $this->storeConfigService->set('store_logo', '/storage/' . $path);
            }
            if (isset($configs['store_logo'])) {
                unset($configs['store_logo']);
            }
        }

        // Handle store logo white upload
        if ($request->hasFile('store_logo_white')) {
            $file = $request->file('store_logo_white');
            if ($file->isValid()) {
                $path = $file->store('store', 'public');
                $this->storeConfigService->set('store_logo_white', '/storage/' . $path);
            }
            if (isset($configs['store_logo_white'])) {
                unset($configs['store_logo_white']);
            }
        }

        // Handle store image feature photo upload
        if ($request->hasFile('store_image')) {
            $file = $request->file('store_image');
            if ($file->isValid()) {
                $path = $file->store('store', 'public');
                $this->storeConfigService->set('store_image', '/storage/' . $path);
            }
            if (isset($configs['store_image'])) {
                unset($configs['store_image']);
            }
        }

        // Handle hero background banner image upload
        if ($request->hasFile('hero_bg_image')) {
            $file = $request->file('hero_bg_image');
            if ($file->isValid()) {
                $path = $file->store('store', 'public');
                $this->storeConfigService->set('hero_bg_image', '/storage/' . $path);
            }
            if (isset($configs['hero_bg_image'])) {
                unset($configs['hero_bg_image']);
            }
        }

        // Handle downloadable PDF menu upload
        if ($request->hasFile('menu_pdf')) {
            $file = $request->file('menu_pdf');
            if ($file->isValid()) {
                $path = $file->store('store', 'public');
                $this->storeConfigService->set('menu_pdf', '/storage/' . $path);
            }
            if (isset($configs['menu_pdf'])) {
                unset($configs['menu_pdf']);
            }
        }

        // Handle other configs
        foreach ($configs as $key => $value) {
            $this->storeConfigService->set($key, $value);
        }

        return response()->json([
            'success' => true,
            'message' => 'Store configurations updated successfully.',
            'data' => $this->storeConfigService->getAll(),
        ]);
    }
}
