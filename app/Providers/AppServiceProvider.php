<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::usePreloadTagAttributes(false);

        // 1. Global API Rate Limiter
        \Illuminate\Support\Facades\RateLimiter::for('global_api', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by($request->ip());
        });

        // 2. Authentication Rate Limiter (Login/Register)
        \Illuminate\Support\Facades\RateLimiter::for('auth_limit', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(5)->by($request->ip());
        });

        // 3. Newsletter Subscription Rate Limiter
        \Illuminate\Support\Facades\RateLimiter::for('newsletter_limit', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(3)->by($request->ip());
        });

        // 4. Order Placement Rate Limiter
        \Illuminate\Support\Facades\RateLimiter::for('order_limit', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(5)->by($request->ip());
        });
    }
}
