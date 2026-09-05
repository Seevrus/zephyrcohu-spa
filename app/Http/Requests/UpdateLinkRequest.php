<?php

namespace App\Http\Requests;

use App\Models\Link;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLinkRequest extends FormRequest {
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
            'title' => ['required', 'string', 'max:500'],
            'url' => ['required', 'string', 'max:500', 'url'],
            'categoryName' => [
                'nullable', 'string', 'max:255',
                Rule::notIn([Link::UNCATEGORISED_NAME]),
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
            'categoryName.not_in' => 'Ez a kategórianév foglalt.',
        ];
    }
}
