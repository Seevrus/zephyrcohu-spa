<?php

use App\Mail\UserRegistered;
use Illuminate\Support\Facades\DB;

describe('Create User', function () {
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
            $response = $this->postJson('/api/users/create', []);
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
            $response = $this->postJson('/api/users/create', $request);

            $response->assertStatus(422)->assertExactJson([
                'message' => 'validation.email',
                'errors' => [
                    'email' => ['validation.email'],
                ],
            ]);
        });

        test('password should be well-formed', function (string $password) {
            $request = [...$this->okRequest, 'password' => $password];
            $response = $this->postJson('/api/users/create', $request);

            $response->assertStatus(422)->assertExactJson([
                'message' => 'validation.regex',
                'errors' => [
                    'password' => ['validation.regex'],
                ],
            ]);
        })->with(['abc', 'abc1234', 'abc1234!!!']);

        test('cookies should be a boolean', function () {
            $request = [...$this->okRequest, 'cookiesAccepted' => 'yes'];
            $response = $this->postJson('/api/users/create', $request);

            $response->assertStatus(422)->assertExactJson([
                'message' => 'validation.boolean',
                'errors' => [
                    'cookiesAccepted' => ['validation.boolean'],
                ],
            ]);
        });

        test('cookies should be accepted', function () {
            $request = [...$this->okRequest, 'cookiesAccepted' => false];
            $response = $this->postJson('/api/users/create', $request);

            $response->assertStatus(422)->assertExactJson([
                'message' => 'validation.accepted',
                'errors' => [
                    'cookiesAccepted' => ['validation.accepted'],
                ],
            ]);
        });

        test('newsletter should be a boolean', function () {
            $request = [...$this->okRequest, 'newsletter' => 'yes'];
            $response = $this->postJson('/api/users/create', $request);

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
            $response = $this->postJson('/api/users/create', $request);

            $this->assertDatabaseCount('users', 3);

            $response->assertStatus(409)->assertExactJson([
                'status' => 409,
                'code' => 'USER_EXISTS',
            ]);
        });

        test('should fail for existing user with a new email', function () {
            $request = [...$this->okRequest, 'email' => 'user002_new_email@example.com'];
            $response = $this->postJson('/api/users/create', $request);

            $this->assertDatabaseCount('users', 3);

            $response->assertStatus(409)->assertExactJson([
                'status' => 409,
                'code' => 'USER_EXISTS',
            ]);
        });

        test('should fail if the user exists, but email is not confirmed', function () {
            $request = [...$this->okRequest, 'email' => 'user003@example.com'];
            $response = $this->postJson('/api/users/create', $request);

            $this->assertDatabaseCount('users', 3);

            $response->assertStatus(409)->assertExactJson([
                'status' => 409,
                'code' => 'USER_NOT_CONFIRMED',
            ]);
        });

        test('Creates the new user', function () {
            Mail::fake();

            $request = [...$this->okRequest, 'email' => 'user004@example.com'];
            $response = $this->postJson('/api/users/create', $request);

            $this->assertDatabaseHas('users', [
                'email' => 'user004@example.com',
                'confirmed' => 0,
                'newsletter' => 0,
                'cookies' => 1,
                'ip_address' => null,
                'last_active' => null,
            ]);

            $newUser = DB::table('users_new')->where('user_id', '=', 4)->firstOrFail();
            $this->assertMatchesRegularExpression('/^\d{9}$/', $newUser->email_code);

            $this->assertDatabaseHas('user_passwords', ['user_id' => 4, 'is_generated' => 0]);

            Mail::assertQueued(UserRegistered::class, function ($mail) {
                return $mail->hasTo('user004@example.com');
            });

            $response->assertStatus(201)->assertExactJson([
                'data' => [
                    'id' => 4,
                    'email' => 'user004@example.com',
                    'confirmed' => false,
                    'newsletter' => false,
                    'cookiesAccepted' => true,
                ],
            ]);
        });
    });
});

function resetTables(): void {
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
    ]);

    DB::table('users_new_emails')->insert(
        [
            'user_id' => 2,
            'new_email' => 'user002_new_email@example.com',
            'email_code' => 1234567892,
        ]
    );
}
