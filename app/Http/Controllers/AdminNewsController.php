<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNewsRequest;
use App\Http\Requests\UpdateNewsRequest;
use App\Http\Resources\AdminNewsResource;
use App\Models\News;
use Throwable;

class AdminNewsController extends Controller {
    public function getNews() {
        try {
            $news = News::with('readers')
                ->orderBy('published_at', 'desc')
                ->get();

            return AdminNewsResource::collection($news);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function getNewsItem(News $news) {
        try {
            $news->load('readers');

            return new AdminNewsResource($news);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function storeNews(StoreNewsRequest $request) {
        try {
            $news = News::create([
                'audience' => $request->validated('audience'),
                'title' => $request->validated('title'),
                'main_content' => $request->validated('mainContent'),
                'additional_content' => $request->validated('additionalContent'),
                'published_at' => $request->validated('publishedAt'),
            ]);

            $news->load('readers');

            return (new AdminNewsResource($news))->response()->setStatusCode(201);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function updateNews(UpdateNewsRequest $request, News $news) {
        try {
            $news->update([
                'audience' => $request->validated('audience'),
                'title' => $request->validated('title'),
                'main_content' => $request->validated('mainContent'),
                'additional_content' => $request->validated('additionalContent'),
                'published_at' => $request->validated('publishedAt'),
            ]);

            $news->load('readers');

            return new AdminNewsResource($news);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function deleteNews(News $news) {
        try {
            $news->delete();

            return response(null, 204);
        } catch (Throwable $e) {
            abort(500);
        }
    }
}
