<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class UserNewsletter extends Pivot {
    protected $table = 'users_newsletters';
}
