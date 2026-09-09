<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required_without:phone|nullable|email|unique:customers,email',
            'phone' => 'required_without:email|nullable|string|unique:customers,phone',
            'password' => 'required|string|min:6|confirmed',
        ];
    }
}
