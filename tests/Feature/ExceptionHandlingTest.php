<?php

use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Route;

describe('the generic HttpException catch-all', function () {
    test('still formats a literal abort(500) with our custom body', function () {
        Route::get('/api/__test/abort-500', fn () => abort(500))->middleware('api');

        $response = $this->getJson('/api/__test/abort-500');

        $response->assertStatus(500);
        $response->assertJson([
            'status' => 500,
            'code' => 'INTERNAL_SERVER_ERROR',
        ]);
    });

    test('does not mask an HttpException subclass such as a CSRF token mismatch', function () {
        Route::get('/api/__test/token-mismatch', function () {
            throw new TokenMismatchException('CSRF token mismatch.');
        })->middleware('api');

        $response = $this->getJson('/api/__test/token-mismatch');

        $response->assertStatus(419);
        $response->assertJson(['message' => 'CSRF token mismatch.']);
    });
});
