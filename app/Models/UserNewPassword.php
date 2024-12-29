<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNewPassword extends Model {
    protected $table = 'users_new_passwords';

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }
}
