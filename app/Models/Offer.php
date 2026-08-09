<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Offer extends Model {
    protected $fillable = [
        'audience', 'title', 'main_content', 'additional_content', 'expires_at',
    ];

    protected function casts(): array {
        return [
            'expires_at' => 'datetime',
        ];
    }
}
