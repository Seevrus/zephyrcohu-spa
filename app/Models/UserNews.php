<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class UserNews extends Pivot {
    protected function casts(): array {
        return [
            'read_at' => 'datetime',
        ];
    }

    protected $table = 'users_news';
}
