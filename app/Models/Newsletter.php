<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Newsletter extends Model {
    protected $fillable = [
        'subject', 'content',
    ];

    public function recipients(): BelongsToMany {
        return $this
            ->belongsToMany(User::class, 'users_newsletters', 'newsletter_id', 'user_id')
            ->using(UserNewsletter::class);
    }
}
