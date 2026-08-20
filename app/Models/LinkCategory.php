<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LinkCategory extends Model {
    protected $fillable = [
        'category_name',
    ];

    public function links(): HasMany {
        return $this->hasMany(Link::class, 'link_category_id');
    }

    protected $table = 'link_categories';

    public $timestamps = false;
}
