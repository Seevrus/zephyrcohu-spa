<?php

use App\Mail\EmailUpdateRequested;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

describe('Update Profile Request', function () {
    beforeEach(function () {
        $this->okRequest = ['newsletter' => true];

        resetUpdateProfileTestData();
    });

    test('newsletter should be a boolean', function () {
        $request = [...$this->okRequest, 'newsletter' => 'yes'];
        $user = User::find(1);
        $response = $this->actingAs($user)->postJson('/api/users/profile/update', $request);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.boolean',
            'errors' => [
                'newsletter' => ['validation.boolean'],
            ],
        ]);
    });

    test('email should be well-formed', function () {
        $request = [...$this->okRequest, 'email' => 'hello-there'];
        $user = User::find(1);
        $response = $this->actingAs($user)->postJson('/api/users/profile/update', $request);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.email',
            'errors' => [
                'email' => ['validation.email'],
            ],
        ]);
    });

    test('password should be well-formed', function (string $password) {
        $request = [...$this->okRequest, 'password' => $password];
        $user = User::find(1);
        $response = $this->actingAs($user)->postJson('/api/users/profile/update', $request);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.regex',
            'errors' => [
                'password' => ['validation.regex'],
            ],
        ]);
    })->with(['abc', 'abc1234', 'abc1234!!!']);
});

describe('Update Profile Controller', function () {
    beforeEach(function () {
        $this->okRequest = [
            'newsletter' => true,
        ];

        resetUpdateProfileTestData();

        $this->user = User::find(1);
    });

    test('should fail if user is not authenticated', function () {
        $response = $this->postJson('/api/users/profile/update', $this->okRequest);
        $response->assertStatus(401);
    });

    test('should request email update', function () {
        Mail::fake();
        Str::createRandomStringsUsing(fn () => 'fake-random-string');

        $user = User::find(1);
        $request = ['email' => 'newemail@example.com'];
        $response = $this->actingAs($user)->postJson('/api/users/profile/update', $request);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users_new_emails', [
            'user_id' => 1,
            'new_email' => 'newemail@example.com',
        ]);

        Mail::assertSent(EmailUpdateRequested::class, function ($mail) {
            return $mail->hasTo('newemail@example.com');
        });
    });

    test('should update the user profile newsletter', function () {
        $response = $this->actingAs($this->user)->postJson('/api/users/profile/update', $this->okRequest);

        $response->assertStatus(200)->assertJson([
            'data' => [
                'id' => 1,
                'email' => 'user001@example.com',
                'newsletter' => true,
            ],
        ]);

        $this->assertDatabaseHas('users', [
            'id' => 1,
            'newsletter' => 1,
        ]);
    });

    test('should update the user profile with newsletter false', function () {
        $user2 = User::find(2);

        $request = ['newsletter' => false];
        $response = $this->actingAs($user2)->postJson('/api/users/profile/update', $request);

        $response->assertStatus(200)->assertJson([
            'data' => [
                'id' => 2,
                'newsletter' => false,
            ],
        ]);

        $this->assertDatabaseHas('users', [
            'id' => 2,
            'newsletter' => 0,
        ]);
    });

    test('should update the user password', function () {
        Carbon::setTestNowAndTimezone('2026-01-03 21:00:00', 'Europe/Budapest');

        $request = ['password' => 'newPassword123'];
        $response = $this->actingAs($this->user)->postJson('/api/users/profile/update', $request);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => 1,
            'password_set_at' => '2026-01-03 21:00:00',
        ]);
    });
});

function resetUpdateProfileTestData(): void {
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
            'newsletter' => 1,
        ],
    ]);
}
