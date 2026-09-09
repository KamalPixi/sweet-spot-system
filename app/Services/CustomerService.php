<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Support\Facades\Hash;

class CustomerService
{
    /**
     * Get or create a guest customer profile.
     */
    public function findOrCreateGuest(array $data): Customer
    {
        $customer = null;

        // Try locating customer by email first if email is provided
        if (!empty($data['email'])) {
            $customer = Customer::where('email', $data['email'])->first();
        }

        // If not found by email but phone is provided, check by phone
        if (!$customer && !empty($data['phone'])) {
            $customer = Customer::where('phone', $data['phone'])->first();
        }

        if ($customer) {
            // If they exist and are a guest, update their details to the latest input
            if ($customer->is_guest) {
                $customer->update([
                    'first_name' => $data['first_name'] ?? $customer->first_name,
                    'last_name' => $data['last_name'] ?? $customer->last_name,
                    'email' => $data['email'] ?? $customer->email,
                    'phone' => $data['phone'] ?? $customer->phone,
                ]);
            }
            return $customer;
        }

        // Create new guest customer
        $phone = $data['phone'] ?? ('+4479' . rand(10000000, 99999999));
        return Customer::create([
            'first_name' => $data['first_name'] ?? null,
            'last_name' => $data['last_name'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $phone,
            'is_guest' => true,
        ]);
    }

    /**
     * Register a new authenticated customer.
     */
    public function register(array $data): Customer
    {
        // If there's an existing guest with the same phone/email, we can upgrade them
        $customer = Customer::where('phone', $data['phone'])
            ->orWhere(function ($query) use ($data) {
                if (!empty($data['email'])) {
                    $query->where('email', $data['email']);
                }
            })->first();

        if ($customer) {
            $customer->update([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'] ?? $customer->email,
                'phone' => $data['phone'],
                'password' => $data['password'], // Will be hashed via Eloquent casts
                'is_guest' => false,
            ]);
            return $customer;
        }

        return Customer::create([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'],
            'password' => $data['password'],
            'is_guest' => false,
        ]);
    }

    /**
     * Authenticate a customer profile.
     */
    public function authenticate(string $emailOrPhone, string $password): ?Customer
    {
        $customer = Customer::where('is_guest', false)
            ->where(function ($query) use ($emailOrPhone) {
                $query->where('email', $emailOrPhone)
                      ->orWhere('phone', $emailOrPhone);
            })->first();

        if ($customer && Hash::check($password, $customer->password)) {
            return $customer;
        }

        return null;
    }
}
