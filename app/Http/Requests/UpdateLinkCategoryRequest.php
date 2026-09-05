<?php

namespace App\Http\Requests;

use App\Models\Link;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLinkCategoryRequest extends FormRequest {
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array {
        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::notIn([Link::UNCATEGORISED_NAME]),
                Rule::unique('link_categories', 'category_name')->ignore($this->route('linkCategory')),
            ],
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array {
        return [
            'name.not_in' => 'Ez a kategórianév foglalt.',
        ];
    }
}
