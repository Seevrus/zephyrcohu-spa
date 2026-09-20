<?php

describe('CSP headers', function () {
    test('the SPA shell has no Laravel CSP header, since the built Angular shell carries its own autoCsp meta policy', function () {
        $response = $this->get('/');

        $response->assertStatus(200);
        expect($response->headers->has('Content-Security-Policy'))->toBeFalse();
    });

    test('api responses still carry the Laravel CSP header', function () {
        $response = $this->getJson('/api/news');

        expect($response->headers->has('Content-Security-Policy'))->toBeTrue();
    });
});
