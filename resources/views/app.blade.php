@php
    $storeName = \App\Models\StoreConfig::where('key', 'store_name')->value('value') ?: 'Pudding London';
    $seoTitle = \App\Models\StoreConfig::where('key', 'seo_title')->value('value') ?: 'Handcrafted Cakes & Specialty Coffee | Pudding London';
    $seoDesc = \App\Models\StoreConfig::where('key', 'seo_description')->value('value') ?: 'Order handcrafted artisanal cakes, braids, and specialty coffee online for delivery or collection in London.';
    $seoKeywords = \App\Models\StoreConfig::where('key', 'seo_keywords')->value('value') ?: 'cakes, coffee, london, bakery, artisanal, pastries';
    $storeLogo = \App\Models\StoreConfig::where('key', 'store_logo')->value('value');
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>{{ $seoTitle }}</title>
        <meta name="description" content="{{ $seoDesc }}">
        <meta name="keywords" content="{{ $seoKeywords }}">

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="{{ $seoTitle }}">
        <meta property="og:description" content="{{ $seoDesc }}">
        @if($storeLogo)
            <meta property="og:image" content="{{ url($storeLogo) }}">
        @endif

        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:title" content="{{ $seoTitle }}">
        <meta property="twitter:description" content="{{ $seoDesc }}">
        @if($storeLogo)
            <meta property="twitter:image" content="{{ url($storeLogo) }}">
        @endif
        
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    </head>
    <body>

        <div id="root"></div>

    </body>
</html>
