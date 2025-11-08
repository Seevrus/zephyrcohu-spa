<?php

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

describe('Session', function () {
    beforeEach(function () {
        resetSessionTestData();
    });

    test('returns with 401 if the user is not logged in', function () {
        $response = $this->getJson('/api/users/session');

        $response->assertStatus(401)->assertExactJson([
            'code' => 'GENERIC_UNAUTHORIZED',
            'message' => 'The client must authenticate itself to get the requested response.',
            'status' => 401,
        ]);
    });

    test('returns the data related to the current user', function () {
        Sanctum::actingAs(
            User::find(1),
        );

        $response = $this->getJson('/api/users/session');

        $response->assertStatus(200)->assertExactJson([
            'data' => [
                'confirmed' => true,
                'cookiesAccepted' => true,
                'email' => 'user001@example.com',
                'id' => 1,
                'isAdmin' => false,
                'newsletter' => false,
                'passwordSetAt' => '2025-01-11T06:31:09.000000Z',
            ],
        ]);
    });
});

function resetSessionTestData(): void {
    DB::table('users')->delete();
    DB::statement('ALTER TABLE users AUTO_INCREMENT = 1');

    DB::table('users')->insert([
        [
            'id' => 1,
            'email' => 'user001@example.com',
            'password' => Hash::make('password'),
            'password_set_at' => Carbon::createFromFormat('Y-m-d H:i:s', '2025-01-11 07:31:09'),
            'confirmed' => 1,
            'newsletter' => 0,
            'cookies' => 1,
        ],
    ]);
}
