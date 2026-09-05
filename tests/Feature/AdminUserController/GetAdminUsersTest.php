<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Get Admin Users', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetGetAdminUsersTestData();
    });

    test('lists every user ordered by email with their flags', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(200)->assertExactJson(['data' => [
            [
                'id' => 2,
                'email' => 'admin001@example.com',
                'confirmed' => true,
                'newsletter' => false,
                'isAdmin' => true,
                'passwordSetAt' => '2026-02-08T20:39:00.000000Z',
                'lastActive' => '2026-02-08T20:39:00.000000Z',
            ],
            [
                'id' => 1,
                'email' => 'user001@example.com',
                'confirmed' => true,
                'newsletter' => true,
                'isAdmin' => false,
                'passwordSetAt' => '2026-02-01T09:00:00.000000Z',
                'lastActive' => null,
            ],
        ]]);
    });

    test('does not run an extra query per user to determine admin status', function () {
        Sanctum::actingAs(User::find(2));

        $adminTableQueries = 0;
        DB::listen(function ($query) use (&$adminTableQueries) {
            if (str_contains($query->sql, 'user_admins')) {
                $adminTableQueries++;
            }
        });

        $this->getJson('/api/admin/users');

        // one query for the admin guard's own check plus one eager-loaded query for
        // the resource's `admin` relation — never one per returned user.
        expect($adminTableQueries)->toBeLessThanOrEqual(2);
    });

    test('returns 404 for a guest', function () {
        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetGetAdminUsersTestData(): void {
    DB::table('users')->insert([
        [
            'id' => 1,
            'email' => 'user001@example.com',
            'password' => Hash::make('abc123456'),
            'password_set_at' => '2026-02-01 10:00:00',
            'confirmed' => 1,
            'newsletter' => 1,
            'ip_address' => null,
            'last_active' => null,
        ],
        [
            'id' => 2,
            'email' => 'admin001@example.com',
            'password' => Hash::make('abc123456'),
            'password_set_at' => '2026-02-08 21:39:00',
            'confirmed' => 1,
            'newsletter' => 0,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
    ]);

    DB::table('user_admins')->insert([
        'user_id' => 2,
    ]);
}
