<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOfferRequest;
use App\Http\Requests\UpdateOfferRequest;
use App\Http\Resources\AdminOfferResource;
use App\Models\Offer;
use Throwable;

class AdminOfferController extends Controller {
    public function getOffers() {
        try {
            $offers = Offer::orderBy('published_at', 'desc')->get();

            return AdminOfferResource::collection($offers);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function getOfferItem(Offer $offer) {
        try {
            return new AdminOfferResource($offer);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function storeOffer(StoreOfferRequest $request) {
        try {
            $offer = Offer::create([
                'audience' => $request->validated('audience'),
                'title' => $request->validated('title'),
                'main_content' => $request->validated('mainContent'),
                'additional_content' => $request->validated('additionalContent'),
                'published_at' => $request->validated('publishedAt'),
            ]);

            return (new AdminOfferResource($offer))->response()->setStatusCode(201);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function updateOffer(UpdateOfferRequest $request, Offer $offer) {
        try {
            $offer->update([
                'audience' => $request->validated('audience'),
                'title' => $request->validated('title'),
                'main_content' => $request->validated('mainContent'),
                'additional_content' => $request->validated('additionalContent'),
                'published_at' => $request->validated('publishedAt'),
            ]);

            return new AdminOfferResource($offer);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function deleteOffer(Offer $offer) {
        try {
            $offer->delete();

            return response(null, 204);
        } catch (Throwable $e) {
            abort(500);
        }
    }
}
