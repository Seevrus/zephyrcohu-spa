<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Model {
    public function admin(): HasOne {
        return $this->hasOne(UserAdmin::class);
    }

    public function newEmail(): HasOne {
        return $this->hasOne(UserNewEmail::class);
    }

    public function newPassword(): HasOne {
        return $this->hasOne(UserNewPassword::class);
    }

    public function newUser(): HasOne {
        return $this->hasOne(UserNew::class);
    }

    public function passwords(): HasMany {
        return $this->hasMany(UserPassword::class);
    }
}
