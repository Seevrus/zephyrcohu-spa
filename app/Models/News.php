<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class News extends Model {
    protected $fillable = [
        'audience', 'title', 'main_content', 'additional_content', 'expires_at',
    ];

    public function readers(): BelongsToMany {
        return $this
            ->belongsToMany(User::class, 'users_news', 'news_id', 'user_id')
            ->using(UserNews::class);
    }

    protected $table = 'news';
}
