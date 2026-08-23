<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminNewsResource extends JsonResource {
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
            'publishedAt' => $this->published_at,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];

        if ($this->relationLoaded('readers')) {
            $emails = $this->readers->pluck('email')->sort()->values();

            $news['readerCount'] = $emails->count();
            $news['readers'] = $emails;
        }

        return $news;
    }
}
