<?php

use App\Http\Controllers\TokenController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::controller(UserController::class)->prefix('users')->group(function () {
    Route::post('/confirm_email', 'confirm_email');
    Route::post('/create', 'create_user');
});

Route::controller(TokenController::class)->prefix('tokens')->group(function () {
    Route::get('/csrf', 'csrf');
});
