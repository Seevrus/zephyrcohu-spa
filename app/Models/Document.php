<?php

namespace App\Models;

use App\DocumentCategory;
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
}
