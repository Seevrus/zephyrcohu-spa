<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreKnowledgebaseRequest;
use App\Http\Requests\UpdateKnowledgebaseRequest;
use App\Http\Resources\AdminKnowledgebaseResource;
use App\Models\Knowledgebase;
use App\Models\Tag;
use Illuminate\Support\Facades\DB;
use Throwable;

class AdminKnowledgebaseController extends Controller {
    public function getKnowledgebase() {
        try {
            $knowledgebase = Knowledgebase::with(['tags', 'readers'])
                ->orderBy('published_at', 'desc')
                ->get();

            return AdminKnowledgebaseResource::collection($knowledgebase);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function getKnowledgebaseItem(Knowledgebase $knowledgebase) {
        try {
            $knowledgebase->load(['tags', 'readers']);

            return new AdminKnowledgebaseResource($knowledgebase);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function storeKnowledgebaseItem(StoreKnowledgebaseRequest $request) {
        try {
            $knowledgebase = DB::transaction(function () use ($request) {
                $knowledgebase = Knowledgebase::create([
                    'audience' => $request->validated('audience'),
                    'title' => $request->validated('title'),
                    'main_content' => $request->validated('mainContent'),
                    'additional_content' => $request->validated('additionalContent'),
                    'published_at' => $request->validated('publishedAt'),
                ]);

                $this->syncTags($knowledgebase, $request->validated('tags', []));

                return $knowledgebase;
            });

            $knowledgebase->load(['tags', 'readers']);

            return (new AdminKnowledgebaseResource($knowledgebase))->response()->setStatusCode(201);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function updateKnowledgebaseItem(UpdateKnowledgebaseRequest $request, Knowledgebase $knowledgebase) {
        try {
            DB::transaction(function () use ($request, $knowledgebase) {
                $knowledgebase->update([
                    'audience' => $request->validated('audience'),
                    'title' => $request->validated('title'),
                    'main_content' => $request->validated('mainContent'),
                    'additional_content' => $request->validated('additionalContent'),
                    'published_at' => $request->validated('publishedAt'),
                ]);

                $this->syncTags($knowledgebase, $request->validated('tags', []));
            });

            $knowledgebase->load(['tags', 'readers']);

            return new AdminKnowledgebaseResource($knowledgebase);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function deleteKnowledgebaseItem(Knowledgebase $knowledgebase) {
        try {
            $knowledgebase->delete();

            return response(null, 204);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    /**
     * @param  array<int, string>  $tagNames
     */
    private function syncTags(Knowledgebase $knowledgebase, array $tagNames): void {
        $tagIds = collect($tagNames)
            ->map(fn (string $name) => trim($name))
            ->filter()
            ->unique()
            ->map(fn (string $name) => Tag::firstOrCreate(['tag_name' => $name])->id);

        $knowledgebase->tags()->sync($tagIds);
    }
}
