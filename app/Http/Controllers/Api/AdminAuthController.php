<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminLoginRequest;
use App\Http\Requests\AdminPasswordUpdateRequest;
use App\Http\Requests\AdminProfileUpdateRequest;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AdminAuthController extends Controller
{
    /**
     * Admin login to generate API token.
     */
    public function login(AdminLoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated()['email'])->first();

        if (!$user || !Hash::check($request->validated()['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid admin credentials.',
            ], 401);
        }

        $token = $user->createToken('admin_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Admin login successful.',
            'data' => [
                'user' => (new AdminUserResource($user))->resolve($request),
                'token' => $token,
            ]
        ]);
    }

    /**
     * Get admin profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => (new AdminUserResource($request->user()))->resolve($request),
        ]);
    }

    public function updateProfile(AdminProfileUpdateRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!$user instanceof User) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $user->fill($request->validated());
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => (new AdminUserResource($user->fresh()))->resolve($request),
        ]);
    }

    public function updatePassword(AdminPasswordUpdateRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!$user instanceof User) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $data = $request->validated();

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $user->password = $data['password'];
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }
}
