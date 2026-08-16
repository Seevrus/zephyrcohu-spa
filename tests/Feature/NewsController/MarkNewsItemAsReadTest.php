<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Mark News Item As Read', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetMarkNewsItemAsReadTestData();
    });

    test('returns 401 if the user is not logged in', function () {
        $response = $this->postJson('/api/news/1/read');

        $response->assertStatus(401);
    });

    test('returns 404 if the news item does not exist', function () {
        Sanctum::actingAs(
            User::find(1),
        );

        $response = $this->postJson('/api/news/999/read');

        $response->assertStatus(404)->assertExactJson([
            'code' => 'GENERIC_NOT_FOUND',
            'status' => 404,
        ]);
    });

    test('returns 404 if the news item is not published yet', function () {
        Sanctum::actingAs(
            User::find(1),
        );

        $response = $this->postJson('/api/news/3/read');

        $response->assertStatus(404)->assertExactJson([
            'code' => 'GENERIC_NOT_FOUND',
            'status' => 404,
        ]);
    });

    test('marks an unread news item as read', function () {
        Sanctum::actingAs(
            User::find(1),
        );

        $response = $this->postJson('/api/news/2/read');

        $response->assertStatus(204)->assertNoContent();

        $this->assertDatabaseHas('users_news', [
            'user_id' => 1,
            'news_id' => 2,
            'read_at' => '2026-02-28 21:59:40',
        ]);
    });

    test('does not create a duplicate row or change read_at when marking an already read item as read', function () {
        Sanctum::actingAs(
            User::find(1),
        );

        $response = $this->postJson('/api/news/1/read');

        $response->assertStatus(204)->assertNoContent();

        $this->assertDatabaseCount('users_news', 1);
        $this->assertDatabaseHas('users_news', [
            'user_id' => 1,
            'news_id' => 1,
            'read_at' => '2026-02-08 21:40:00',
        ]);
    });
});

function resetMarkNewsItemAsReadTestData(): void {
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
            'published_at' => '2026-02-08 21:31:00',
        ],
        [
            'id' => 2,
            'audience' => 'P',
            'title' => 'Public 2',
            'main_content' => 'Main Content 2',
            'additional_content' => 'Additional content 2',
            'created_at' => '2026-02-08 21:31:30',
            'updated_at' => '2026-02-08 21:31:30',
            'published_at' => '2026-02-08 21:31:30',
        ],
        [
            'id' => 3,
            'audience' => 'P',
            'title' => 'Public 3',
            'main_content' => 'Main Content 3',
            'additional_content' => 'Additional content 3',
            'created_at' => '2026-02-08 21:32:00',
            'updated_at' => '2026-02-08 21:32:00',
            'published_at' => '2099-01-01 00:00:00',
        ],
    ]);

    DB::table('users_news')->insert([
        [
            'user_id' => 1,
            'news_id' => 1,
            'read_at' => '2026-02-08 21:40:00',
        ],
    ]);
}
