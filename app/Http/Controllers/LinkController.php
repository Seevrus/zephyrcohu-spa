<?php

namespace App\Http\Controllers;

use App\Http\Resources\LinkResource;
use App\Models\Link;
use Throwable;

class LinkController extends Controller {
    public function getLinks() {
        try {
            $links = Link::query()
                ->leftJoin('link_categories', 'link_categories.id', '=', 'links.link_category_id')
                ->orderByRaw('COALESCE(link_categories.category_name, ?)', [Link::UNCATEGORISED_NAME])
                ->orderBy('links.title')
                ->select('links.*')
                ->with('category')
                ->get();

            return LinkResource::collection($links);
        } catch (Throwable $e) {
            abort(500);
        }
    }
}
