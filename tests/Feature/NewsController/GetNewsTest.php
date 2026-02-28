<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Get News', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-08 21:46:00', 'Europe/Budapest');
        resetGetNewsTestData();
    });

    test('retrieves paginated news in the correct order for guest users', function () {
        $response = $this->getJson('/api/news');

        $response->assertStatus(200)->assertExactJson([
            'data' => [
                [
                    'id' => 3,
                    'audience' => 'P',
                    'title' => 'Updated Public 3',
                    'mainContent' => 'Main Content 3',
                    'additionalContent' => 'Additional content 3',
                    'createdAt' => '2026-02-08T20:33:00.000000Z',
                    'updatedAt' => '2026-02-08T21:35:00.000000Z',
                ],
                [
                    'id' => 9,
                    'audience' => 'P',
                    'title' => 'Updated Public 9',
                    'mainContent' => 'Main Content 9',
                    'additionalContent' => 'Updated Additional content 9',
                    'createdAt' => '2026-02-08T20:31:00.000000Z',
                    'updatedAt' => '2026-02-08T20:37:00.000000Z',
                ],
                [
                    'id' => 12,
                    'audience' => 'P',
                    'title' => 'Public 12',
                    'mainContent' => 'Main Content 12',
                    'additionalContent' => 'Additional content 12',
                    'createdAt' => '2026-02-08T20:32:12.000000Z',
                    'updatedAt' => '2026-02-08T20:32:12.000000Z',
                ],
                [
                    'id' => 10,
                    'audience' => 'P',
                    'title' => 'Public 10',
                    'mainContent' => 'Main Content 10',
                    'additionalContent' => 'Additional content 10',
                    'createdAt' => '2026-02-08T20:32:11.000000Z',
                    'updatedAt' => '2026-02-08T20:32:11.000000Z',
                ],
                [
                    'id' => 2,
                    'audience' => 'P',
                    'title' => 'Public 2',
                    'mainContent' => 'Main Content 2',
                    'additionalContent' => 'Additional content 2',
                    'createdAt' => '2026-02-08T20:31:30.000000Z',
                    'updatedAt' => '2026-02-08T20:31:30.000000Z',
                ],
                [
                    'id' => 1,
                    'audience' => 'P',
                    'title' => 'Public 1',
                    'mainContent' => 'Main Content 1',
                    'additionalContent' => 'Additional content 1',
                    'createdAt' => '2026-02-08T20:31:00.000000Z',
                    'updatedAt' => '2026-02-08T20:31:00.000000Z',
                ],
                [
                    'id' => 6,
                    'audience' => 'P',
                    'title' => 'Public 6',
                    'mainContent' => 'Main Content 6',
                    'additionalContent' => null,
                    'createdAt' => '2026-02-08T20:31:00.000000Z',
                    'updatedAt' => '2026-02-08T20:31:00.000000Z',
                ],
                [
                    'id' => 7,
                    'audience' => 'P',
                    'title' => 'Public 7',
                    'mainContent' => 'Main Content 7',
                    'additionalContent' => 'Additional content 7',
                    'createdAt' => '2026-02-08T20:31:00.000000Z',
                    'updatedAt' => '2026-02-08T20:31:00.000000Z',
                ],
                [
                    'id' => 4,
                    'audience' => 'P',
                    'title' => 'Public 4',
                    'mainContent' => 'Main Content 4',
                    'additionalContent' => 'Additional content 4',
                    'createdAt' => '2026-02-08T20:19:00.000000Z',
                    'updatedAt' => '2026-02-08T20:19:00.000000Z',
                ],
                [
                    'id' => 8,
                    'audience' => 'P',
                    'title' => 'Public 8',
                    'mainContent' => 'Main Content 8',
                    'additionalContent' => null,
                    'createdAt' => '2026-02-08T19:31:00.000000Z',
                    'updatedAt' => '2026-02-08T19:31:00.000000Z',
                ],
            ],
            'meta' => [
                'count' => 11,
                'total' => 12,
            ],
        ]);
    });

    test('returns data from the second page', function () {
        $response = $this->getJson('/api/news?page=2');

        $response->assertStatus(200)->assertExactJson([
            'data' => [
                [
                    'id' => 5,
                    'audience' => 'P',
                    'title' => 'Public 5',
                    'mainContent' => 'Main Content 5',
                    'additionalContent' => 'Additional content 5',
                    'createdAt' => '2026-02-06T20:31:00.000000Z',
                    'updatedAt' => '2026-02-06T20:31:00.000000Z',
                ],
            ], 'meta' => [
                'count' => 11,
                'total' => 12,
            ],
        ]);
    });

    test('returns news for logged in users, including whether they read it', function () {
        Sanctum::actingAs(
            User::find(1),
        );

        $response = $this->getJson('/api/news');

        $response->assertStatus(200)->assertExactJson([
            'data' => [
                [
                    'id' => 3,
                    'audience' => 'P',
                    'isRead' => false,
                    'title' => 'Updated Public 3',
                    'mainContent' => 'Main Content 3',
                    'additionalContent' => 'Additional content 3',
                    'createdAt' => '2026-02-08T20:33:00.000000Z',
                    'updatedAt' => '2026-02-08T21:35:00.000000Z',
                ],
                [
                    'id' => 13,
                    'audience' => 'A',
                    'isRead' => false,
                    'title' => 'Admin 1',
                    'mainContent' => 'Admin Content 1',
                    'additionalContent' => null,
                    'createdAt' => '2026-02-08T20:38:00.000000Z',
                    'updatedAt' => '2026-02-08T20:38:00.000000Z',
                ],
                [
                    'id' => 9,
                    'audience' => 'P',
                    'isRead' => false,
                    'title' => 'Updated Public 9',
                    'mainContent' => 'Main Content 9',
                    'additionalContent' => 'Updated Additional content 9',
                    'createdAt' => '2026-02-08T20:31:00.000000Z',
                    'updatedAt' => '2026-02-08T20:37:00.000000Z',
                ],
                [
                    'id' => 12,
                    'audience' => 'P',
                    'isRead' => false,
                    'title' => 'Public 12',
                    'mainContent' => 'Main Content 12',
                    'additionalContent' => 'Additional content 12',
                    'createdAt' => '2026-02-08T20:32:12.000000Z',
                    'updatedAt' => '2026-02-08T20:32:12.000000Z',
                ],
                [
                    'id' => 10,
                    'audience' => 'P',
                    'isRead' => false,
                    'title' => 'Public 10',
                    'mainContent' => 'Main Content 10',
                    'additionalContent' => 'Additional content 10',
                    'createdAt' => '2026-02-08T20:32:11.000000Z',
                    'updatedAt' => '2026-02-08T20:32:11.000000Z',
                ],
                [
                    'id' => 2,
                    'audience' => 'P',
                    'isRead' => true,
                    'title' => 'Public 2',
                    'mainContent' => 'Main Content 2',
                    'additionalContent' => 'Additional content 2',
                    'createdAt' => '2026-02-08T20:31:30.000000Z',
                    'updatedAt' => '2026-02-08T20:31:30.000000Z',
                ],
                [
                    'id' => 1,
                    'audience' => 'P',
                    'isRead' => true,
                    'title' => 'Public 1',
                    'mainContent' => 'Main Content 1',
                    'additionalContent' => 'Additional content 1',
                    'createdAt' => '2026-02-08T20:31:00.000000Z',
                    'updatedAt' => '2026-02-08T20:31:00.000000Z',
                ],
                [
                    'id' => 6,
                    'audience' => 'P',
                    'isRead' => false,
                    'title' => 'Public 6',
                    'mainContent' => 'Main Content 6',
                    'additionalContent' => null,
                    'createdAt' => '2026-02-08T20:31:00.000000Z',
                    'updatedAt' => '2026-02-08T20:31:00.000000Z',
                ],
                [
                    'id' => 7,
                    'audience' => 'P',
                    'isRead' => false,
                    'title' => 'Public 7',
                    'mainContent' => 'Main Content 7',
                    'additionalContent' => 'Additional content 7',
                    'createdAt' => '2026-02-08T20:31:00.000000Z',
                    'updatedAt' => '2026-02-08T20:31:00.000000Z',
                ],
                [
                    'id' => 4,
                    'audience' => 'P',
                    'isRead' => false,
                    'title' => 'Public 4',
                    'mainContent' => 'Main Content 4',
                    'additionalContent' => 'Additional content 4',
                    'createdAt' => '2026-02-08T20:19:00.000000Z',
                    'updatedAt' => '2026-02-08T20:19:00.000000Z',
                ],
            ],
            'meta' => [
                'count' => 12,
                'total' => 12,
            ],
        ]);
    });
});

function resetGetNewsTestData(): void {
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
            'expires_at' => null,
        ],
        [
            'id' => 3,
            'audience' => 'P',
            'title' => 'Updated Public 3',
            'main_content' => 'Main Content 3',
            'additional_content' => 'Additional content 3',
            'created_at' => '2026-02-08 21:33:00',
            'updated_at' => '2026-02-08 22:35:00',
            'expires_at' => null,
        ],
        [
            'id' => 4,
            'audience' => 'P',
            'title' => 'Public 4',
            'main_content' => 'Main Content 4',
            'additional_content' => 'Additional content 4',
            'created_at' => '2026-02-08 21:19:00',
            'updated_at' => '2026-02-08 21:19:00',
            'expires_at' => null,
        ],
        [
            'id' => 5,
            'audience' => 'P',
            'title' => 'Public 5',
            'main_content' => 'Main Content 5',
            'additional_content' => 'Additional content 5',
            'created_at' => '2026-02-06 21:31:00',
            'updated_at' => '2026-02-06 21:31:00',
            'expires_at' => null,
        ],
        [
            'id' => 6,
            'audience' => 'P',
            'title' => 'Public 6',
            'main_content' => 'Main Content 6',
            'additional_content' => null,
            'created_at' => '2026-02-08 21:31:00',
            'updated_at' => '2026-02-08 21:31:00',
            'expires_at' => null,
        ],
        [
            'id' => 7,
            'audience' => 'P',
            'title' => 'Public 7',
            'main_content' => 'Main Content 7',
            'additional_content' => 'Additional content 7',
            'created_at' => '2026-02-08 21:31:00',
            'updated_at' => '2026-02-08 21:31:00',
            'expires_at' => null,
        ],
        [
            'id' => 8,
            'audience' => 'P',
            'title' => 'Public 8',
            'main_content' => 'Main Content 8',
            'additional_content' => null,
            'created_at' => '2026-02-08 20:31:00',
            'updated_at' => '2026-02-08 20:31:00',
            'expires_at' => null,
        ],
        [
            'id' => 9,
            'audience' => 'P',
            'title' => 'Updated Public 9',
            'main_content' => 'Main Content 9',
            'additional_content' => 'Updated Additional content 9',
            'created_at' => '2026-02-08 21:31:00',
            'updated_at' => '2026-02-08 21:37:00',
            'expires_at' => null,
        ],
        [
            'id' => 10,
            'audience' => 'P',
            'title' => 'Public 10',
            'main_content' => 'Main Content 10',
            'additional_content' => 'Additional content 10',
            'created_at' => '2026-02-08 21:32:11',
            'updated_at' => '2026-02-08 21:32:11',
            'expires_at' => null,
        ],
        [
            'id' => 11,
            'audience' => 'P',
            'title' => 'Public 11',
            'main_content' => 'Main Content 11',
            'additional_content' => 'Additional content 11',
            'created_at' => '2026-02-01 09:11:00',
            'updated_at' => '2026-02-01 09:11:00',
            'expires_at' => '2026-02-08 21:35:00',
        ],
        [
            'id' => 12,
            'audience' => 'P',
            'title' => 'Public 12',
            'main_content' => 'Main Content 12',
            'additional_content' => 'Additional content 12',
            'created_at' => '2026-02-08 21:32:12',
            'updated_at' => '2026-02-08 21:32:12',
            'expires_at' => null,
        ],
        [
            'id' => 13,
            'audience' => 'A',
            'title' => 'Admin 1',
            'main_content' => 'Admin Content 1',
            'additional_content' => null,
            'created_at' => '2026-02-08 21:38:00',
            'updated_at' => '2026-02-08 21:38:00',
            'expires_at' => null,
        ],
    ]);

    DB::table('users_news')->insert([
        [
            'user_id' => 1,
            'news_id' => 1,
        ],
        [
            'user_id' => 1,
            'news_id' => 2,
        ],
        [
            'user_id' => 1,
            'news_id' => 11,
        ],
    ]);
}
