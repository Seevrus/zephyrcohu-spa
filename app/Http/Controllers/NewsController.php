<?php

namespace App\Http\Controllers;

use App\ErrorCode;
use App\Http\Resources\ErrorResource;
use App\Http\Resources\NewsCollection;
use App\Http\Resources\NewsResource;
use App\Models\News;
use App\Models\UserNews;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Throwable;

class NewsController extends Controller {
    public function getNews(Request $request) {
        try {
            $user = $request->user();

            $news = News::where(function ($query) {
                $query->where('expires_at', '>', Carbon::now())
                    ->orWhereNull('expires_at');
            })
                ->when(! $user, function (Builder $query) {
                    $query->where('audience', 'P');
                })
                ->when($user, function (Builder $query) use ($user) {
                    $query->addSelect(['is_read' => UserNews::select('user_id')->whereColumn('news_id', 'news.id')->where('user_id', $user->id)]);
                })
                ->orderBy('updated_at', 'desc')
                ->paginate(10);

            $total = News::where(function ($query) {
                $query->where('expires_at', '>', Carbon::now())
                    ->orWhereNull('expires_at');
            })
                ->count();

            return new NewsCollection($news, $total);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function getNewsItem(Request $request, string $id) {
        $user = $request->user();

        $newsItem = News::where('id', $id)
            ->where(function ($query) {
                $query->where('expires_at', '>', Carbon::now())->orWhereNull('expires_at');
            })
            ->when($user, function (Builder $query) use ($user) {
                $query->addSelect(['is_read' => UserNews::select('user_id')->whereColumn('news_id', 'news.id')->where('user_id', $user->id)]);
            })->first();

        $canGet = Gate::inspect('getNewsItem', $newsItem ?? News::class);

        if ($canGet->denied()) {
            return response(
                new ErrorResource($canGet->status(), ErrorCode::from($canGet->message())),
                $canGet->status()
            );
        }

        return new NewsResource($newsItem);
    }
}
