<?php

use App\Http\Controllers\AdminDocumentController;
use App\Http\Controllers\AdminKnowledgebaseController;
use App\Http\Controllers\AdminLinkCategoryController;
use App\Http\Controllers\AdminLinkController;
use App\Http\Controllers\AdminNewsController;
use App\Http\Controllers\AdminNewsletterController;
use App\Http\Controllers\AdminOfferController;
use App\Http\Controllers\AdminTagController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\CaptchaController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\KnowledgebaseController;
use App\Http\Controllers\LinkController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::controller(CaptchaController::class)->prefix('captcha')->group(function () {
    Route::post('/', 'check_recaptcha_token')->middleware('throttle:auth');
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
    Route::post('/request', 'requestOffer')->middleware('throttle:auth');
});

Route::controller(UserController::class)->prefix('users')->group(function () {
    Route::prefix('profile')->group(function () {
        Route::delete('/', 'deleteProfile')->middleware('auth:sanctum');
        Route::post('/request_new_password', 'requestNewPassword')->middleware('throttle:auth');
        Route::post('/reset_password', 'resetPassword')->middleware('throttle:auth');
        Route::post('/update', 'updateProfile')->middleware('auth:sanctum');
        Route::post('/update/confirm_new_email', 'updateConfirmNewEmail')->middleware('throttle:auth');
    });

    Route::prefix('register')->group(function () {
        Route::post('/', 'registerUser')->middleware('throttle:auth');
        Route::post('/confirm_email', 'confirmEmail')->middleware('throttle:auth');
        Route::post('/resend_confirm_email', 'resendConfirmEmail')->middleware('throttle:auth');
        Route::post('/revoke', 'revokeRegistration')->middleware('throttle:auth');
    });

    Route::post('/login', 'login')->middleware('throttle:auth');
    Route::post('/logout', 'logout')->middleware('auth:sanctum');
    Route::get('/session', 'session')->middleware('auth:sanctum');
});

Route::prefix('admin')->middleware('admin')->group(function () {
    Route::controller(AdminDocumentController::class)->prefix('documents')->group(function () {
        Route::get('/', 'getDocuments');
        Route::post('/', 'storeDocument');
        Route::get('/{document}', 'getDocument');
        Route::post('/{document}', 'updateDocument');
        Route::delete('/{document}', 'deleteDocument');
    });

    Route::controller(AdminKnowledgebaseController::class)->prefix('knowledgebase')->group(function () {
        Route::get('/', 'getKnowledgebase');
        Route::post('/', 'storeKnowledgebaseItem');
        Route::get('/{knowledgebase}', 'getKnowledgebaseItem');
        Route::put('/{knowledgebase}', 'updateKnowledgebaseItem');
        Route::delete('/{knowledgebase}', 'deleteKnowledgebaseItem');
    });

    Route::controller(AdminLinkController::class)->prefix('links')->group(function () {
        Route::get('/', 'getLinks');
        Route::post('/', 'storeLink');
        Route::get('/{link}', 'getLink');
        Route::put('/{link}', 'updateLink');
        Route::delete('/{link}', 'deleteLink');
    });

    Route::controller(AdminLinkCategoryController::class)->prefix('link_categories')->group(function () {
        Route::get('/', 'getLinkCategories');
        Route::put('/{linkCategory}', 'updateLinkCategory');
        Route::delete('/{linkCategory}', 'deleteLinkCategory');
    });

    Route::controller(AdminNewsController::class)->prefix('news')->group(function () {
        Route::get('/', 'getNews');
        Route::post('/', 'storeNews');
        Route::get('/{news}', 'getNewsItem');
        Route::put('/{news}', 'updateNews');
        Route::delete('/{news}', 'deleteNews');
    });

    Route::controller(AdminNewsletterController::class)->prefix('newsletters')->group(function () {
        Route::get('/', 'getNewsletters');
        Route::post('/', 'storeNewsletter');
        Route::get('/{newsletter}', 'getNewsletter');
        Route::get('/{newsletter}/recipients', 'getRecipients');
        Route::post('/{newsletter}/recipients/{user}', 'sendToRecipient')
            ->withoutMiddleware('throttle:api')
            ->middleware('throttle:newsletter');
    });

    Route::controller(AdminOfferController::class)->prefix('offers')->group(function () {
        Route::get('/', 'getOffers');
        Route::post('/', 'storeOffer');
        Route::get('/{offer}', 'getOfferItem');
        Route::put('/{offer}', 'updateOffer');
        Route::delete('/{offer}', 'deleteOffer');
    });

    Route::controller(AdminTagController::class)->prefix('tags')->group(function () {
        Route::get('/', 'getTags');
        Route::put('/{tag}', 'updateTag');
        Route::delete('/{tag}', 'deleteTag');
    });

    Route::controller(AdminUserController::class)->prefix('users')->group(function () {
        Route::get('/', 'getUsers');
        Route::put('/{user}', 'updateUser');
        Route::delete('/{user}', 'deleteUser');
        Route::post('/{user}/email', 'sendUserEmail');
    });
});
