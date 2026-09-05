<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

describe('Get Admin Links', function () {
    beforeEach(function () {
        resetGetAdminLinksTestData();
    });

    test('lists every link with its embedded category, ordered by category name then title, including the uncategorised one', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/links');

        $response->assertStatus(200)->assertExactJson(['data' => [
            [
                'id' => 3,
                'title' => 'GitHub',
                'url' => 'https://github.com',
                'category' => ['id' => 2, 'name' => 'Community'],
            ],
            [
                'id' => 1,
                'title' => 'Stack Overflow',
                'url' => 'https://stackoverflow.com',
                'category' => ['id' => 2, 'name' => 'Community'],
            ],
            [
                'id' => 4,
                'title' => 'Laravel Documentation',
                'url' => 'https://laravel.com/docs',
                'category' => ['id' => 1, 'name' => 'Documentation'],
            ],
            [
                'id' => 5,
                'title' => 'MDN Web Docs',
                'url' => 'https://developer.mozilla.org',
                'category' => null,
            ],
        ]]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->getJson('/api/admin/links');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->getJson('/api/admin/links');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetGetAdminLinksTestData(): void {
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
        [
            'id' => 1,
            'title' => 'Stack Overflow',
            'link_category_id' => 2,
            'url' => 'https://stackoverflow.com',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'id' => 3,
            'title' => 'GitHub',
            'link_category_id' => 2,
            'url' => 'https://github.com',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'id' => 4,
            'title' => 'Laravel Documentation',
            'link_category_id' => 1,
            'url' => 'https://laravel.com/docs',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'id' => 5,
            'title' => 'MDN Web Docs',
            'link_category_id' => null,
            'url' => 'https://developer.mozilla.org',
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);
}
