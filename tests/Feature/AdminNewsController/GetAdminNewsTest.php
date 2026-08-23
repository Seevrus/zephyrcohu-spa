<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Get Admin News', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetGetAdminNewsTestData();
    });

    test('lists all news for an admin, including unpublished, ordered by publishedAt desc', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/news');

        $response->assertStatus(200)->assertExactJson(['data' => [
            [
                'id' => 3,
                'audience' => 'A',
                'title' => 'Future 1',
                'mainContent' => 'Main Content 3',
                'additionalContent' => 'Additional content 3',
                'publishedAt' => '2099-01-01T00:00:00.000000Z',
                'createdAt' => '2026-02-08T20:31:30.000000Z',
                'updatedAt' => '2026-02-08T20:31:30.000000Z',
                'readerCount' => 0,
                'readers' => [],
            ],
            [
                'id' => 1,
                'audience' => 'P',
                'title' => 'Public 1',
                'mainContent' => 'Main Content 1',
                'additionalContent' => 'Additional content 1',
                'publishedAt' => '2026-02-08T20:31:00.000000Z',
                'createdAt' => '2026-02-08T20:31:00.000000Z',
                'updatedAt' => '2026-02-08T20:31:00.000000Z',
                'readerCount' => 2,
                'readers' => ['user001@example.com', 'user002@example.com'],
            ],
            [
                'id' => 2,
                'audience' => 'A',
                'title' => 'Authorized 1',
                'mainContent' => 'Main Content 2',
                'additionalContent' => null,
                'publishedAt' => '2026-02-08T20:30:00.000000Z',
                'createdAt' => '2026-02-08T20:30:00.000000Z',
                'updatedAt' => '2026-02-08T20:30:00.000000Z',
                'readerCount' => 0,
                'readers' => [],
            ],
        ]]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->getJson('/api/admin/news');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->getJson('/api/admin/news');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetGetAdminNewsTestData(): void {
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
        [
            'id' => 3,
            'email' => 'user002@example.com',
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

    DB::table('news')->insert([
        [
            'id' => 1,
            'audience' => 'P',
            'title' => 'Public 1',
            'main_content' => 'Main Content 1',
            'additional_content' => 'Additional content 1',
            'created_at' => '2026-02-08 21:31:00',
            'updated_at' => '2026-02-08 21:31:00',
            'published_at' => '2026-02-08 21:31:00',
        ],
        [
            'id' => 2,
            'audience' => 'A',
            'title' => 'Authorized 1',
            'main_content' => 'Main Content 2',
            'additional_content' => null,
            'created_at' => '2026-02-08 21:30:00',
            'updated_at' => '2026-02-08 21:30:00',
            'published_at' => '2026-02-08 21:30:00',
        ],
        [
            'id' => 3,
            'audience' => 'A',
            'title' => 'Future 1',
            'main_content' => 'Main Content 3',
            'additional_content' => 'Additional content 3',
            'created_at' => '2026-02-08 21:31:30',
            'updated_at' => '2026-02-08 21:31:30',
            'published_at' => '2099-01-01 01:00:00',
        ],
    ]);

    DB::table('users_news')->insert([
        [
            'user_id' => 1,
            'news_id' => 1,
            'read_at' => '2026-02-08 21:40:00',
        ],
        [
            'user_id' => 3,
            'news_id' => 1,
            'read_at' => '2026-02-08 21:41:00',
        ],
    ]);
}
