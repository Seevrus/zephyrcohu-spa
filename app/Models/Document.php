<?php

namespace App\Models;

use App\DocumentCategory;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Document extends Model {
    protected $fillable = [
        'category', 'display_name', 'version', 'path', 'published_at',
    ];

    protected function casts(): array {
        return [
            'published_at' => 'datetime',
            'category' => DocumentCategory::class,
        ];
    }

    public function disk(): string {
        return $this->category === DocumentCategory::IntegraUpdate ? 'local' : 'public';
    }

    public function isPublished(): bool {
        return $this->published_at->isPast();
    }

    #[Scope]
    protected function published(Builder $query): Builder {
        return $query->where('published_at', '<=', now());
    }
}
