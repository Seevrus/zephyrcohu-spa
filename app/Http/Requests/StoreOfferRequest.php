<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOfferRequest extends FormRequest {
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
            'audience' => ['required', 'string', 'in:A,P'],
            'title' => ['required', 'string', 'max:255'],
            'mainContent' => ['required', 'string'],
            'additionalContent' => ['nullable', 'string'],
            'publishedAt' => ['required', 'date'],
        ];
    }
}
