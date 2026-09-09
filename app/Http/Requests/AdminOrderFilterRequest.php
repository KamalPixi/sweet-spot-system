<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminOrderFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'nullable|in:all,pending,paid,preparing,ready,completed,cancelled,incomplete,awaiting_payment',
            'type' => 'nullable|in:all,delivery,collection',
        ];
    }
}
