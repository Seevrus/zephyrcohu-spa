<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

describe('Confirm Email Request', function () {
    beforeEach(function () {
        $this->okRequest = [
            'email' => 'user004@example.com',
            'code' => 'some-random-code',
        ];
    });

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

describe('Confirm Email Controller', function () {
    beforeEach(function () {
        $this->okRequest = [
            'email' => 'user004@example.com',
            'code' => 'some-random-code',
        ];

        resetConfirmEmailTestData();
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
            'ip_address' => null,
            'last_active' => null,
        ]);

        $this->assertDatabaseEmpty('users_new');

        $response->assertStatus(200)->assertJson([
            'data' => [
                'id' => 4,
                'email' => 'user004@example.com',
                'isAdmin' => false,
                'confirmed' => true,
                'newsletter' => false,
            ],
        ]);

        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/',
            $response['data']['passwordSetAt']
        );
    });
});

function resetConfirmEmailTestData(): void {
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
            'email_code' => 'another-random-code',
        ]
    );
}
