<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

describe('Update Link', function () {
    beforeEach(function () {
        resetUpdateLinkTestData();
    });

    test('moves a link to another existing category', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/links/1', [
            'title' => 'Stack Overflow',
            'url' => 'https://stackoverflow.com',
            'categoryName' => 'Documentation',
        ]);

        $response->assertStatus(200)->assertJson(['data' => [
            'id' => 1,
            'category' => ['id' => 2, 'name' => 'Documentation'],
        ]]);

        expect(DB::table('link_categories')->where('category_name', 'Documentation')->count())->toBe(1);
    });

    test('creates a new category when a brand-new name is given', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/links/1', [
            'title' => 'Stack Overflow',
            'url' => 'https://stackoverflow.com',
            'categoryName' => 'Reference',
        ]);

        $response->assertStatus(200)->assertJson(['data' => [
            'category' => ['name' => 'Reference'],
        ]]);

        $this->assertDatabaseHas('link_categories', ['category_name' => 'Reference']);
    });

    test('clears the category when categoryName is null', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/links/1', [
            'title' => 'Stack Overflow',
            'url' => 'https://stackoverflow.com',
            'categoryName' => null,
        ]);

        $response->assertStatus(200)->assertJson(['data' => [
            'category' => null,
        ]]);

        $this->assertDatabaseHas('links', ['id' => 1, 'link_category_id' => null]);
    });

    test('rejects "Egyéb" as a category name', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/links/1', [
            'title' => 'Stack Overflow',
            'url' => 'https://stackoverflow.com',
            'categoryName' => 'Egyéb',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['categoryName']);
    });

    test('rejects an invalid update payload', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/links/1', [
            'title' => '',
            'url' => 'https://stackoverflow.com',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['title']);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/links/999', [
            'title' => 'Stack Overflow',
            'url' => 'https://stackoverflow.com',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->putJson('/api/admin/links/1', [
            'title' => 'Stack Overflow',
            'url' => 'https://stackoverflow.com',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->putJson('/api/admin/links/1', [
            'title' => 'Stack Overflow',
            'url' => 'https://stackoverflow.com',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetUpdateLinkTestData(): void {
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
        ['id' => 1, 'category_name' => 'Community'],
        ['id' => 2, 'category_name' => 'Documentation'],
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
