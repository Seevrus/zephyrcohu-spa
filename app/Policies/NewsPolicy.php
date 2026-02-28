<?php

namespace App\Policies;

use App\ErrorCode;
use App\Models\News;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class NewsPolicy {
    public function getNewsItem(?User $sender, ?News $news = null): Response {
        if (! $news) {
            return Response::denyWithStatus(404, ErrorCode::GENERIC_NOT_FOUND->value);
        }

        if (! $sender && $news->audience === 'A') {
            return Response::denyWithStatus(401, ErrorCode::GENERIC_UNAUTHORIZED->value);
        }

        return Response::allow();
    }
}
