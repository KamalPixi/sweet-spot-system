<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'type' => 'required|in:delivery,collection,dine_in',
            'table_number' => 'required_if:type,dine_in|nullable|string|max:50',
            'notes' => 'nullable|string',
            'payment_method' => 'nullable|string',
            'payment_transaction_id' => 'nullable|string',
            'day' => 'nullable|string|max:20',
            'fulfillment_day' => 'nullable|string|max:20',
            'items' => 'required|array|min:1',
            'items.*.is_box' => 'nullable|boolean',
            'items.*.category_id' => 'required_if:items.*.is_box,true|nullable|exists:categories,id',
            'items.*.box_size' => 'required_if:items.*.is_box,true|nullable|integer|min:1',
            'items.*.box_name' => 'nullable|string|max:255',
            'items.*.box_items' => 'required_if:items.*.is_box,true|nullable|array|min:1',
            'items.*.box_items.*.product_id' => 'required|exists:products,id',
            'items.*.box_items.*.quantity' => 'required|integer|min:1',
            'items.*.product_id' => 'required_without:items.*.is_box|nullable|exists:products,id',
            'items.*.product_variation_id' => 'nullable|integer',
            'items.*.quantity' => 'required|integer|min:1',
        ];

        if (!$this->user() || !($this->user() instanceof \App\Models\Customer)) {
            $rules['customer.first_name'] = 'nullable|string|max:255';
            $rules['customer.last_name'] = 'nullable|string|max:255';
            $rules['customer.phone'] = 'nullable|string';
            $rules['customer.email'] = 'nullable|email';
        }

        if ($this->input('type') === 'delivery') {
            $rules['address.address_line_1'] = 'required|string|max:255';
            $rules['address.address_line_2'] = 'nullable|string|max:255';
            $rules['address.city'] = 'required|string|max:255';
            $rules['address.postcode'] = 'required|string';
        } elseif ($this->input('type') === 'collection') {
            $rules['collection_time'] = 'required|string';
        }

        return $rules;
    }
}
