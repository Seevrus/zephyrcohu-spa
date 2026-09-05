<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLinkRequest;
use App\Http\Requests\UpdateLinkRequest;
use App\Http\Resources\AdminLinkResource;
use App\Models\Link;
use App\Models\LinkCategory;
use Throwable;

class AdminLinkController extends Controller {
    public function getLinks() {
        try {
            $links = Link::query()
                ->leftJoin('link_categories', 'link_categories.id', '=', 'links.link_category_id')
                ->orderByRaw('COALESCE(link_categories.category_name, ?)', [Link::UNCATEGORISED_NAME])
                ->orderBy('links.title')
                ->select('links.*')
                ->with('category')
                ->get();

            return AdminLinkResource::collection($links);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function getLink(Link $link) {
        try {
            $link->load('category');

            return new AdminLinkResource($link);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function storeLink(StoreLinkRequest $request) {
        try {
            $link = Link::create([
                'title' => $request->validated('title'),
                'url' => $request->validated('url'),
                'link_category_id' => $this->resolveCategoryId($request->validated('categoryName')),
            ]);

            $link->load('category');

            return (new AdminLinkResource($link))->response()->setStatusCode(201);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function updateLink(UpdateLinkRequest $request, Link $link) {
        try {
            $link->update([
                'title' => $request->validated('title'),
                'url' => $request->validated('url'),
                'link_category_id' => $this->resolveCategoryId($request->validated('categoryName')),
            ]);

            $link->load('category');

            return new AdminLinkResource($link);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function deleteLink(Link $link) {
        try {
            $link->delete();

            return response(null, 204);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    private function resolveCategoryId(?string $categoryName): ?int {
        $categoryName = $categoryName !== null ? trim($categoryName) : null;

        if ($categoryName === null || $categoryName === '') {
            return null;
        }

        return LinkCategory::firstOrCreate(['category_name' => $categoryName])->id;
    }
}
