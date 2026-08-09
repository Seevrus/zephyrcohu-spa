<?php

namespace App\Policies;

use App\ErrorCode;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class OfferPolicy {
    public function getOfferItem(?User $sender, ?Offer $offer = null): Response {
        if (! $offer) {
            return Response::denyWithStatus(404, ErrorCode::GENERIC_NOT_FOUND->value);
        }

        if (! $sender && $offer->audience === 'A') {
            return Response::denyWithStatus(401, ErrorCode::GENERIC_UNAUTHORIZED->value);
        }

        return Response::allow();
    }
}
