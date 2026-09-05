<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateLinkCategoryRequest;
use App\Http\Resources\AdminLinkCategoryResource;
use App\Models\LinkCategory;
use Throwable;

class AdminLinkCategoryController extends Controller {
    public function getLinkCategories() {
        try {
            $categories = LinkCategory::withCount('links')->orderBy('category_name')->get();

            return AdminLinkCategoryResource::collection($categories);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function updateLinkCategory(UpdateLinkCategoryRequest $request, LinkCategory $linkCategory) {
        try {
            $linkCategory->update([
                'category_name' => $request->validated('name'),
            ]);

            $linkCategory->loadCount('links');

            return new AdminLinkCategoryResource($linkCategory);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function deleteLinkCategory(LinkCategory $linkCategory) {
        try {
            $linkCategory->delete();

            return response(null, 204);
        } catch (Throwable $e) {
            abort(500);
        }
    }
}
