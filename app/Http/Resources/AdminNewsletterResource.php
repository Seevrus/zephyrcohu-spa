<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminNewsletterResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array {
        $newsletter = [
            'id' => $this->id,
            'subject' => $this->subject,
            'createdAt' => $this->created_at,
            'recipientCount' => $this->recipient_count,
            'sentCount' => $this->sent_count,
            'isSentToEveryone' => $this->sent_count >= $this->recipient_count,
        ];

        if (isset($this->content)) {
            $newsletter['content'] = $this->content;
        }

        return $newsletter;
    }
}
