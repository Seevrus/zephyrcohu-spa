<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminKnowledgebaseResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array {
        $knowledgebase = [
            'id' => $this->id,
            'audience' => $this->audience,
            'title' => $this->title,
            'mainContent' => $this->main_content,
            'additionalContent' => $this->additional_content,
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'publishedAt' => $this->published_at,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];

        if ($this->relationLoaded('readers')) {
            $emails = $this->readers->pluck('email')->sort()->values();

            $knowledgebase['readerCount'] = $emails->count();
            $knowledgebase['readers'] = $emails;
        }

        return $knowledgebase;
    }
}
