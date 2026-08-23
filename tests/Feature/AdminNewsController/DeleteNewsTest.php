<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Delete News', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetDeleteNewsTestData();
    });

    test('deletes the row and returns 204', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/news/1');

        $response->assertStatus(204)->assertNoContent();

        $this->assertDatabaseMissing('news', ['id' => 1]);
    });

    test('removes the users_news rows for the deleted item', function () {
        Sanctum::actingAs(User::find(2));

        $this->deleteJson('/api/admin/news/1');

        $this->assertDatabaseMissing('users_news', ['news_id' => 1]);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/news/999');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->deleteJson('/api/admin/news/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->deleteJson('/api/admin/news/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetDeleteNewsTestData(): void {
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
        'id' => 1,
        'audience' => 'P',
        'title' => 'Public 1',
        'main_content' => 'Main Content 1',
        'additional_content' => 'Additional content 1',
        'created_at' => '2026-02-08 21:31:00',
        'updated_at' => '2026-02-08 21:31:00',
        'published_at' => '2026-02-08 21:31:00',
    ]);

    DB::table('users_news')->insert([
        'user_id' => 1,
        'news_id' => 1,
        'read_at' => '2026-02-08 21:40:00',
    ]);
}
