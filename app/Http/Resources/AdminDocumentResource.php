<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminDocumentResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'category' => $this->category,
            'displayName' => $this->display_name,
            'version' => $this->version,
            'fileName' => basename($this->path),
            'publishedAt' => $this->published_at,
        ];
    }
}
