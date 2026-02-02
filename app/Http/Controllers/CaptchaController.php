<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckRecaptchaTokenRequest;
use Illuminate\Support\Facades\Http;
use Throwable;

class CaptchaController extends Controller {
    public function check_recaptcha_token(CheckRecaptchaTokenRequest $request) {
        try {
            $token = $request->token;

            $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => config('services.reCaptcha.secretKey'),
                'response' => $token,
                'remoteip' => $request->ip(),
            ]);

            $result = $response->json();

            if (isset($result['success']) && $result['success']) {
                return response()->json($result);
            } else {
                abort(500);
            }
        } catch (Throwable $e) {
            abort(500);
        }
    }
}
