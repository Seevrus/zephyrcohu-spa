<?php

use App\Mail\ForgottenPassword;

describe('Request new password request', function () {
    test('checks for required fields', function () {
        $response = $this->postJson('/api/users/profile/request_new_password', []);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.required',
            'errors' => [
                'email' => ['validation.required'],
            ],
        ]);
    });

    test('email should be well-formed', function () {
        $request = ['email' => 'hello-there'];
        $response = $this->postJson('/api/users/profile/request_new_password', $request);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.email',
            'errors' => [
                'email' => ['validation.email'],
            ],
        ]);
    });
});

describe('Request new password controller', function () {
    beforeEach(function () {
        resetRequestNewPasswordTestData();
    });

    test("should fail if the user doesn't exist", function () {
        $response = $this->postJson('/api/users/profile/request_new_password', ['email' => 'user_not_existing@example.com']);

        $this->assertDatabaseCount('users_new_passwords', 1);

        $response->assertStatus(404)->assertExactJson([
            'status' => 404,
            'code' => 'EMAIL_NOT_FOUND',
        ]);
    });

    test('should fail for security reasons if the user is an admin', function () {
        $response = $this->postJson('/api/users/profile/request_new_password', ['email' => 'user004@example.com']);

        $this->assertDatabaseCount('users_new_passwords', 1);

        $response->assertStatus(400)->assertExactJson([
            'status' => 400,
            'code' => 'OPERATION_NOT_ALLOWED',
        ]);
    });

    test('inserts new password code for regular users', function () {
        Mail::fake();
        $response = $this->postJson('/api/users/profile/request_new_password', ['email' => 'user001@example.com']);

        $this->assertDatabaseCount('users_new_passwords', 2);
        $this->assertDatabaseHas('users_new_passwords', [
            'user_id' => 1,
        ]);

        $response->assertStatus(201);
    });

    test('inserts new password code for regular new users', function () {
        Mail::fake();
        $response = $this->postJson('/api/users/profile/request_new_password', ['email' => 'user002@example.com']);

        $this->assertDatabaseCount('users_new_passwords', 2);
        $this->assertDatabaseHas('users_new_passwords', [
            'user_id' => 2,
        ]);

        $response->assertStatus(201);
    });

    test('updates password code if already exists', function () {
        Mail::fake();
        $response = $this->postJson('/api/users/profile/request_new_password', ['email' => 'user003@example.com']);

        $this->assertDatabaseCount('users_new_passwords', 1);

        $response->assertStatus(201);
    });

    test('sends a password recovery email', function () {
        Mail::fake();
        $this->postJson('/api/users/profile/request_new_password', ['email' => 'user001@example.com']);

        Mail::assertSent(ForgottenPassword::class, function ($mail) {
            return $mail->hasTo('user001@example.com');
        });
    });
});

function resetRequestNewPasswordTestData(): void {
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
        [
            'id' => 3,
            'email' => 'user003@example.com',
            'password' => Hash::make('password'),
            'confirmed' => 1,
            'newsletter' => 1,
            'cookies' => 1,
        ],
        [
            'id' => 4,
            'email' => 'user004@example.com',
            'password' => Hash::make('password'),
            'confirmed' => 1,
            'newsletter' => 1,
            'cookies' => 1,
        ],
    ]);

    DB::table('user_admins')->insert(
        [
            'user_id' => 4,
        ]
    );

    DB::table('users_new')->insert(
        [
            'user_id' => 2,
            'email_code' => 123456789,
        ]
    );

    DB::table('users_new_passwords')->insert(
        [
            'user_id' => 3,
            'password_code' => 123456789,
        ]
    );
}
