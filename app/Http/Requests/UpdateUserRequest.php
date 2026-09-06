<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest {
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
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'confirmed' => ['required', 'boolean'],
            'newsletter' => ['required', 'boolean'],
            'generatePassword' => ['required', 'boolean'],
        ];
    }

    /**
     * Reject a submit that would change nothing at all, mirroring the legacy admin form.
     */
    public function withValidator(Validator $validator): void {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $user = $this->route('user');

            // Confirmation is one-way, so a `false` on a confirmed account is
            // ignored by the controller and does not count as a change either.
            $confirmedUnchanged = $user->confirmed || ! $this->boolean('confirmed');

            $nothingChanged = $user->email === $this->input('email')
                && $confirmedUnchanged
                && $user->newsletter === $this->boolean('newsletter')
                && ! $this->boolean('generatePassword');

            if ($nothingChanged) {
                $validator->errors()->add('email', 'Az űrlapon nem került semmi módosításra.');
            }
        });
    }
}
