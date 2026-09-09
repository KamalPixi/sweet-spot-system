<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CollectionSlotService;
use App\Models\StoreOpeningHour;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class CollectionSlotController extends Controller
{
    protected CollectionSlotService $collectionSlotService;

    public function __construct(CollectionSlotService $collectionSlotService)
    {
        $this->collectionSlotService = $collectionSlotService;
    }

    /**
     * Get available collection slots for a specific date.
     */
    public function getSlots(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
        ]);

        $dateString = $request->input('date', Carbon::today()->format('Y-m-d'));
        $slots = $this->collectionSlotService->getAvailableSlots($dateString);

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $dateString,
                'day_of_week' => Carbon::parse($dateString)->format('l'),
                'slots' => $slots,
            ],
        ]);
    }

    public function getOpeningHours(Request $request): JsonResponse
    {
        $daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $hours = StoreOpeningHour::all()->sortBy(function ($hour) use ($daysOrder) {
            return array_search($hour->day_of_week, $daysOrder);
        })->values();
        
        return response()->json([
            'success' => true,
            'data' => $hours,
        ]);
    }

    /**
     * Update store opening hour for a specific day (Admin).
     */
    public function updateOpeningHour(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'open_time' => 'required|string',
            'close_time' => 'required|string',
            'slot_interval' => 'required|integer|min:5|max:240',
            'is_closed' => 'required|boolean',
        ]);

        $openingHour = StoreOpeningHour::findOrFail($id);
        $openingHour->update([
            'open_time' => $request->input('open_time'),
            'close_time' => $request->input('close_time'),
            'slot_interval' => $request->input('slot_interval'),
            'is_closed' => $request->input('is_closed'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Store opening hours updated successfully.',
            'data' => $openingHour,
        ]);
    }
}
