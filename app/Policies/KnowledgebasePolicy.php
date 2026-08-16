<?php

namespace App\Policies;

use App\ErrorCode;
use App\Models\Knowledgebase;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class KnowledgebasePolicy {
    public function getKnowledgebaseItem(?User $sender, ?Knowledgebase $knowledgebase = null): Response {
        if (! $knowledgebase) {
            return Response::denyWithStatus(404, ErrorCode::GENERIC_NOT_FOUND->value);
        }

        if (! $sender && $knowledgebase->audience === 'A') {
            return Response::denyWithStatus(401, ErrorCode::GENERIC_UNAUTHORIZED->value);
        }

        return Response::allow();
    }

    public function markKnowledgebaseItemAsRead(User $sender, ?Knowledgebase $knowledgebase = null): Response {
        if (! $knowledgebase) {
            return Response::denyWithStatus(404, ErrorCode::GENERIC_NOT_FOUND->value);
        }

        return Response::allow();
    }
}
