<?php

namespace App\Http\Controllers;

use Config;
use Illuminate\Http\Request;
use Illuminate\Support\InteractsWithTime;
use Symfony\Component\HttpFoundation\Cookie;

class TokenController extends Controller {
    use InteractsWithTime;

    public function csrf(Request $request) {
        $token = $request->session()->token();

        $cookie = new Cookie(
            name: 'XSRF-TOKEN',
            value: $token,
            expire: $this->availableAt(Config::get('session.lifetime') * 60),
            secure: true,
            httpOnly: false,
            sameSite: Cookie::SAMESITE_STRICT,
        );

        return response()->withCookie($cookie);
    }
}
