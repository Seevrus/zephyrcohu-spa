<?php

namespace App\Http\Requests;

use App\DocumentCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocumentRequest extends FormRequest {
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
            'category' => ['required', Rule::enum(DocumentCategory::class)],
            'displayName' => ['required', 'string', 'max:255'],
            'version' => ['required', 'string', 'max:255'],
            'publishedAt' => ['required', 'date'],
            'file' => ['nullable', 'file', 'max:51200'],
        ];
    }
}
