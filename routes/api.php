<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::controller(UserController::class)->prefix('users')->group(function () {
    Route::prefix('profile')->group(function () {
        Route::post('/request_new_password', 'requestNewPassword');
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
