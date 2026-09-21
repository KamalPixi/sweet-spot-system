<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PrintJob;
use App\Services\CloudPrntService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class CloudPrntController extends Controller
{
    protected CloudPrntService $cloudPrntService;

    public function __construct(CloudPrntService $cloudPrntService)
    {
        $this->cloudPrntService = $cloudPrntService;
    }

    /**
     * Star CloudPRNT Polling endpoint (POST).
     * The printer polls this endpoint periodically.
     */
    public function poll(Request $request): JsonResponse
    {
        $payload = $request->all();
        $response = $this->cloudPrntService->handlePoll($payload);

        return response()->json($response);
    }

    /**
     * Star CloudPRNT Job Retrieval (GET).
     * The printer downloads the job ticket content.
     */
    public function getJob(string $jobToken): Response|JsonResponse
    {
        $job = $this->cloudPrntService->getJobByToken($jobToken);

        if (!$job) {
            return response()->json(['error' => 'Job not found'], 404);
        }

        return response($job->content, 200, [
            'Content-Type' => $job->content_type ?? 'text/vnd.star.markup; charset=utf-8',
        ]);
    }

    /**
     * Star CloudPRNT Job Completion Acknowledgement (DELETE).
     * Printer confirms successful print.
     */
    public function deleteJob(Request $request, string $jobToken): Response|JsonResponse
    {
        $clientCode = $request->query('code');
        $success = $this->cloudPrntService->completeJob($jobToken, $clientCode);

        if (!$success) {
            return response()->json(['error' => 'Job could not be acknowledged'], 404);
        }

        return response('', 200);
    }

    /**
     * Admin: Manually trigger print for an order (always forces reprint).
     */
    public function manualPrint(Request $request, int $orderId): JsonResponse
    {
        $order = Order::findOrFail($orderId);
        $job = $this->cloudPrntService->queueOrderReceipt($order, null, true);

        return response()->json([
            'success' => true,
            'message' => "Print job enqueued successfully for order #{$order->order_number}.",
            'data' => [
                'job_token' => $job->job_token,
                'status' => $job->status,
                'created_at' => $job->created_at,
            ],
        ]);
    }

    /**
     * Admin: Cancel an active or queued print job.
     */
    public function cancelPrintJob(Request $request, int $jobId): JsonResponse
    {
        $cancelled = $this->cloudPrntService->cancelJob($jobId);

        if (!$cancelled) {
            return response()->json([
                'success' => false,
                'message' => 'Job cannot be cancelled (it may have already printed or does not exist).',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Print job cancelled successfully.',
        ]);
    }

    /**
     * Admin: Cancel active prints for an order.
     */
    public function cancelOrderPrints(Request $request, int $orderId): JsonResponse
    {
        $count = $this->cloudPrntService->cancelOrderJobs($orderId);

        return response()->json([
            'success' => true,
            'message' => "{$count} active print job(s) cancelled for this order.",
            'cancelled_count' => $count,
        ]);
    }

    /**
     * Admin: Trigger hardware diagnostic test print slip.
     */
    public function testPrint(Request $request): JsonResponse
    {
        $printerMac = $request->input('printer_mac');
        $notes = $request->input('notes');

        $job = $this->cloudPrntService->queueTestReceipt($printerMac, $notes);

        return response()->json([
            'success' => true,
            'message' => 'Hardware test slip enqueued! Star CloudPRNT printer will fetch on next poll.',
            'data' => [
                'job_token' => $job->job_token,
                'status' => $job->status,
                'created_at' => $job->created_at,
            ],
        ]);
    }

    /**
     * Admin: List print queue and history.
     */
    public function listJobs(Request $request): JsonResponse
    {
        $jobs = PrintJob::with('order')
            ->orderBy('id', 'desc')
            ->limit(30)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $jobs,
        ]);
    }
}
