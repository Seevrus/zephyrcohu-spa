<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

describe('Store Link', function () {
    beforeEach(function () {
        resetStoreLinkTestData();
    });

    test('creates a link under an existing category without creating a duplicate category row', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/links', [
            'title' => 'GitHub',
            'url' => 'https://github.com',
            'categoryName' => 'Community',
        ]);

        $response->assertStatus(201)->assertJson(['data' => [
            'title' => 'GitHub',
            'url' => 'https://github.com',
            'category' => ['id' => 1, 'name' => 'Community'],
        ]]);

        expect(DB::table('link_categories')->where('category_name', 'Community')->count())->toBe(1);
    });

    test('creates a link and a brand-new category when the name does not exist yet', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/links', [
            'title' => 'MDN Web Docs',
            'url' => 'https://developer.mozilla.org',
            'categoryName' => 'Reference',
        ]);

        $response->assertStatus(201)->assertJson(['data' => [
            'title' => 'MDN Web Docs',
            'url' => 'https://developer.mozilla.org',
            'category' => ['name' => 'Reference'],
        ]]);

        $this->assertDatabaseHas('link_categories', ['category_name' => 'Reference']);
    });

    test('trims the category name so it does not create a twin of an existing category', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/links', [
            'title' => 'GitHub',
            'url' => 'https://github.com',
            'categoryName' => ' Community ',
        ]);

        $response->assertStatus(201)->assertJson(['data' => [
            'category' => ['id' => 1, 'name' => 'Community'],
        ]]);

        expect(DB::table('link_categories')->where('category_name', 'Community')->count())->toBe(1);
    });

    test('creates an uncategorised link when categoryName is null', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/links', [
            'title' => 'Uncategorised Link',
            'url' => 'https://example.com',
            'categoryName' => null,
        ]);

        $response->assertStatus(201)->assertJson(['data' => [
            'title' => 'Uncategorised Link',
            'category' => null,
        ]]);
    });

    test('creates an uncategorised link when categoryName is omitted', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/links', [
            'title' => 'Uncategorised Link',
            'url' => 'https://example.com',
        ]);

        $response->assertStatus(201)->assertJson(['data' => [
            'title' => 'Uncategorised Link',
            'category' => null,
        ]]);
    });

    test('rejects "Egyéb" as a category name', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/links', [
            'title' => 'Uncategorised Link',
            'url' => 'https://example.com',
            'categoryName' => 'Egyéb',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['categoryName']);
    });

    test('rejects a url without a protocol', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/links', [
            'title' => 'GitHub',
            'url' => 'github.com',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['url']);
    });

    test('rejects a missing title', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/links', [
            'url' => 'https://github.com',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['title']);
    });

    test('returns 404 for a guest', function () {
        $response = $this->postJson('/api/admin/links', [
            'title' => 'GitHub',
            'url' => 'https://github.com',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->postJson('/api/admin/links', [
            'title' => 'GitHub',
            'url' => 'https://github.com',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetStoreLinkTestData(): void {
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
    ]);
}
