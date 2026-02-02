<?php

use Illuminate\Support\Facades\Http;

describe('check_recaptcha_token method', function () {
    test('request validation - token is present', function () {
        $response = $this->postJson('/api/captcha', []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    });

    test('reCAPTCHA API returns 500', function () {
        Http::fake([
            'www.google.com/recaptcha/api/siteverify' => Http::response([], 500),
        ]);

        $response = $this->postJson('/api/captcha', ['token' => 'test-token']);
        $response->assertStatus(500)
            ->assertJson([
                'status' => 500,
                'code' => 'INTERNAL_SERVER_ERROR',
                'message' => 'The server has encountered a situation it does not know how to handle.',
            ]);
    });

    test('reCAPTCHA API returns malformed response', function () {
        Http::fake([
            'www.google.com/recaptcha/api/siteverify' => Http::response('this is not json', 200),
        ]);

        $response = $this->postJson('/api/captcha', ['token' => 'test-token']);
        $response->assertStatus(500)
            ->assertJson([
                'status' => 500,
                'code' => 'INTERNAL_SERVER_ERROR',
                'message' => 'The server has encountered a situation it does not know how to handle.',
            ]);
    });

    test('reCAPTCHA API returns success: false', function () {
        $mockedResponse = [
            'success' => false,
            'score' => 0.1,
            'action' => 'submit',
            'challenge_ts' => '2026-02-02T12:00:00Z',
            'hostname' => 'localhost',
        ];

        Http::fake([
            'www.google.com/recaptcha/api/siteverify' => Http::response($mockedResponse, 200),
        ]);

        $response = $this->postJson('/api/captcha', ['token' => 'test-token']);
        $response->assertStatus(500)
            ->assertJson([
                'status' => 500,
                'code' => 'INTERNAL_SERVER_ERROR',
                'message' => 'The server has encountered a situation it does not know how to handle.',
            ]);
    });

    test('reCAPTCHA API returns success: true', function () {
        $mockedResponse = [
            'success' => true,
            'score' => 0.9,
            'action' => 'submit',
            'challenge_ts' => '2026-02-02T12:00:00Z',
            'hostname' => 'localhost',
        ];

        Http::fake([
            'www.google.com/recaptcha/api/siteverify' => Http::response($mockedResponse, 200),
        ]);

        $response = $this->postJson('/api/captcha', ['token' => 'test-token']);
        $response->assertStatus(200)
            ->assertJson($mockedResponse);
    });
});
