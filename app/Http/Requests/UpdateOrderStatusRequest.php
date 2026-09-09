<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'nullable|in:pending,paid,preparing,ready,completed,cancelled',
            'payment_status' => 'nullable|in:unpaid,paid,failed',
        ];
    }
}
