<?php

namespace App\Http\Controllers;

use App\Http\Resources\LinkResource;
use App\Models\Link;
use Throwable;

class LinkController extends Controller {
    public function getLinks() {
        try {
            $links = Link::query()
                ->join('link_categories', 'link_categories.id', '=', 'links.link_category_id')
                ->orderBy('link_categories.category_name')
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
