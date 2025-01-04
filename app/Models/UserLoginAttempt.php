<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserLoginAttempt extends Model {
    protected function casts(): array {
        return [
            'last_attempt' => 'datetime',
        ];
    }

    protected $fillable = [
        'attempts', 'last_attempt', 'user_id',
    ];

    public $incrementing = false;

    protected $primaryKey = 'user_id';

    protected $table = 'users_login_attempts';

    public $timestamps = false;

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }
}
