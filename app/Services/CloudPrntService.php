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
     */
    public function queueOrderReceipt(Order $order, ?string $printerMac = null): PrintJob
    {
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
            $job->order->update([
                'printed_at' => now(),
                'print_count' => $job->order->print_count + 1,
            ]);
        }

        return true;
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
}
