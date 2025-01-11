<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::controller(UserController::class)->prefix('users')->group(function () {
    Route::prefix('register')->group(function () {
        Route::post('/', 'registerUser');
        Route::post('/confirm_email', 'confirmEmail');
        Route::post('/revoke', 'revokeRegistration');
    });

    Route::post('/login', 'login');
    Route::post('/logout', 'logout')->middleware('auth:sanctum');
    Route::get('/session', 'session')->middleware('auth:sanctum');
});
