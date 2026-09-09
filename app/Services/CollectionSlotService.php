<?php

namespace App\Services;

use App\Models\StoreOpeningHour;
use App\Models\Order;
use Carbon\Carbon;

class CollectionSlotService
{
    /**
     * Generate available collection slots for a specific date.
     *
     * @param string $dateString Format: Y-m-d
     * @return array
     */
    public function getAvailableSlots(string $dateString): array
    {
        try {
            $date = Carbon::parse($dateString);
        } catch (\Exception $e) {
            return [];
        }

        $dayOfWeek = $date->format('l'); // 'Monday', 'Tuesday', etc.
        $openingHour = StoreOpeningHour::where('day_of_week', $dayOfWeek)->first();

        if (!$openingHour || $openingHour->is_closed) {
            return [];
        }

        $slots = [];
        $startTime = Carbon::createFromFormat('Y-m-d H:i:s', $date->format('Y-m-d') . ' ' . $openingHour->open_time, 'Europe/London');
        $endTime = Carbon::createFromFormat('Y-m-d H:i:s', $date->format('Y-m-d') . ' ' . $openingHour->close_time, 'Europe/London');

        $now = Carbon::now('Europe/London');
        $interval = $openingHour->slot_interval; // in minutes

        // Fetch counts of orders already scheduled for collection on this day
        $ordersCount = Order::where('type', 'collection')
            ->whereNotNull('collection_time')
            ->get()
            ->groupBy(function($order) {
                return Carbon::parse($order->collection_time, 'Europe/London')->format('Y-m-d H:i:s');
            })
            ->map->count();

        $slotDate = Carbon::parse($dateString, 'Europe/London');
        $today = Carbon::today('Europe/London');
        $tomorrow = Carbon::tomorrow('Europe/London');

        if ($slotDate->isSameDay($today)) {
            $dateLabel = 'Today';
        } elseif ($slotDate->isSameDay($tomorrow)) {
            $dateLabel = 'Tomorrow';
        } else {
            $dateLabel = $slotDate->format('l, j M');
        }

        while ($startTime->lt($endTime)) {
            $slotFormatted = $startTime->format('g:i A'); // 'g' formats hour without leading zero
            $fullDateTime = $startTime->format('Y-m-d H:i:s');

            // Determine if slot is in the past
            $isPast = false;
            // 15-minute lead preparation buffer
            if ($startTime->lt($now->copy()->addMinutes(15))) {
                $isPast = true;
            }

            // Capacity limit: Max 5 collection orders per interval slot
            $ordersInSlot = $ordersCount->get($fullDateTime, 0);
            $isFull = $ordersInSlot >= 5;

            if (!$isPast) {
                // Calculate relative time if the slot is today using Laravel's diffForHumans
                $relativeLabel = '';
                if ($slotDate->isSameDay($today)) {
                    $relativeLabel = ' (' . $startTime->diffForHumans($now, ['syntax' => \Carbon\CarbonInterface::DIFF_RELATIVE_TO_NOW]) . ')';
                }

                $slots[] = [
                    'time' => $slotFormatted,
                    'datetime' => $fullDateTime,
                    'is_available' => !$isFull,
                    'reason' => $isFull ? 'Slot is fully booked' : null,
                    'formatted_label' => "{$dateLabel} at {$slotFormatted}{$relativeLabel}",
                ];
            }

            $startTime->addMinutes($interval);
        }

        return $slots;
    }
}
