<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Laravel\Sanctum\HasApiTokens;

class User extends Model {
    use HasApiTokens;

    public function admin(): HasOne {
        return $this->hasOne(UserAdmin::class);
    }

    protected $attributes = [
        'confirmed' => 0,
        'cookies' => 0,
        'ip_address' => null,
        'last_Active' => null,
        'newsletter' => 0,
    ];

    protected function casts(): array {
        return [
            'confirmed' => 'boolean',
            'cookies' => 'boolean',
            'last_active' => 'datetime',
            'newsletter' => 'boolean',
        ];
    }

    protected $fillable = [
        'cookies', 'email', 'newsletter', 'password',
    ];

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

    public $timestamps = false;
}
