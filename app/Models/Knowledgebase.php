<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Knowledgebase extends Model {
    protected $fillable = [
        'audience', 'title', 'main_content', 'additional_content', 'expires_at',
    ];

    public function readers(): BelongsToMany {
        return $this
            ->belongsToMany(User::class, 'users_knowledgebase', 'knowledgebase_id', 'user_id')
            ->using(UserKnowledgebase::class);
    }

    public function tags(): BelongsToMany {
        return $this->belongsToMany(Tag::class, 'knowledgebase_tags');
    }

    protected $table = 'knowledgebase';
}
