<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

describe('Admin Guard', function () {
    beforeEach(function () {
        resetAdminGuardTestData();
    });

    test('returns 404 for a guest', function () {
        $response = $this->getJson('/api/admin/ping');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->getJson('/api/admin/ping');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('lets an administrator through', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/ping');

        $response->assertStatus(200)->assertExactJson(['data' => 'ok']);
    });

    test('returns 405 for a wrong method on an admin route', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/ping');

        $response->assertStatus(405)->assertJson([
            'code' => 'GENERIC_METHOD_NOT_ALLOWED',
        ]);
    });
});

function resetAdminGuardTestData(): void {
    DB::table('users')->insert([
        [
            'id' => 1,
            'email' => 'user001@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 0,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
        [
            'id' => 2,
            'email' => 'admin001@example.com',
            'password' => Hash::make('abc123456'),
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
