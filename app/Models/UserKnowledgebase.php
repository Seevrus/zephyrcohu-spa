<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class UserKnowledgebase extends Pivot {
    protected function casts(): array {
        return [
            'read_at' => 'datetime',
        ];
    }

    protected $table = 'users_knowledgebase';
}
