<?php

use App\Http\Controllers\CaptchaController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::controller(CaptchaController::class)->prefix('captcha')->group(function () {
    Route::post('/', 'check_recaptcha_token');
});

Route::controller(UserController::class)->prefix('users')->group(function () {
    Route::prefix('profile')->group(function () {
        Route::delete('/', 'deleteProfile')->middleware('auth:sanctum');
        Route::post('/request_new_password', 'requestNewPassword');
        Route::post('/reset_password', 'resetPassword');
        Route::post('/update', 'updateProfile')->middleware('auth:sanctum');
        Route::post('/update/confirm_new_email', 'updateConfirmNewEmail');
    });

    Route::prefix('register')->group(function () {
        Route::post('/', 'registerUser');
        Route::post('/confirm_email', 'confirmEmail');
        Route::post('/resend_confirm_email', 'resendConfirmEmail');
        Route::post('/revoke', 'revokeRegistration');
    });

    Route::post('/login', 'login');
    Route::post('/logout', 'logout')->middleware('auth:sanctum');
    Route::get('/session', 'session')->middleware('auth:sanctum');
});
