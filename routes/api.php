<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::controller(UserController::class)->prefix('users')->group(function () {
    Route::post('/create', 'create_user');
});
