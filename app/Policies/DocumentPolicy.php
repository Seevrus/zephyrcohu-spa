<?php

namespace App\Policies;

use App\DocumentCategory;
use App\ErrorCode;
use App\Models\Document;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class DocumentPolicy {
    public function viewCategory(?User $sender, DocumentCategory $category): Response {
        if (! $sender && $category === DocumentCategory::IntegraUpdate) {
            return Response::denyWithStatus(401, ErrorCode::GENERIC_UNAUTHORIZED->value);
        }

        return Response::allow();
    }

    public function download(?User $sender, Document $document): Response {
        if (! $document->isPublished()) {
            return Response::denyWithStatus(404, ErrorCode::GENERIC_NOT_FOUND->value);
        }

        if (! $sender && $document->category === DocumentCategory::IntegraUpdate) {
            return Response::denyWithStatus(401, ErrorCode::GENERIC_UNAUTHORIZED->value);
        }

        return Response::allow();
    }
}
