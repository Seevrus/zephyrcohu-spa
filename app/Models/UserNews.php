<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class UserNews extends Pivot {
    protected $table = 'users_news';
}
