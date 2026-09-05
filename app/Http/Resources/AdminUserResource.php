<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'confirmed' => $this->confirmed,
            'newsletter' => $this->newsletter,
            'isAdmin' => (bool) $this->admin,
            'passwordSetAt' => $this->password_set_at,
            'lastActive' => $this->last_active,
        ];
    }
}
