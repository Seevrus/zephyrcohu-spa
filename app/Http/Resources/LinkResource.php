<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LinkResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'url' => $this->url,
            'category' => $this->whenLoaded('category', fn () => $this->category->category_name),
        ];
    }
}
