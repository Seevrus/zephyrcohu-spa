<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KnowledgebaseResource extends JsonResource {
    public function toArray(Request $request): array {
        $knowledgebase = [
            'id' => $this->id,
            'audience' => $this->audience,
            'title' => $this->title,
            'mainContent' => $this->main_content,
            'additionalContent' => $this->additional_content,
            'tags' => TagResource::collection($this->whenLoaded('tags', $this->tags, collect())),
            'publishedAt' => $this->published_at,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];

        $attributes = $this->resource->getAttributes();

        if (array_key_exists('is_read', $attributes)) {
            $knowledgebase['isRead'] = (bool) $this->is_read;
        }

        return $knowledgebase;
    }
}
