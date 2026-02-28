<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Get News Item', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetGetNewsItemTestData();
    });

    test('retrieves public item if it is not expired', function () {
        $response = $this->getJson('/api/news/1');

        $response->assertStatus(200)->assertExactJson(['data' => [
            'id' => 1,
            'audience' => 'P',
            'title' => 'Public 1',
            'mainContent' => 'Main Content 1',
            'additionalContent' => 'Additional content 1',
            'createdAt' => '2026-02-08T20:31:00.000000Z',
            'updatedAt' => '2026-02-08T20:31:00.000000Z',
        ]]);
    });

    test('returns 404 for expired news', function () {
        $response = $this->getJson('/api/news/2');

        $response->assertStatus(404)->assertExactJson([
            'code' => 'GENERIC_NOT_FOUND',
            'status' => 404,
        ]);
    });

    test('returns 401 if the user is not logged in and tries to retrieve an authorized news item', function () {
        $response = $this->getJson('/api/news/3');

        $response->assertStatus(401)->assertExactJson([
            'code' => 'GENERIC_UNAUTHORIZED',
            'status' => 401,
        ]);
    });

    test('retrieves auth news for a logged in user', function () {
        Sanctum::actingAs(
            User::find(1),
        );

        $response = $this->getJson('/api/news/3');

        $response->assertStatus(200)->assertExactJson(['data' => [
            'id' => 3,
            'audience' => 'A',
            'isRead' => false,
            'title' => 'Authorized 1',
            'mainContent' => 'Main Content 3',
            'additionalContent' => 'Additional content 3',
            'createdAt' => '2026-02-08T20:33:00.000000Z',
            'updatedAt' => '2026-02-08T21:35:00.000000Z',
        ]]);
    });

    test('returns read status', function () {
        Sanctum::actingAs(
            User::find(1),
        );

        $response = $this->getJson('/api/news/1');

        $response->assertStatus(200)->assertExactJson(['data' => [
            'id' => 1,
            'audience' => 'P',
            'isRead' => true,
            'title' => 'Public 1',
            'mainContent' => 'Main Content 1',
            'additionalContent' => 'Additional content 1',
            'createdAt' => '2026-02-08T20:31:00.000000Z',
            'updatedAt' => '2026-02-08T20:31:00.000000Z',
        ]]);
    });
});

function resetGetNewsItemTestData(): void {
    DB::table('users')->insert([
        'id' => 1,
        'email' => 'user001@example.com',
        'password' => Hash::make('abc123456'),
        'confirmed' => 1,
        'newsletter' => 0,
        'ip_address' => '127.0.0.1',
        'last_active' => '2026-02-08 21:39:00',
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
            'expires_at' => null,
        ],
        [
            'id' => 2,
            'audience' => 'P',
            'title' => 'Public 2',
            'main_content' => 'Main Content 2',
            'additional_content' => 'Additional content 2',
            'created_at' => '2026-02-08 21:31:30',
            'updated_at' => '2026-02-08 21:31:30',
            'expires_at' => '2026-02-28 21:56:00',
        ],
        [
            'id' => 3,
            'audience' => 'A',
            'title' => 'Authorized 1',
            'main_content' => 'Main Content 3',
            'additional_content' => 'Additional content 3',
            'created_at' => '2026-02-08 21:33:00',
            'updated_at' => '2026-02-08 22:35:00',
            'expires_at' => null,
        ],
    ]);

    DB::table('users_news')->insert([
        [
            'user_id' => 1,
            'news_id' => 1,
        ],
    ]);
}
