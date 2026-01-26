<?php

use App\Models\User;

describe('Logout', function () {
    beforeEach(function () {
        resetLogoutTestData();

        $this->user = User::find(1);
    });

    test('returns with 401 if the user is not logged in', function () {
        $response = $this->postJson('/api/users/logout');

        $response->assertStatus(401)->assertExactJson([
            'code' => 'GENERIC_UNAUTHORIZED',
            'message' => 'The client must authenticate itself to get the requested response.',
            'status' => 401,
        ]);
    });

    test('returns with 400 if the request does not come from the UI', function () {
        $response = $this->actingAs($this->user)->postJson('/api/users/logout');

        $response->assertStatus(400)->assertExactJson([
            'code' => 'Bad Request',
            'message' => 'The server cannot or will not process the request due to something that is perceived to be a client error.',
            'status' => 400,
        ]);
    });

    test('logs out the user', function () {
        $response = $this
            ->actingAs($this->user)
            ->withHeaders(['Origin' => 'http://127.0.0.1:4200'])
            ->postJson('/api/users/logout');

        $response->assertStatus(200);
    });

    test('regenerates the session', function () {

        $response = $this
            ->actingAs($this->user)
            ->withHeaders(['Origin' => 'http://127.0.0.1:4200'])
            ->withSession(['foo' => 'bar'])
            ->postJson('/api/users/logout');

        $response->assertSessionMissing('foo');
    });
})->group('Logout');

function resetLogoutTestData(): void {
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
    ]);
}
