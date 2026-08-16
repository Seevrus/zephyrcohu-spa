<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Offer extends Model {
    protected $fillable = [
        'audience', 'title', 'main_content', 'additional_content', 'published_at',
    ];

    protected function casts(): array {
        return [
            'published_at' => 'datetime',
        ];
    }

    public function isPublished(): bool {
        return $this->published_at->isPast();
    }

    #[Scope]
    protected function published(Builder $query): Builder {
        return $query->where('published_at', '<=', now());
    }
}
