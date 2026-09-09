<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerLoginRequest;
use App\Http\Requests\CustomerRegisterRequest;
use App\Http\Resources\AdminUserResource;
use App\Http\Resources\CustomerResource;
use App\Services\CustomerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class CustomerAuthController extends Controller
{
    protected CustomerService $customerService;

    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }

    /**
     * Register a new customer.
     */
    public function register(CustomerRegisterRequest $request): JsonResponse
    {
        $customer = $this->customerService->register($request->validated());
        $token = $customer->createToken('customer_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful.',
            'data' => [
                'customer' => (new CustomerResource($customer))->resolve($request),
                'token' => $token,
            ]
        ], 201);
    }

    /**
     * Login customer.
     */
    public function login(CustomerLoginRequest $request): JsonResponse
    {
        $customer = $this->customerService->authenticate(
            $request->input('email_or_phone'),
            $request->input('password')
        );

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials.',
            ], 401);
        }

        $token = $customer->createToken('customer_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'customer' => (new CustomerResource($customer))->resolve($request),
                'token' => $token,
            ]
        ]);
    }

    /**
     * Logout customer.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()->delete();
            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No active session found.',
        ], 401);
    }

    /**
     * Get authenticated customer profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if ($user) {
            // Check if user is a Customer or standard User (Admin)
            if ($user instanceof \App\Models\Customer) {
                return response()->json([
                    'success' => true,
                    'type' => 'customer',
                    'data' => (new CustomerResource($user->load('addresses')))->resolve($request),
                ]);
            } else {
                return response()->json([
                    'success' => true,
                    'type' => 'admin',
                    'data' => (new AdminUserResource($user))->resolve($request),
                ]);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'Unauthenticated.',
        ], 401);
    }

    /**
     * Update authenticated customer's profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !($user instanceof \App\Models\Customer)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:100',
            'last_name'  => 'sometimes|required|string|max:100',
            'phone'      => 'sometimes|nullable|string|max:30',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data'    => (new CustomerResource($user->fresh()->load('addresses')))->resolve($request),
        ]);
    }

    /**
     * Update authenticated customer's password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !($user instanceof \App\Models\Customer)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $user->password = $validated['password'];
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }

    /**
     * Send password reset link or code.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email_or_phone' => 'required|string',
        ]);

        $input = $request->input('email_or_phone');
        $isEmail = filter_var($input, FILTER_VALIDATE_EMAIL);

        // Find customer
        $customer = \App\Models\Customer::query()
            ->where($isEmail ? 'email' : 'phone', $input)
            ->first();

        // Always return success to prevent user enumeration
        if (!$customer) {
            return response()->json([
                'success' => true,
                'message' => 'If the account is registered, a reset link or code has been sent.',
                'delivery_method' => $isEmail ? 'email' : 'phone',
            ]);
        }

        // Clean up old tokens/codes for this email/phone
        \Illuminate\Support\Facades\DB::table('customer_password_resets')
            ->where('email_or_phone', $input)
            ->delete();

        if ($isEmail) {
            // Email Flow: Link with token
            $token = \Illuminate\Support\Str::random(64);
            \Illuminate\Support\Facades\DB::table('customer_password_resets')->insert([
                'email_or_phone' => $input,
                'token_or_code' => $token,
                'created_at' => now(),
            ]);

            $resetUrl = url("/reset-password?token={$token}&email=" . urlencode($input));
            
            // Send the email notification
            $customer->notify(new \App\Notifications\CustomerResetPasswordNotification($resetUrl));

            // Log the email in development
            \Illuminate\Support\Facades\Log::info("--- PUDDING LONDON PASSWORD RESET EMAIL ---");
            \Illuminate\Support\Facades\Log::info("To: {$input}");
            \Illuminate\Support\Facades\Log::info("Reset Link: {$resetUrl}");
            \Illuminate\Support\Facades\Log::info("------------------------------------------");
        } else {
            // Phone Flow: 6-digit code
            $code = (string) rand(100000, 999999);
            \Illuminate\Support\Facades\DB::table('customer_password_resets')->insert([
                'email_or_phone' => $input,
                'token_or_code' => $code,
                'created_at' => now(),
            ]);

            // Log the SMS in development
            \Illuminate\Support\Facades\Log::info("--- PUDDING LONDON PASSWORD RESET SMS ---");
            \Illuminate\Support\Facades\Log::info("To: {$input}");
            \Illuminate\Support\Facades\Log::info("Reset Code: {$code}");
            \Illuminate\Support\Facades\Log::info("-----------------------------------------");
        }

        return response()->json([
            'success' => true,
            'message' => 'If the account is registered, a reset link or code has been sent.',
            'delivery_method' => $isEmail ? 'email' : 'phone',
        ]);
    }

    /**
     * Reset password using token or code.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email_or_phone' => 'required|string',
            'token_or_code' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $input = $request->input('email_or_phone');
        $tokenOrCode = $request->input('token_or_code');
        $isEmail = filter_var($input, FILTER_VALIDATE_EMAIL);

        // Verify token/code
        $resetRecord = \Illuminate\Support\Facades\DB::table('customer_password_resets')
            ->where('email_or_phone', $input)
            ->where('token_or_code', $tokenOrCode)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired reset code/link.',
            ], 422);
        }

        // Check expiration (1 hour)
        if (now()->diffInHours(\Carbon\Carbon::parse($resetRecord->created_at)) >= 1) {
            \Illuminate\Support\Facades\DB::table('customer_password_resets')
                ->where('email_or_phone', $input)
                ->delete();

            return response()->json([
                'success' => false,
                'message' => 'This reset link or code has expired.',
            ], 422);
        }

        // Find customer
        $customer = \App\Models\Customer::query()
            ->where($isEmail ? 'email' : 'phone', $input)
            ->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer account not found.',
            ], 404);
        }

        // Update password
        $customer->update([
            'password' => $request->input('password'),
        ]);

        // Delete the used token
        \Illuminate\Support\Facades\DB::table('customer_password_resets')
            ->where('email_or_phone', $input)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully. You can now log in.',
        ]);
    }
}
