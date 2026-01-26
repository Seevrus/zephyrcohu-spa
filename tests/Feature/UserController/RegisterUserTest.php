<?php

use App\Mail\UserRegistered;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

describe('Register User Request', function () {
    beforeEach(function () {
        $this->okRequest = [
            'email' => 'test@example.com',
            'password' => '12345678',
            'newsletter' => false,
        ];
    });

    test('checks for required fields', function () {
        $response = $this->postJson('/api/users/register', []);
        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.required (and 2 more errors)',
            'errors' => [
                'email' => ['validation.required'],
                'password' => ['validation.required'],
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

describe('Register User Controller', function () {
    beforeEach(function () {
        $this->okRequest = [
            'email' => 'test@example.com',
            'password' => '12345678',
            'newsletter' => false,
        ];

        resetRegisterUserTestData();
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
        Str::createRandomStringsUsing(fn () => 'fake-random-string');

        $request = [...$this->okRequest, 'email' => 'user005@example.com'];
        $response = $this->postJson('/api/users/register', $request);

        $this->assertDatabaseHas('users', [
            'email' => 'user005@example.com',
            'confirmed' => 0,
            'newsletter' => 0,
            'ip_address' => null,
            'last_active' => null,
        ]);

        $this->assertDatabaseHas('users_new', [
            'user_id' => 5,
            'email_code' => 'fake-random-string',
        ]);

        Mail::assertSent(UserRegistered::class, function ($mail) {
            return $mail->hasTo('user005@example.com');
        });

        $response->assertStatus(201)->assertJson([
            'data' => [
                'id' => 5,
                'email' => 'user005@example.com',
                'isAdmin' => false,
                'confirmed' => false,
                'newsletter' => false,
            ],
        ]);

        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/',
            $response['data']['passwordSetAt']
        );
    });
});

function resetRegisterUserTestData(): void {
    DB::table('users')->delete();
    DB::statement('ALTER TABLE users AUTO_INCREMENT = 1');

    DB::table('users')->insert([
        [
            'id' => 1,
            'email' => 'user001@example.com',
            'password' => Hash::make('password'),
            'confirmed' => 1,
            'newsletter' => 0,
        ],
        [
            'id' => 2,
            'email' => 'user002@example.com',
            'password' => Hash::make('password'),
            'confirmed' => 1,
            'newsletter' => 0,
        ],
        [
            'id' => 3,
            'email' => 'user003@example.com',
            'password' => Hash::make('password'),
            'confirmed' => 0,
            'newsletter' => 1,
        ],
        [
            'id' => 4,
            'email' => 'user004@example.com',
            'password' => Hash::make('password'),
            'confirmed' => 0,
            'newsletter' => 0,
        ],
    ]);

    DB::table('users_new')->insert(
        [
            'user_id' => 4,
            'email_code' => 'some-random-code',
        ]
    );

    DB::table('users_new_emails')->insert(
        [
            'user_id' => 2,
            'new_email' => 'user002_new_email@example.com',
            'email_code' => 'some-random-code',
        ]
    );
}
