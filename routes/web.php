<?php

use App\Http\Controllers\FrontendController;
use Illuminate\Support\Facades\Route;

Route::any('/{any}', [FrontendController::class, 'index'])->where('any', '^(?!api).*$');
