<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\StoreConfigController;
use App\Http\Controllers\Api\CollectionSlotController;
use App\Http\Controllers\Api\NewsletterController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\AdminCustomerController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\TrashController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\FaqController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\CloudPrntController;
use App\Http\Controllers\Api\UberDirectController;
use App\Http\Controllers\Api\PaymentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Wrap all API routes in the global rate limiter
Route::middleware('throttle:global_api')->group(function () {

    // --- Storefront Configs & Postcode ---
    Route::get('/configs', [StoreConfigController::class, 'index']);
    Route::post('/check-postcode', [StoreConfigController::class, 'checkPostcode']);
    Route::get('/collection-slots', [CollectionSlotController::class, 'getSlots']);
    Route::get('/opening-hours', [CollectionSlotController::class, 'getOpeningHours']);

    // --- Payment Providers & Global Payments ---
    Route::get('/payment/providers', [PaymentController::class, 'getProviders']);
    Route::post('/payment/globalpay/create-link', [PaymentController::class, 'createHostedLink']);
    Route::post('/payment/globalpay/token', [PaymentController::class, 'generateGlobalPayToken']);
    Route::post('/payment/globalpay/process', [PaymentController::class, 'processGlobalPay']);
    Route::post('/webhooks/globalpay', [PaymentController::class, 'webhook']);

    // --- Newsletter & FAQs & Reviews ---
    Route::get('/faqs', [FaqController::class, 'index']);
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::post('/newsletter/subscribe', [NewsletterController::class, 'subscribe'])->middleware('throttle:newsletter_limit');
    Route::post('/newsletter/unsubscribe', [NewsletterController::class, 'unsubscribe']);
    Route::get('/newsletter/status', [NewsletterController::class, 'status']);

    // --- Menu Catalog ---
    Route::get('/categories', [ProductController::class, 'categories']);
    Route::get('/menu-catalog', [ProductController::class, 'menuCatalog']);
    Route::get('/categories/{slug}/products', [ProductController::class, 'categoryProducts']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{slug}', [ProductController::class, 'show']);

    // --- Guest Checkout & Order Tracking (Checkout Throttled) ---
    Route::post('/orders', [OrderController::class, 'store'])->middleware('throttle:order_limit');
    Route::get('/orders/track/{orderNumber}', [OrderController::class, 'show']);
    Route::post('/payment/webhook', [OrderController::class, 'webhook']);

    // --- Table Ordering / QR ---
    Route::get('/tables/validate/{tableNumber}', function ($tableNumber) {
        return response()->json([
            'success' => true,
            'table_number' => (string) $tableNumber,
            'message' => 'Table verified',
        ]);
    });

    // --- Star CloudPRNT (Printer Polling Protocol) ---
    Route::post('/cloudprnt/poll', [CloudPrntController::class, 'poll']);
    Route::get('/cloudprnt/job/{jobToken}', [CloudPrntController::class, 'getJob']);
    Route::delete('/cloudprnt/job/{jobToken}', [CloudPrntController::class, 'deleteJob']);

    // --- Uber Direct (Customer Quotation & Delivery Webhook) ---
    Route::post('/delivery/uber/quote', [UberDirectController::class, 'getQuote']);
    Route::post('/webhooks/uber-direct', [UberDirectController::class, 'webhook']);

    // --- Customer Auth (Throttled) ---
    Route::post('/customer/register', [CustomerAuthController::class, 'register'])->middleware('throttle:auth_limit');
    Route::post('/customer/login', [CustomerAuthController::class, 'login'])->middleware('throttle:auth_limit');
    Route::post('/customer/forgot-password', [CustomerAuthController::class, 'forgotPassword'])->middleware('throttle:auth_limit');
    Route::post('/customer/reset-password', [CustomerAuthController::class, 'resetPassword'])->middleware('throttle:auth_limit');

    // --- Admin Auth (Throttled) ---
    Route::post('/admin/login', [AdminAuthController::class, 'login'])->middleware('throttle:auth_limit');

    // --- Protected Routes (Sanctum) ---
    Route::middleware('auth:sanctum')->group(function () {
        // Current authenticated entity context (can be Customer or User/Admin)
        Route::get('/me', [CustomerAuthController::class, 'me']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::delete('/notifications', [NotificationController::class, 'clearAll']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
        
        // Customer specific
        Route::post('/customer/logout', [CustomerAuthController::class, 'logout']);
        Route::patch('/customer/profile', [CustomerAuthController::class, 'updateProfile']);
        Route::put('/customer/profile/password', [CustomerAuthController::class, 'updatePassword']);
        Route::get('/customer/orders', [OrderController::class, 'index']);
        
        // Admin specific / Configuration checks
        Route::prefix('admin')->group(function () {
            Route::get('/me', [AdminAuthController::class, 'me']);
            Route::put('/profile', [AdminAuthController::class, 'updateProfile']);
            Route::put('/profile/password', [AdminAuthController::class, 'updatePassword']);
            Route::post('/configs', [StoreConfigController::class, 'update']);
            Route::get('/newsletter', [NewsletterController::class, 'index']);
            Route::get('/customers', [AdminCustomerController::class, 'index']);
            Route::get('/customers/{customer}', [AdminCustomerController::class, 'show']);
            Route::get('/opening-hours', [CollectionSlotController::class, 'getOpeningHours']);
            Route::put('/opening-hours/{id}', [CollectionSlotController::class, 'updateOpeningHour']);
            Route::get('/admin-reports', [OrderController::class, 'adminReports']);
            
            // Admin Categories CRUD
            Route::get('/categories', [ProductController::class, 'adminCategories']);
            Route::post('/categories', [ProductController::class, 'storeCategory']);
            Route::put('/categories/{id}', [ProductController::class, 'updateCategory']);
            Route::delete('/categories/{id}', [ProductController::class, 'destroyCategory']);
            
            // Admin Products CRUD
            Route::get('/products', [ProductController::class, 'adminProducts']);
            Route::post('/products', [ProductController::class, 'storeProduct']);
            Route::put('/products/{id}', [ProductController::class, 'updateProduct']);
            Route::delete('/products/{id}', [ProductController::class, 'destroyProduct']);
            
            // Admin Orders Management
            Route::get('/orders', [OrderController::class, 'adminOrders']);
            Route::get('/orders/{orderNumber}', [OrderController::class, 'adminOrderShow']);
            Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);
            Route::post('/orders/{id}/print', [CloudPrntController::class, 'manualPrint']);
            Route::post('/orders/{id}/dispatch-uber', [UberDirectController::class, 'dispatchOrder']);
            Route::post('/orders/{id}/advance-delivery-status', [UberDirectController::class, 'advanceDeliveryStatus']);
            Route::get('/printer/jobs', [CloudPrntController::class, 'listJobs']);
            Route::post('/printer/test', [CloudPrntController::class, 'testPrint']);
            Route::post('/payment/test-connection', [PaymentController::class, 'testConnection']);
            Route::delete('/printer/jobs/{jobId}', [CloudPrntController::class, 'cancelPrintJob']);
            Route::delete('/orders/{id}/prints', [CloudPrntController::class, 'cancelOrderPrints']);
            
            // Admin Collection Slots Management
            Route::post('/collection-slots', [CollectionSlotController::class, 'store']);
            Route::delete('/collection-slots/{id}', [CollectionSlotController::class, 'destroy']);
            
            // Admin FAQs Management
            Route::get('/faqs', [FaqController::class, 'adminIndex']);
            Route::post('/faqs', [FaqController::class, 'store']);
            Route::put('/faqs/{faq}', [FaqController::class, 'update']);
            Route::delete('/faqs/{faq}', [FaqController::class, 'destroy']);
            
            // Admin Reviews (Local Love) Management
            Route::get('/reviews', [ReviewController::class, 'adminIndex']);
            Route::post('/reviews', [ReviewController::class, 'store']);
            Route::post('/reviews/sync-google', [ReviewController::class, 'syncGoogle']);
            Route::put('/reviews/{review}', [ReviewController::class, 'update']);
            Route::patch('/reviews/{review}/toggle-active', [ReviewController::class, 'toggleActive']);
            Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);
            
            // Admin Trash / Soft Deletes
            Route::get('/trash', [TrashController::class, 'index']);
            Route::post('/trash/restore/{type}/{id}', [TrashController::class, 'restore']);
            Route::delete('/trash/force/{type}/{id}', [TrashController::class, 'forceDelete']);
        });
    });

});
