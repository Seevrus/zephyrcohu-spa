<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPassword extends Model {
    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }
}