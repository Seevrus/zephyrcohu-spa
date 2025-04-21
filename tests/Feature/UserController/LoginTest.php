<?php

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

describe('Login Request', function () {
    beforeEach(function () {
        $this->okRequest = [
            'email' => 'user006@example.com',
            'password' => 'abc123456',
        ];
    });

    test('checks for required fields', function () {
        $response = $this->postJson('/api/users/login', []);
        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.required (and 1 more error)',
            'errors' => [
                'email' => ['validation.required'],
                'password' => ['validation.required'],
            ],
        ]);
    });

    test('email should be well-formed', function () {
        $request = [...$this->okRequest, 'email' => 'hello-there'];
        $response = $this->postJson('/api/users/login', $request);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.email',
            'errors' => [
                'email' => ['validation.email'],
            ],
        ]);
    });

    test('password should be well-formed', function () {
        $request = [...$this->okRequest, 'password' => 'no'];
        $response = $this->postJson('/api/users/login', $request);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.regex',
            'errors' => [
                'password' => ['validation.regex'],
            ],
        ]);
    });
});

describe('Login Controller', function () {
    beforeEach(function () {
        $this->okRequest = [
            'email' => 'user006@example.com',
            'password' => 'abc123456',
        ];

        resetLoginTestData();
    });

    test('old login attempts are deleted', function () {
        $this->postJson('/api/users/login', $this->okRequest);

        $this->assertDatabaseCount('users_login_attempts', 2);
        $this->assertDatabaseHas('users_login_attempts', [
            'user_id' => 1,
            'attempts' => 1,
        ]);

        $this->assertDatabaseHas('users_login_attempts', [
            'user_id' => 2,
            'attempts' => 4,
        ]);
    });

    test('returns with 401 is the user does not exist', function () {
        $request = [...$this->okRequest, 'email' => 'noone@example.com'];
        $response = $this->postJson('/api/users/login', $request);

        $response->assertStatus(401)->assertExactJson([
            'status' => 401,
            'code' => 'BAD_CREDENTIALS',
        ]);
    });

    test('returns with 403 is the user email has not been confirmed', function () {
        $request = [...$this->okRequest, 'email' => 'user004@example.com'];
        $response = $this->postJson('/api/users/login', $request);

        $response->assertStatus(403)->assertExactJson([
            'status' => 403,
            'code' => 'USER_NOT_CONFIRMED',
        ]);
    });

    test('locks out the user if they have too many login attempts', function () {
        $request = [...$this->okRequest, 'email' => 'user002@example.com'];
        $response = $this->postJson('/api/users/login', $request);

        $response->assertStatus(429)->assertExactJson([
            'status' => 429,
            'code' => 'TOO_MANY_LOGIN_ATTEMPTS',
        ]);
    });

    test('locks out the user if they attempt login too many times', function () {
        $request = ['email' => 'user005@example.com', 'password' => 'xyz98765'];
        $this->postJson('/api/users/login', $request);
        $this->postJson('/api/users/login', $request);
        $this->postJson('/api/users/login', $request);
        $response = $this->postJson('/api/users/login', $request);

        $response->assertStatus(429)->assertExactJson([
            'status' => 429,
            'code' => 'TOO_MANY_LOGIN_ATTEMPTS',
        ]);
    });

    test('returns with 401 is the password is not correct', function () {
        $request = ['email' => 'user005@example.com', 'password' => 'xyz98765'];
        $response = $this->postJson('/api/users/login', $request);

        $response->assertStatus(401)->assertExactJson([
            'status' => 401,
            'code' => 'BAD_CREDENTIALS',
        ]);
    });

    test('returns with 423 is the user is already logged in from another device', function () {
        $response = $this->withServerVariables(['REMOTE_ADDR' => '1.2.3.4'])
            ->postJson('/api/users/login', $this->okRequest);

        $response->assertStatus(423)->assertExactJson([
            'status' => 423,
            'code' => 'USER_ALREADY_LOGGED_IN',
        ]);
    });

    test('returns with 400 if the request does not come from the UI', function () {
        $response = $this->withHeaders(['Origin' => 'https://google.com'])
            ->postJson('/api/users/login', $this->okRequest);

        $response->assertStatus(400)->assertExactJson([
            'code' => 'Bad Request',
            'message' => 'The server cannot or will not process the request due to something that is perceived to be a client error.',
            'status' => 400,
        ]);
    });

    test('logs in the user', function () {
        $response = $this->withHeaders(['Origin' => 'http://127.0.0.1:4200'])
            ->postJson('/api/users/login', $this->okRequest);

        $response->assertStatus(200)->assertJson([
            'data' => [
                'id' => 6,
                'email' => 'user006@example.com',
                'isAdmin' => false,
                'confirmed' => true,
                'cookiesAccepted' => true,
                'newsletter' => true,
            ],
        ]);

        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/',
            $response['data']['passwordSetAt']
        );
    });
});

function resetLoginTestData(): void {
    DB::table('users')->delete();
    DB::statement('ALTER TABLE users AUTO_INCREMENT = 1');

    DB::table('users')->insert([
        [
            'id' => 1,
            'email' => 'user001@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 0,
            'cookies' => 1,
            'ip_address' => null,
            'last_active' => null,
        ],
        [
            'id' => 2,
            'email' => 'user002@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 1,
            'cookies' => 1,
            'ip_address' => null,
            'last_active' => null,
        ],
        [
            'id' => 3,
            'email' => 'user003@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 0,
            'cookies' => 0,
            'ip_address' => null,
            'last_active' => null,
        ],
        [
            'id' => 4,
            'email' => 'user004@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 0,
            'newsletter' => 0,
            'cookies' => 1,
            'ip_address' => null,
            'last_active' => null,
        ],
        [
            'id' => 5,
            'email' => 'user005@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 1,
            'cookies' => 1,
            'ip_address' => null,
            'last_active' => null,
        ],
        [
            'id' => 6,
            'email' => 'user006@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 1,
            'cookies' => 1,
            'ip_address' => '127.0.0.1',
            'last_active' => Carbon::now(),
        ],
    ]);

    DB::table('users_login_attempts')->insert([
        [
            'user_id' => 1,
            'attempts' => 1,
            'last_attempt' => Carbon::now(),
        ],
        [
            'user_id' => 2,
            'attempts' => 4,
            'last_attempt' => Carbon::now(),
        ],
        [
            'user_id' => 3,
            'attempts' => 4,
            'last_attempt' => Carbon::now()->subHours(2),
        ],
    ]);
}
