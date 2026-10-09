<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PrintJob;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CloudPrntService
{
    protected StoreConfigService $storeConfigService;

    public function __construct(StoreConfigService $storeConfigService)
    {
        $this->storeConfigService = $storeConfigService;
    }

    /**
     * Enqueue a receipt print job for an order.
     * Prevents duplicate prints if a job is already queued or printing, unless $forceReprint is true.
     */
    public function queueOrderReceipt(Order $order, ?string $printerMac = null, bool $forceReprint = false): ?PrintJob
    {
        // Guard against duplicate auto-print queueing from different triggers (webhook vs page landing)
        if (!$forceReprint) {
            $existingActiveJob = PrintJob::where('order_id', $order->id)
                ->whereIn('status', ['queued', 'printing'])
                ->first();

            if ($existingActiveJob) {
                return $existingActiveJob;
            }

            // If the order has already been printed at least once and this isn't a forced reprint, skip
            if ($order->print_count > 0 || $order->printed_at !== null) {
                return null;
            }
        }

        $order->loadMissing(['items', 'customer', 'deliveryAddress']);

        $markupContent = $this->generateStarMarkup($order);

        $printJob = PrintJob::create([
            'order_id' => $order->id,
            'job_token' => 'JOB_' . strtoupper(Str::random(12)),
            'printer_mac' => $printerMac,
            'status' => 'queued',
            'content_type' => 'text/vnd.star.markup',
            'content' => $markupContent,
            'attempts' => 0,
        ]);

        return $printJob;
    }

    /**
     * Enqueue a hardware diagnostic test print slip.
     */
    public function queueTestReceipt(?string $printerMac = null, ?string $customNotes = null): PrintJob
    {
        $markupContent = $this->generateTestMarkup($customNotes);

        $printJob = PrintJob::create([
            'order_id' => null,
            'job_token' => 'TEST_' . strtoupper(Str::random(12)),
            'printer_mac' => $printerMac,
            'status' => 'queued',
            'content_type' => 'text/vnd.star.markup',
            'content' => $markupContent,
            'attempts' => 0,
        ]);

        return $printJob;
    }

    /**
     * Handle printer poll request and decide whether a job is ready.
     */
    public function handlePoll(array $pollData): array
    {
        $printerMac = $pollData['printerMAC'] ?? null;
        $statusCode = $pollData['statusCode'] ?? '';

        // Query oldest queued job for this printer (or general queue)
        $jobQuery = PrintJob::where('status', 'queued')->orderBy('id', 'asc');
        if ($printerMac) {
            $jobQuery->where(function ($q) use ($printerMac) {
                $q->whereNull('printer_mac')->orWhere('printer_mac', $printerMac);
            });
        }

        $nextJob = $jobQuery->first();

        if ($nextJob) {
            $nextJob->update([
                'status' => 'printing',
                'attempts' => $nextJob->attempts + 1,
            ]);

            return [
                'jobReady' => true,
                'jobToken' => $nextJob->job_token,
                'mediaTypes' => ['text/vnd.star.markup', 'text/plain'],
            ];
        }

        return [
            'jobReady' => false,
        ];
    }

    /**
     * Get job for download by printer.
     */
    public function getJobByToken(string $jobToken): ?PrintJob
    {
        return PrintJob::where('job_token', $jobToken)->first();
    }

    /**
     * Complete job upon receiving DELETE from printer.
     */
    public function completeJob(string $jobToken, ?string $clientCode = null): bool
    {
        $job = PrintJob::where('job_token', $jobToken)->first();
        if (!$job) {
            return false;
        }

        $job->update([
            'status' => 'printed',
            'printed_at' => now(),
        ]);

        if ($job->order) {
            $orderUpdates = [
                'printed_at' => now(),
                'print_count' => $job->order->print_count + 1,
            ];

            if ($job->order->payment_status === 'paid' && in_array($job->order->status, ['pending', 'awaiting_payment'])) {
                $orderUpdates['status'] = 'preparing';
                $orderUpdates['preparing_at'] = $job->order->preparing_at ?? now();
            }

            $job->order->update($orderUpdates);
        }

        return true;
    }

    /**
     * Cancel an active or queued print job.
     */
    public function cancelJob(int|string $jobIdOrToken): bool
    {
        $job = is_numeric($jobIdOrToken)
            ? PrintJob::find($jobIdOrToken)
            : PrintJob::where('job_token', $jobIdOrToken)->first();

        if (!$job || !in_array($job->status, ['queued', 'printing'])) {
            return false;
        }

        $job->update([
            'status' => 'cancelled',
            'error_message' => 'Cancelled by admin',
        ]);

        return true;
    }

    /**
     * Cancel all active print jobs for a specific order.
     */
    public function cancelOrderJobs(int $orderId): int
    {
        return PrintJob::where('order_id', $orderId)
            ->whereIn('status', ['queued', 'printing'])
            ->update([
                'status' => 'cancelled',
                'error_message' => 'Cancelled by admin',
            ]);
    }

    /**
     * Generate Star Document Markup formatted for 80mm thermal paper (TSP100 series).
     */
    public function generateStarMarkup(Order $order): string
    {
        $storeName = $this->storeConfigService->get('store_name', 'SWEET SPOT SYSTEM');
        $storePhone = $this->storeConfigService->get('store_phone', '');
        $dateFormatted = Carbon::parse($order->created_at)->format('d/m/Y H:i');

        $typeLabel = match ($order->type) {
            'dine_in' => "DINE-IN - TABLE #" . ($order->table_number ?? 'N/A'),
            'delivery' => 'HOME DELIVERY',
            'collection' => 'STORE COLLECTION (' . ($order->collection_time ? Carbon::parse($order->collection_time)->format('H:i d M') : 'ASAP') . ')',
            default => strtoupper($order->type),
        };

        $lines = [];
        $lines[] = "[align: center]";
        $lines[] = "[bold: on][mag: width 2; height 2]{$storeName}[mag][bold: off]";
        if ($storePhone) {
            $lines[] = "Tel: {$storePhone}";
        }
        $lines[] = "[line: count 1]";
        $lines[] = "[bold: on][mag: width 2; height 2]{$typeLabel}[mag][bold: off]";
        $lines[] = "Order #: {$order->order_number}";
        $lines[] = "Date: {$dateFormatted}";
        $lines[] = "[line: count 1]";

        // Customer Details
        if ($order->customer) {
            $custName = trim(($order->customer->first_name ?? '') . ' ' . ($order->customer->last_name ?? ''));
            $lines[] = "[align: left]";
            if ($custName) {
                $lines[] = "Customer: {$custName}";
            }
            if ($order->customer->phone) {
                $lines[] = "Phone: {$order->customer->phone}";
            }
        }

        if ($order->type === 'delivery' && $order->deliveryAddress) {
            $lines[] = "Address: {$order->deliveryAddress->address_line_1}";
            if ($order->deliveryAddress->address_line_2) {
                $lines[] = "         {$order->deliveryAddress->address_line_2}";
            }
            $lines[] = "Postcode: {$order->deliveryAddress->postcode}";
            if ($order->delivery_provider) {
                $lines[] = "Provider: " . strtoupper(str_replace('_', ' ', $order->delivery_provider));
            }
        }

        if ($order->notes) {
            $lines[] = "[bold: on]Notes: {$order->notes}[bold: off]";
        }

        $lines[] = "[line: count 1]";
        $lines[] = "[bold: on]ITEMS[bold: off]";
        $lines[] = "[line: count 1]";

        // Items Table
        foreach ($order->items as $item) {
            $itemName = $item->product_name;
            if ($item->variation_name) {
                $itemName .= " ({$item->variation_name})";
            }
            $qty = $item->quantity;
            $lineTotal = number_format($item->total, 2);

            $lines[] = "[bold: on]{$qty}x {$itemName}[bold: off]";
            $lines[] = "[align: right]£{$lineTotal}[align: left]";
        }

        $lines[] = "[line: count 1]";
        $lines[] = "[align: right]";
        $lines[] = "Subtotal: £" . number_format($order->subtotal, 2);
        if ($order->type === 'delivery') {
            $lines[] = "Delivery Fee: £" . number_format($order->delivery_fee, 2);
        }
        $lines[] = "[bold: on][mag: width 1; height 2]TOTAL: £" . number_format($order->total, 2) . "[mag][bold: off]";
        $lines[] = "Payment: " . strtoupper($order->payment_method ?? 'Card') . " (" . strtoupper($order->payment_status) . ")";

        $lines[] = "[line: count 1]";
        $lines[] = "[align: center]";
        $lines[] = "Thank you for visiting Sweet Spot!";
        $lines[] = "[feed: count 4]";
        $lines[] = "[cut: feed]";

        return implode("\n", $lines);
    }

    /**
     * Generate diagnostic test slip Star Document Markup (TSP100 80mm).
     */
    public function generateTestMarkup(?string $customNotes = null): string
    {
        $storeName = $this->storeConfigService->get('store_name', 'SWEET SPOT SYSTEM');
        $storePhone = $this->storeConfigService->get('store_phone', '');
        $dateFormatted = now()->format('d/m/Y H:i:s');

        $lines = [];
        $lines[] = "[align: center]";
        $lines[] = "[bold: on][mag: width 2; height 2]{$storeName}[mag][bold: off]";
        if ($storePhone) {
            $lines[] = "Tel: {$storePhone}";
        }
        $lines[] = "[line: count 1]";
        $lines[] = "[bold: on][mag: width 2; height 2]HARDWARE TEST SLIP[mag][bold: off]";
        $lines[] = "Star CloudPRNT Protocol Verified";
        $lines[] = "Timestamp: {$dateFormatted}";
        $lines[] = "[line: count 1]";

        $lines[] = "[align: left]";
        $lines[] = "[bold: on]PRINTER DIAGNOSTICS:[bold: off]";
        $lines[] = "Model: Star Micronics TSP100 Series";
        $lines[] = "Emulation: Star Line Mode / StarPRNT";
        $lines[] = "Paper Width: 80mm (48 Columns)";
        $lines[] = "Cloud Protocol: HTTP/JSON Polling (Star CloudPRNT)";
        $lines[] = "Status: Online & Ready";
        $lines[] = "[line: count 1]";

        $lines[] = "[bold: on]FONT & EMPHASIS TEST:[bold: off]";
        $lines[] = "Regular Text: Sweet Spot London Store";
        $lines[] = "[bold: on]Bold Text: Fresh Artisan Desserts[bold: off]";
        $lines[] = "[under: on]Underlined Text: https://sweetspot.test[under: off]";
        $lines[] = "[invert: on] INVERTED HIGH-CONTRAST HEADER [invert: off]";
        $lines[] = "[line: count 1]";

        if ($customNotes) {
            $lines[] = "[bold: on]Operator Note:[bold: off]";
            $lines[] = $customNotes;
            $lines[] = "[line: count 1]";
        }

        $lines[] = "[align: center]";
        $lines[] = "[bold: on]*** TEST COMPLETE - CUTTER OK ***[bold: off]";
        $lines[] = "[feed: count 4]";
        $lines[] = "[cut: feed]";

        return implode("\n", $lines);
    }
}
