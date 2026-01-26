<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable {
    use HasApiTokens;

    public function admin(): HasOne {
        return $this->hasOne(UserAdmin::class);
    }

    protected $attributes = [
        'confirmed' => 0,
        'ip_address' => null,
        'last_Active' => null,
        'newsletter' => 0,
    ];

    protected function casts(): array {
        return [
            'confirmed' => 'boolean',
            'last_active' => 'datetime',
            'newsletter' => 'boolean',
            'password_set_at' => 'datetime',
        ];
    }

    protected $fillable = [
        'email', 'newsletter', 'password', 'password_set_at',
    ];

    public function loginAttempts(): HasOne {
        return $this->hasOne(UserLoginAttempt::class);
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

    public $timestamps = false;
}
