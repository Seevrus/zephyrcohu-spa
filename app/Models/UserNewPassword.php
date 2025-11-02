<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNewPassword extends Model {
    public $incrementing = false;

    protected $primaryKey = 'user_id';

    protected $table = 'users_new_passwords';

    public $timestamps = false;

    protected $fillable = [
        'issued_at', 'password_code', 'user_id',
    ];

    protected function casts(): array {
        return [
            'issued_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }
}
