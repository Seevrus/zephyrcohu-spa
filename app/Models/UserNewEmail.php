<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNewEmail extends Model {
    public $incrementing = false;

    protected $primaryKey = 'user_id';

    protected $table = 'users_new_emails';

    public $timestamps = false;

    protected $fillable = [
        'user_id', 'new_email', 'email_code', 'issued_at',
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
