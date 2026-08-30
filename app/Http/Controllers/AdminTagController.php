<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateTagRequest;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use Throwable;

class AdminTagController extends Controller {
    public function getTags() {
        try {
            $tags = Tag::withCount('knowledgebase')->orderBy('tag_name')->get();

            return TagResource::collection($tags);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function updateTag(UpdateTagRequest $request, Tag $tag) {
        try {
            $tag->update([
                'tag_name' => $request->validated('name'),
            ]);

            $tag->loadCount('knowledgebase');

            return new TagResource($tag);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function deleteTag(Tag $tag) {
        try {
            $tag->delete();

            return response(null, 204);
        } catch (Throwable $e) {
            abort(500);
        }
    }
}
