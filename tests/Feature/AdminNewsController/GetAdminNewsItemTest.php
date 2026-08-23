<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Get Admin News Item', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetGetAdminNewsItemTestData();
    });

    test('returns a single item with readers, even if unpublished', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/news/2');

        $response->assertStatus(200)->assertExactJson(['data' => [
            'id' => 2,
            'audience' => 'A',
            'title' => 'Future 1',
            'mainContent' => 'Main Content 2',
            'additionalContent' => null,
            'publishedAt' => '2099-01-01T00:00:00.000000Z',
            'createdAt' => '2026-02-08T20:31:30.000000Z',
            'updatedAt' => '2026-02-08T20:31:30.000000Z',
            'readerCount' => 0,
            'readers' => [],
        ]]);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/news/999');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->getJson('/api/admin/news/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->getJson('/api/admin/news/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetGetAdminNewsItemTestData(): void {
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
            'title' => 'Future 1',
            'main_content' => 'Main Content 2',
            'additional_content' => null,
            'created_at' => '2026-02-08 21:31:30',
            'updated_at' => '2026-02-08 21:31:30',
            'published_at' => '2099-01-01 01:00:00',
        ],
    ]);
}
