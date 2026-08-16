<?php

namespace App\Http\Controllers;

use App\ErrorCode;
use App\Http\Resources\ErrorResource;
use App\Http\Resources\OfferCollection;
use App\Http\Resources\OfferResource;
use App\Models\Offer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Throwable;

class OfferController extends Controller {
    public function getOffers(Request $request) {
        try {
            $user = $request->user();

            $offers = Offer::published()
                ->when(! $user, function ($query) {
                    $query->where('audience', 'P');
                })
                ->orderBy('updated_at', 'desc')
                ->paginate(10);

            $total = Offer::published()->count();

            return new OfferCollection($offers, $total);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function getOfferItem(Request $request, string $id) {
        $user = $request->user();

        $offerItem = Offer::where('id', $id)
            ->published()
            ->first();

        $canGet = Gate::inspect('getOfferItem', $offerItem ?? Offer::class);

        if ($canGet->denied()) {
            return response(
                new ErrorResource($canGet->status(), ErrorCode::from($canGet->message())),
                $canGet->status()
            );
        }

        return new OfferResource($offerItem);
    }
}
