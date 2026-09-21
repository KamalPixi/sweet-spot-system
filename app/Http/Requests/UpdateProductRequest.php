<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'ingredients' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'nullable|image|max:4096',
            'existing_images' => 'nullable|array',
            'existing_images.*' => 'nullable|string',
            'status' => 'nullable|boolean',
            'is_home_treat' => 'nullable|boolean',
            'has_variations' => 'required|boolean',
            'base_price' => 'required_if:has_variations,false|numeric|min:0',
            'base_weight' => 'nullable|numeric|min:0',
            'related_product_ids' => 'nullable|array|exists:products,id',
            'variations' => 'nullable|array',
            'variations.*.id' => 'nullable|integer|exists:product_variations,id',
            'variations.*.name' => 'required_with:variations|string',
            'variations.*.price' => 'required_with:variations|numeric|min:0',
            'variations.*.weight' => 'nullable|numeric|min:0',
            'variations.*.sku' => 'nullable|string',
            'variations.*.existing_image' => 'nullable|string',
            'variations.*.image_file' => 'nullable|image|max:4096',
            'variations.*.stock' => 'nullable|integer|min:0',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $slug = Str::slug((string) $this->input('name'));
                $productId = $this->route('id');

                if ($slug !== '' && Product::where('slug', $slug)->whereKeyNot($productId)->exists()) {
                    $validator->errors()->add('name', 'A product with this name already exists.');
                }
            },
        ];
    }
}
