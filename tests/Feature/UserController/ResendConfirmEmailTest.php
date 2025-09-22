<?php

use App\Mail\UserRegistered;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

describe('Resend Confirm Email Request', function () {
    test('checks for required fields', function () {
        $response = $this->postJson('/api/users/register/resend_confirm_email', []);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.required',
            'errors' => [
                'email' => ['validation.required'],
            ],
        ]);
    });

    test('email should be well-formed', function () {
        $request = ['email' => 'hello-there'];
        $response = $this->postJson('/api/users/register/resend_confirm_email', $request);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.email',
            'errors' => [
                'email' => ['validation.email'],
            ],
        ]);
    });
});

describe('Resend Confirm Email Controller', function () {
    beforeEach(function () {
        $this->okRequest = [
            'email' => 'user002@example.com',
        ];

        resetResendConfirmEmailTestData();
    });

    test('should fail if the user is not found', function () {
        $request = ['email' => 'user003@example.com'];
        $response = $this->postJson('/api/users/register/resend_confirm_email', $request);

        $response->assertStatus(404)->assertExactJson([
            'status' => 404,
            'code' => 'EMAIL_NOT_FOUND',
        ]);
    });

    test('should fail if the user is already confirmed', function () {
        $request = ['email' => 'user001@example.com'];
        $response = $this->postJson('/api/users/register/resend_confirm_email', $request);

        $response->assertStatus(410)->assertExactJson([
            'status' => 410,
            'code' => 'USER_ALREADY_CONFIRMED',
        ]);
    });

    test('should confirm the user email', function () {
        Mail::fake();

        $response = $this->postJson('/api/users/register/resend_confirm_email', $this->okRequest);

        $response->assertNoContent(200);

        Mail::assertSent(UserRegistered::class, function ($mail) {
            return $mail->hasTo('user002@example.com');
        });
    });
});

function resetResendConfirmEmailTestData(): void {
    DB::table('users')->delete();
    DB::statement('ALTER TABLE users AUTO_INCREMENT = 1');

    DB::table('users')->insert([
        [
            'id' => 1,
            'email' => 'user001@example.com',
            'password' => Hash::make('password'),
            'confirmed' => 1,
            'newsletter' => 0,
            'cookies' => 1,
        ],
        [
            'id' => 2,
            'email' => 'user002@example.com',
            'password' => Hash::make('password'),
            'confirmed' => 0,
            'newsletter' => 0,
            'cookies' => 1,
        ],
    ]);

    DB::table('users_new')->insert(
        [
            'user_id' => 2,
            'email_code' => 123456789,
        ]
    );
}
