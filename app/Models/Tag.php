<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model {
    protected $fillable = [
        'tag_name',
    ];

    public function knowledgebase(): BelongsToMany {
        return $this->belongsToMany(Knowledgebase::class, 'knowledgebase_tags');
    }

    protected $table = 'tags';

    public $timestamps = false;
}
