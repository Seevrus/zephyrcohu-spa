<?php

namespace App\Http\Controllers;

use App\ErrorCode;
use App\Http\Requests\GetKnowledgebaseRequest;
use App\Http\Resources\ErrorResource;
use App\Http\Resources\KnowledgebaseCollection;
use App\Http\Resources\KnowledgebaseResource;
use App\Models\Knowledgebase;
use App\Models\UserKnowledgebase;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Throwable;

class KnowledgebaseController extends Controller {
    public function getKnowledgebase(GetKnowledgebaseRequest $request) {
        try {
            $user = $request->user();
            $tag = $request->validated('tag');

            $knowledgebase = Knowledgebase::published()
                ->when(! $user, function (Builder $query) {
                    $query->where('audience', 'P');
                })
                ->when($user, function (Builder $query) use ($user) {
                    $query->addSelect(['is_read' => UserKnowledgebase::select('user_id')->whereColumn('knowledgebase_id', 'knowledgebase.id')->where('user_id', $user->id)]);
                })
                ->when($tag, function (Builder $query) use ($tag) {
                    $query->whereHas('tags', function (Builder $query) use ($tag) {
                        $query->where('tags.id', $tag);
                    });
                })
                ->with('tags')
                ->orderBy('updated_at', 'desc')
                ->paginate(10);

            $total = Knowledgebase::published()
                ->when($tag, function (Builder $query) use ($tag) {
                    $query->whereHas('tags', function (Builder $query) use ($tag) {
                        $query->where('tags.id', $tag);
                    });
                })
                ->count();

            return new KnowledgebaseCollection($knowledgebase, $total);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function getKnowledgebaseItem(Request $request, string $id) {
        $user = $request->user();

        $knowledgebaseItem = Knowledgebase::where('id', $id)
            ->published()
            ->when($user, function (Builder $query) use ($user) {
                $query->addSelect(['is_read' => UserKnowledgebase::select('user_id')->whereColumn('knowledgebase_id', 'knowledgebase.id')->where('user_id', $user->id)]);
            })
            ->with('tags')
            ->first();

        $canGet = Gate::inspect('getKnowledgebaseItem', $knowledgebaseItem ?? Knowledgebase::class);

        if ($canGet->denied()) {
            return response(
                new ErrorResource($canGet->status(), ErrorCode::from($canGet->message())),
                $canGet->status()
            );
        }

        return new KnowledgebaseResource($knowledgebaseItem);
    }

    public function markKnowledgebaseItemAsRead(Request $request, string $id) {
        try {
            $user = $request->user();
            $knowledgebaseItem = Knowledgebase::where('id', $id)->published()->first();

            $canMark = Gate::inspect('markKnowledgebaseItemAsRead', [Knowledgebase::class, $knowledgebaseItem]);

            if ($canMark->denied()) {
                return response(
                    new ErrorResource($canMark->status(), ErrorCode::from($canMark->message())),
                    $canMark->status()
                );
            }

            UserKnowledgebase::query()->insertOrIgnore([
                'user_id' => $user->id,
                'knowledgebase_id' => $knowledgebaseItem->id,
                'read_at' => Carbon::now(),
            ]);

            return response(null, 204);
        } catch (Throwable $e) {
            abort(500);
        }
    }
}
