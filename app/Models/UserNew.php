<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNew extends Model {
    protected $fillable = ['email_code', 'user_id'];

    public $incrementing = false;

    protected $primaryKey = 'user_id';

    protected $table = 'users_new';

    public $timestamps = false;

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }
}
