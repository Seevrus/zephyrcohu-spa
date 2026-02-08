<?php

namespace App\Http\Controllers;

use App\Http\Resources\NewsCollection;
use App\Models\News;
use App\Models\UserNews;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class NewsController extends Controller {
    public function get_news(Request $request) {
        $user = $request->user();

        $news = News::where('expires_at', '>', Carbon::now())
            ->orWhereNull('expires_at')
            ->when(! $user, function (Builder $query) {
                $query->where('audience', 'P');
            })
            ->when($user, function (Builder $query) use ($user) {
                $query->addSelect(['is_read' => UserNews::select('user_id')->whereColumn('news_id', 'news.id')->where('user_id', $user?->id)]);
            })
            ->orderBy('updated_at', 'desc')
            ->paginate(10);

        $total = News::where('expires_at', '>', Carbon::now())
            ->orWhereNull('expires_at')
            ->count();

        return new NewsCollection($news, $total);
    }
}
