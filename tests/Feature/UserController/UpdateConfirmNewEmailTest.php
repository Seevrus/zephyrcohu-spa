<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

describe('Update Confirm New Email Request', function () {
    beforeEach(function () {
        $this->okRequest = [
            'email' => 'user002_new_email@example.com',
            'code' => 'some-random-code',
        ];
    });

    test('checks for required fields', function () {
        $response = $this->postJson('/api/users/profile/update/confirm_new_email', []);
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
        $response = $this->postJson('/api/users/profile/update/confirm_new_email', $request);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.email',
            'errors' => [
                'email' => ['validation.email'],
            ],
        ]);
    });
});

describe('Update Confirm New Email Controller', function () {
    beforeEach(function () {
        $this->okRequest = [
            'email' => 'user002_new_email@example.com',
            'code' => 'some-random-code',
        ];

        resetUpdateConfirmNewEmailTestData();
    });

    test('should fail if the user does not exist', function () {
        $request = [...$this->okRequest, 'email' => 'noone@example.com'];
        $response = $this->postJson('/api/users/profile/update/confirm_new_email', $request);

        $response->assertStatus(400)->assertExactJson([
            'status' => 400,
            'code' => 'BAD_CREDENTIALS',
        ]);
    });

    test('should fail if the code is incorrect', function () {
        $request = [...$this->okRequest, 'code' => 'wrong-code'];
        $response = $this->postJson('/api/users/profile/update/confirm_new_email', $request);

        $this->assertDatabaseMissing('users_new_emails', ['user_id' => 2]);

        $response->assertStatus(400)->assertExactJson([
            'status' => 400,
            'code' => 'BAD_CREDENTIALS',
        ]);
    });

    test('should update the email', function () {
        $response = $this->postJson('/api/users/profile/update/confirm_new_email', $this->okRequest);

        $response->assertStatus(200)->assertJson([
            'data' => [
                'id' => 2,
                'email' => 'user002_new_email@example.com',
            ],
        ]);

        $this->assertDatabaseHas('users', [
            'id' => 2,
            'email' => 'user002_new_email@example.com',
        ]);

        $this->assertDatabaseMissing('users_new_emails', [
            'user_id' => 2,
        ]);
    });

    test('should update the email and return the logged in user', function () {
        $user = User::find(2);
        $response = $this->actingAs($user)
            ->withHeaders(['Origin' => 'http://127.0.0.1:4200'])
            ->postJson('/api/users/profile/update/confirm_new_email', $this->okRequest);

        $response->assertStatus(200)->assertJson([
            'data' => [
                'id' => 2,
                'email' => 'user002_new_email@example.com',
            ],
        ]);

        $this->assertDatabaseHas('users', [
            'id' => 2,
            'email' => 'user002_new_email@example.com',
        ]);

        $this->assertDatabaseMissing('users_new_emails', [
            'user_id' => 2,
        ]);
    });
});

function resetUpdateConfirmNewEmailTestData(): void {
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
    ]);

    DB::table('users_new_emails')->insert([
        [
            'user_id' => 2,
            'new_email' => 'user002_new_email@example.com',
            'email_code' => Hash::make('some-random-code'),
        ],
    ]);
}
