<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNew extends Model {
    protected $table = 'users_new';

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }
}
