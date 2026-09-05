<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Link extends Model {
    public const UNCATEGORISED_NAME = 'Egyéb';

    protected $fillable = [
        'title', 'link_category_id', 'url',
    ];

    public function category(): BelongsTo {
        return $this->belongsTo(LinkCategory::class, 'link_category_id');
    }
}
