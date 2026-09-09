@php
    $storeLogo = \App\Models\StoreConfig::where('key', 'store_logo')->value('value');
    $storeName = \App\Models\StoreConfig::where('key', 'store_name')->value('value') ?: 'Pudding London';
@endphp
@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if ($storeLogo)
    <img src="{{ url($storeLogo) }}" class="logo" alt="{{ $storeName }}">
@else
    <span style="font-family: 'Outfit', 'Inter', sans-serif; font-size: 22px; font-weight: 800; color: #8e5233; letter-spacing: 1px;">{{ $storeName }}</span>
@endif
</a>
</td>
</tr>
