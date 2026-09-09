<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Customer;
use App\Models\User;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('admin.live', function ($user) {
    return $user instanceof User;
});

Broadcast::channel('customer.live.{customerId}', function ($user, $customerId) {
    return $user instanceof Customer && (int) $user->id === (int) $customerId;
});
