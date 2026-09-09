<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

class UpdateCategoryRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:4096',
            'status' => 'nullable|boolean',
            'order' => 'nullable|integer',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $slug = Str::slug((string) $this->input('name'));
                $categoryId = $this->route('id');

                if ($slug !== '' && Category::where('slug', $slug)->whereKeyNot($categoryId)->exists()) {
                    $validator->errors()->add('name', 'A category with this name already exists.');
                }
            },
        ];
    }
}
