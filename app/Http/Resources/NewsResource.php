<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array {
        $news = [
            'id' => $this->id,
            'audience' => $this->audience,
            'title' => $this->title,
            'mainContent' => $this->main_content,
            'additionalContent' => $this->additional_content,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];

        $attributes = $this->resource->getAttributes();

        if (array_key_exists('is_read', $attributes)) {
            $news['isRead'] = (bool) $this->is_read;
        }

        return $news;
    }
}
