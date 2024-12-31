<?php

namespace App;

use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Cookie\CookieValuePrefix;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Support\Facades\Crypt;

trait CanValidateCsrf {
    public function isCsrfValid(): bool {
        try {
            $requestToken = request()->header('X-XSRF-TOKEN');
            $requestToken = Crypt::decrypt($requestToken, static::serialized());
            $requestToken = CookieValuePrefix::remove($requestToken);

            $sessionToken = request()->session()->token();

            return is_string($requestToken) &&
                is_string($sessionToken) &&
                hash_equals($sessionToken, $requestToken);
        } catch (DecryptException $e) {
            return false;
        }
    }

    public function csrfErrorResponse(): Response {
        return Response::denyWithStatus(401, ErrorCode::INVALID_CSRF->value);
    }

    private static function serialized(): bool {
        return EncryptCookies::serialized('XSRF-TOKEN');
    }
}
