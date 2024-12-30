<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPassword extends Model {
    protected $fillable = [
        'is_generated', 'password',  'user_id',
    ];

    public $timestamps = false;

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }
}
