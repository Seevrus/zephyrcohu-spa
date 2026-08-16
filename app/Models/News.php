<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class News extends Model {
    protected $fillable = [
        'audience', 'title', 'main_content', 'additional_content', 'published_at',
    ];

    public function readers(): BelongsToMany {
        return $this
            ->belongsToMany(User::class, 'users_news', 'news_id', 'user_id')
            ->using(UserNews::class);
    }

    public function isPublished(): bool {
        return $this->published_at->isPast();
    }

    #[Scope]
    protected function published(Builder $query): Builder {
        return $query->where('published_at', '<=', now());
    }

    protected function casts(): array {
        return [
            'published_at' => 'datetime',
        ];
    }

    protected $table = 'news';
}
