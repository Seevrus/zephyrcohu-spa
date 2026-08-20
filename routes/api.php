<?php

use App\Http\Controllers\CaptchaController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\KnowledgebaseController;
use App\Http\Controllers\LinkController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::controller(CaptchaController::class)->prefix('captcha')->group(function () {
    Route::post('/', 'check_recaptcha_token');
});

Route::controller(DocumentController::class)->prefix('documents/integra')->group(function () {
    Route::get('/{category}', 'getDocuments');
    Route::get('/{document}/download', 'downloadDocument');
});

Route::controller(KnowledgebaseController::class)->prefix('knowledgebase')->group(function () {
    Route::controller(LinkController::class)->prefix('links')->group(function () {
        Route::get('/', 'getLinks');
    });

    Route::get('/', 'getKnowledgebase');
    Route::get('/tags', 'getKnowledgebaseTags');
    Route::get('/{id}', 'getKnowledgebaseItem');
    Route::post('/{id}/read', 'markKnowledgebaseItemAsRead')->middleware('auth:sanctum');
});

Route::controller(NewsController::class)->prefix('news')->group(function () {
    Route::get('/', 'getNews');
    Route::get('/{id}', 'getNewsItem');
    Route::post('/{id}/read', 'markNewsItemAsRead')->middleware('auth:sanctum');
});

Route::controller(OfferController::class)->prefix('offers')->group(function () {
    Route::get('/', 'getOffers');
    Route::get('/{id}', 'getOfferItem');
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
