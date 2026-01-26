<?php

use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

describe('Reset Password Request', function () {
    beforeEach(function () {
        $this->okRequest = [
            'email' => 'user003@example.com',
            'password' => 'abc123456',
            'code' => 'some-random-code',
        ];
    });

    test('checks for required fields', function () {
        $response = $this->postJson('/api/users/profile/reset_password', []);
        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.required (and 2 more errors)',
            'errors' => [
                'email' => ['validation.required'],
                'password' => ['validation.required'],
                'code' => ['validation.required'],
            ],
        ]);
    });

    test('email should be well-formed', function () {
        $request = [...$this->okRequest, 'email' => 'hello-there'];
        $response = $this->postJson('/api/users/profile/reset_password', $request);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.email',
            'errors' => [
                'email' => ['validation.email'],
            ],
        ]);
    });

    test('password should be well-formed', function () {
        $request = [...$this->okRequest, 'password' => 'no'];
        $response = $this->postJson('/api/users/profile/reset_password', $request);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.regex',
            'errors' => [
                'password' => ['validation.regex'],
            ],
        ]);
    });
});

describe('Reset Password Controller', function () {
    beforeEach(function () {
        $this->okRequest = [
            'email' => 'user003@example.com',
            'password' => 'abc123456',
            'code' => 'some-random-code',
        ];

        resetResetPasswordTestData();
    });

    test('fails if the user is not found', function () {
        $request = [...$this->okRequest, 'email' => 'user-not@example.com'];
        $response = $this->postJson('/api/users/profile/reset_password', $request);

        $this->assertDatabaseCount('users_new_passwords', 2);

        $response->assertStatus(400)->assertExactJson([
            'status' => 400,
            'code' => 'BAD_CREDENTIALS',
        ]);
    });

    test('fails if the user does not have a code', function () {
        $request = [...$this->okRequest, 'email' => 'user001@example.com'];
        $response = $this->postJson('/api/users/profile/reset_password', $request);

        $this->assertDatabaseCount('users_new_passwords', 2);

        $response->assertStatus(400)->assertExactJson([
            'status' => 400,
            'code' => 'BAD_CREDENTIALS',
        ]);
    });

    test('fails if the code does not match and deletes the code', function () {
        $request = [...$this->okRequest, 'code' => 'bad_code'];
        $response = $this->postJson('/api/users/profile/reset_password', $request);

        $this->assertDatabaseCount('users_new_passwords', 1);

        $response->assertStatus(400)->assertExactJson([
            'status' => 400,
            'code' => 'BAD_CREDENTIALS',
        ]);
    });

    test('fails if the code is too old', function () {
        $request = [...$this->okRequest, 'email' => 'user002@example.com'];
        $response = $this->postJson('/api/users/profile/reset_password', $request);

        $this->assertDatabaseCount('users_new_passwords', 2);

        $response->assertStatus(410)->assertExactJson([
            'status' => 410,
            'code' => 'CODE_EXPIRED',
        ]);
    });

    test('resets the password and logs in the user', function () {
        Hash::expects('check')->andReturn(true)->twice();
        Hash::expects('make')->with('abc123456')->andReturn('hashed');
        Hash::expects('needsRehash')->andReturn(false);

        $response = $this->withHeaders(['Origin' => 'http://127.0.0.1:4200'])
            ->postJson('/api/users/profile/reset_password', $this->okRequest);

        $this->assertDatabaseMissing('users_new_passwords', [
            'user_id' => 3,
        ]);

        $this->assertDatabaseHas('users', [
            'id' => 3,
            'password' => 'hashed',
        ]);

        $response->assertStatus(200)->assertJson(['data' => [
            'confirmed' => true,
            'email' => 'user003@example.com',
            'id' => 3,
            'isAdmin' => false,
            'newsletter' => false,
        ]]);
    });
});

function resetResetPasswordTestData(): void {
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
            'confirmed' => 1,
            'newsletter' => 0,
        ],
    ]);

    DB::table('users_new_passwords')->insert([
        [
            'user_id' => 2,
            'password_code' => Hash::make('some-random-code'),
            'issued_at' => Carbon::now()->subHours(2),
        ],
        [
            'user_id' => 3,
            'password_code' => Hash::make('some-random-code'),
            'issued_at' => Carbon::now(),
        ],
    ]);
}
