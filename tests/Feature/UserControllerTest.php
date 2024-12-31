<?php

use App\Mail\UserRegistered;
use Illuminate\Support\Facades\DB;

describe('User Controller', function () {
    describe('Confirm Email', function () {
        beforeEach(function () {
            $this->okRequest = [
                'email' => 'user004@example.com',
                'code' => 123456789,
            ];
        });

        describe('Request validation', function () {
            test('checks for required fields', function () {
                $response = $this->postJson('/api/users/register/confirm_email', []);
                $response->assertStatus(422)->assertExactJson([
                    'message' => 'validation.required (and 1 more error)',
                    'errors' => [
                        'email' => ['validation.required'],
                        'code' => ['validation.required'],
                    ],
                ]);
            });

            test('email should be well-formed', function () {
                $request = [...$this->okRequest, 'email' => 'hello-there'];
                $response = $this->postJson('/api/users/register/confirm_email', $request);

                $response->assertStatus(422)->assertExactJson([
                    'message' => 'validation.email',
                    'errors' => [
                        'email' => ['validation.email'],
                    ],
                ]);
            });
        });

        describe('Controller behavior', function () {
            beforeEach(function () {
                resetTables();
            });

            test('should fail if the user is not found', function () {
                $request = [...$this->okRequest, 'email' => 'user005@example.com'];
                $response = $this->postJson('/api/users/register/confirm_email', $request);

                $response->assertStatus(404)->assertExactJson([
                    'status' => 404,
                    'code' => 'BAD_EMAIL_CODE',
                ]);
            });

            test('should fail if the email code is incorrect', function () {
                $request = [...$this->okRequest, 'code' => 'awas'];
                $response = $this->postJson('/api/users/register/confirm_email', $request);

                $response->assertStatus(404)->assertExactJson([
                    'status' => 404,
                    'code' => 'BAD_EMAIL_CODE',
                ]);
            });

            test('should fail if the user is already confirmed', function () {
                $request = [...$this->okRequest, 'email' => 'user001@example.com'];
                $response = $this->postJson('/api/users/register/confirm_email', $request);

                $response->assertStatus(410)->assertExactJson([
                    'status' => 410,
                    'code' => 'USER_ALREADY_CONFIRMED',
                ]);
            });

            test('should confirm the user email', function () {
                $response = $this->postJson('/api/users/register/confirm_email', $this->okRequest);

                $this->assertDatabaseHas('users', [
                    'email' => 'user004@example.com',
                    'confirmed' => 1,
                    'newsletter' => 0,
                    'cookies' => 1,
                    'ip_address' => null,
                    'last_active' => null,
                ]);

                $this->assertDatabaseEmpty('users_new');

                $response->assertStatus(200)->assertExactJson([
                    'data' => [
                        'id' => 4,
                        'email' => 'user004@example.com',
                        'isAdmin' => false,
                        'confirmed' => true,
                        'cookiesAccepted' => true,
                        'newsletter' => false,
                    ],
                ]);
            });
        });
    });

    describe('Register User', function () {
        beforeEach(function () {
            $this->okRequest = [
                'email' => 'test@example.com',
                'password' => '12345678',
                'cookiesAccepted' => true,
                'newsletter' => false,
            ];
        });

        describe('Request validation', function () {
            test('checks for required fields', function () {
                $response = $this->postJson('/api/users/register', []);
                $response->assertStatus(422)->assertExactJson([
                    'message' => 'validation.required (and 3 more errors)',
                    'errors' => [
                        'email' => ['validation.required'],
                        'password' => ['validation.required'],
                        'cookiesAccepted' => ['validation.required'],
                        'newsletter' => ['validation.required'],
                    ],
                ]);
            });

            test('email should be well-formed', function () {
                $request = [...$this->okRequest, 'email' => 'hello-there'];
                $response = $this->postJson('/api/users/register', $request);

                $response->assertStatus(422)->assertExactJson([
                    'message' => 'validation.email',
                    'errors' => [
                        'email' => ['validation.email'],
                    ],
                ]);
            });

            test('password should be well-formed', function (string $password) {
                $request = [...$this->okRequest, 'password' => $password];
                $response = $this->postJson('/api/users/register', $request);

                $response->assertStatus(422)->assertExactJson([
                    'message' => 'validation.regex',
                    'errors' => [
                        'password' => ['validation.regex'],
                    ],
                ]);
            })->with(['abc', 'abc1234', 'abc1234!!!']);

            test('cookies should be a boolean', function () {
                $request = [...$this->okRequest, 'cookiesAccepted' => 'yes'];
                $response = $this->postJson('/api/users/register', $request);

                $response->assertStatus(422)->assertExactJson([
                    'message' => 'validation.boolean',
                    'errors' => [
                        'cookiesAccepted' => ['validation.boolean'],
                    ],
                ]);
            });

            test('cookies should be accepted', function () {
                $request = [...$this->okRequest, 'cookiesAccepted' => false];
                $response = $this->postJson('/api/users/register', $request);

                $response->assertStatus(422)->assertExactJson([
                    'message' => 'validation.accepted',
                    'errors' => [
                        'cookiesAccepted' => ['validation.accepted'],
                    ],
                ]);
            });

            test('newsletter should be a boolean', function () {
                $request = [...$this->okRequest, 'newsletter' => 'yes'];
                $response = $this->postJson('/api/users/register', $request);

                $response->assertStatus(422)->assertExactJson([
                    'message' => 'validation.boolean',
                    'errors' => [
                        'newsletter' => ['validation.boolean'],
                    ],
                ]);
            });
        });

        describe('Controller behavior', function () {
            beforeEach(function () {
                resetTables();
            });

            test('should fail for existing user', function () {
                $request = [...$this->okRequest, 'email' => 'user001@example.com'];
                $response = $this->postJson('/api/users/register', $request);

                $this->assertDatabaseCount('users', 4);

                $response->assertStatus(409)->assertExactJson([
                    'status' => 409,
                    'code' => 'USER_EXISTS',
                ]);
            });

            test('should fail for existing user with a new email', function () {
                $request = [...$this->okRequest, 'email' => 'user002_new_email@example.com'];
                $response = $this->postJson('/api/users/register', $request);

                $this->assertDatabaseCount('users', 4);

                $response->assertStatus(409)->assertExactJson([
                    'status' => 409,
                    'code' => 'USER_EXISTS',
                ]);
            });

            test('should fail if the user exists, but email is not confirmed', function () {
                $request = [...$this->okRequest, 'email' => 'user003@example.com'];
                $response = $this->postJson('/api/users/register', $request);

                $this->assertDatabaseCount('users', 4);

                $response->assertStatus(409)->assertExactJson([
                    'status' => 409,
                    'code' => 'USER_NOT_CONFIRMED',
                ]);
            });

            test('Creates the new user', function () {
                Mail::fake();

                $request = [...$this->okRequest, 'email' => 'user005@example.com'];
                $response = $this->postJson('/api/users/register', $request);

                $this->assertDatabaseHas('users', [
                    'email' => 'user005@example.com',
                    'confirmed' => 0,
                    'newsletter' => 0,
                    'cookies' => 1,
                    'ip_address' => null,
                    'last_active' => null,
                ]);

                $newUser = DB::table('users_new')->where('user_id', '=', 4)->firstOrFail();
                $this->assertMatchesRegularExpression('/^\d{9}$/', $newUser->email_code);

                $this->assertDatabaseHas('user_passwords', ['user_id' => 5, 'is_generated' => 0]);

                Mail::assertQueued(UserRegistered::class, function ($mail) {
                    return $mail->hasTo('user005@example.com');
                });

                $response->assertStatus(201)->assertExactJson([
                    'data' => [
                        'id' => 5,
                        'email' => 'user005@example.com',
                        'isAdmin' => false,
                        'confirmed' => false,
                        'cookiesAccepted' => true,
                        'newsletter' => false,
                    ],
                ]);
            });
        });
    });

    describe('Revoke Registration', function () {
        beforeEach(function () {
            $this->okRequest = [
                'email' => 'user004@example.com',
                'code' => 123456789,
            ];
        });

        describe('Request validation', function () {
            test('checks for required fields', function () {
                $response = $this->postJson('/api/users/register/revoke', []);
                $response->assertStatus(422)->assertExactJson([
                    'message' => 'validation.required (and 1 more error)',
                    'errors' => [
                        'email' => ['validation.required'],
                        'code' => ['validation.required'],
                    ],
                ]);
            });

            test('email should be well-formed', function () {
                $request = [...$this->okRequest, 'email' => 'hello-there'];
                $response = $this->postJson('/api/users/register/revoke', $request);

                $response->assertStatus(422)->assertExactJson([
                    'message' => 'validation.email',
                    'errors' => [
                        'email' => ['validation.email'],
                    ],
                ]);
            });
        });

        describe('Controller behavior', function () {
            beforeEach(function () {
                resetTables();
            });

            test('should fail if the user is not found', function () {
                $request = [...$this->okRequest, 'email' => 'user005@example.com'];
                $response = $this->postJson('/api/users/register/revoke', $request);

                $response->assertStatus(404)->assertExactJson([
                    'status' => 404,
                    'code' => 'BAD_EMAIL_CODE',
                ]);
            });

            test('should fail if the email code is incorrect', function () {
                $request = [...$this->okRequest, 'code' => 'awas'];
                $response = $this->postJson('/api/users/register/revoke', $request);

                $response->assertStatus(404)->assertExactJson([
                    'status' => 404,
                    'code' => 'BAD_EMAIL_CODE',
                ]);
            });

            test('should fail if the user is already confirmed', function () {
                $request = [...$this->okRequest, 'email' => 'user001@example.com'];
                $response = $this->postJson('/api/users/register/revoke', $request);

                $response->assertStatus(410)->assertExactJson([
                    'status' => 410,
                    'code' => 'USER_ALREADY_CONFIRMED',
                ]);
            });

            test('should revoke registration', function () {
                $response = $this->postJson('/api/users/register/revoke', $this->okRequest);

                $this->assertDatabaseMissing('users', [
                    'email' => 'user004@example.com',
                ]);

                $this->assertDatabaseEmpty('users_new');

                $response->assertNoContent(200);
            });
        });
    });
});

function resetTables(): void {
    DB::table('users')->delete();

    DB::table('users')->insert([
        [
            'id' => 1,
            'email' => 'user001@example.com',
            'confirmed' => 1,
            'newsletter' => 0,
            'cookies' => 1,
        ],
        [
            'id' => 2,
            'email' => 'user002@example.com',
            'confirmed' => 1,
            'newsletter' => 0,
            'cookies' => 1,
        ],
        [
            'id' => 3,
            'email' => 'user003@example.com',
            'confirmed' => 0,
            'newsletter' => 1,
            'cookies' => 1,
        ],
        [
            'id' => 4,
            'email' => 'user004@example.com',
            'confirmed' => 0,
            'newsletter' => 0,
            'cookies' => 1,
        ],
    ]);

    DB::table('users_new')->insert(
        [
            'user_id' => 4,
            'email_code' => 123456789,
        ]
    );

    DB::table('users_new_emails')->insert(
        [
            'user_id' => 2,
            'new_email' => 'user002_new_email@example.com',
            'email_code' => 1234567892,
        ]
    );
}
