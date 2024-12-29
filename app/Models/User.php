<?php

namespace App\Models;

use Config;
use Firebase\JWT\JWT;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Model {
    public function admin(): HasOne {
        return $this->hasOne(UserAdmin::class);
    }

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

    public static function issueJwt(array $payload): string {
        $key = Config::get('app.zephyr_key');

        return JWT::encode($payload, $key, 'HS512');
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

    public $timestamps = false;
}
