<?php

namespace App\Http\Middleware;

use Closure;
use Config;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ZephyrJwtMiddleware {
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response {
        JWT::$leeway = 60;
        $jwt = $request->cookie('zephyrcohu_auth') ?? $request->bearerToken();

        if (! $jwt) {
            return $next($request);
        }

        $key = Config::get('app.zephyr_key');
        $user_token = JWT::decode($jwt, new Key($key, 'HS512'));

        $request->merge(['user_jwt' => (array) $user_token]);

        return $next($request);
    }
}
