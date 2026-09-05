<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

describe('Update Link Category', function () {
    beforeEach(function () {
        resetUpdateLinkCategoryTestData();
    });

    test('renames the category', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/link_categories/1', [
            'name' => 'Renamed',
        ]);

        $response->assertStatus(200)->assertExactJson(['data' => [
            'id' => 1,
            'name' => 'Renamed',
            'linkCount' => 1,
        ]]);

        $this->assertDatabaseHas('link_categories', [
            'id' => 1,
            'category_name' => 'Renamed',
        ]);
    });

    test('renaming a category to its own name succeeds', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/link_categories/1', [
            'name' => 'Documentation',
        ]);

        $response->assertStatus(200)->assertJson(['data' => [
            'id' => 1,
            'name' => 'Documentation',
        ]]);
    });

    test('rejects a name already used by another category', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/link_categories/1', [
            'name' => 'Community',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['name']);
    });

    test('rejects renaming to "Egyéb"', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/link_categories/1', [
            'name' => 'Egyéb',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['name']);
    });

    test('rejects a missing name', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/link_categories/1', []);

        $response->assertStatus(422)->assertJsonValidationErrors(['name']);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/link_categories/999', [
            'name' => 'Renamed',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->putJson('/api/admin/link_categories/1', [
            'name' => 'Renamed',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->putJson('/api/admin/link_categories/1', [
            'name' => 'Renamed',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetUpdateLinkCategoryTestData(): void {
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
        ['id' => 1, 'category_name' => 'Documentation'],
        ['id' => 2, 'category_name' => 'Community'],
    ]);

    DB::table('links')->insert([
        'id' => 1,
        'title' => 'Laravel Documentation',
        'link_category_id' => 1,
        'url' => 'https://laravel.com/docs',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}
