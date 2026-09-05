<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

describe('Delete Link', function () {
    beforeEach(function () {
        resetDeleteLinkTestData();
    });

    test('deletes the link but leaves its category untouched', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/links/1');

        $response->assertStatus(204)->assertNoContent();

        $this->assertDatabaseMissing('links', ['id' => 1]);
        $this->assertDatabaseHas('link_categories', ['id' => 1]);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/links/999');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->deleteJson('/api/admin/links/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->deleteJson('/api/admin/links/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetDeleteLinkTestData(): void {
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

    DB::table('link_categories')->insert([
        'id' => 1,
        'category_name' => 'Community',
    ]);

    DB::table('links')->insert([
        'id' => 1,
        'title' => 'Stack Overflow',
        'link_category_id' => 1,
        'url' => 'https://stackoverflow.com',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}
