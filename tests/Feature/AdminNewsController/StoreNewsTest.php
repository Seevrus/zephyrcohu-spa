<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Store News', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetStoreNewsTestData();
    });

    test('creates a news item and returns 201 with the row', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/news', [
            'audience' => 'P',
            'title' => 'New title',
            'mainContent' => '<p>Main content</p>',
            'additionalContent' => '<p>Additional content</p>',
            'publishedAt' => '2026-03-01 10:00:00',
        ]);

        $response->assertStatus(201)->assertJson(['data' => [
            'audience' => 'P',
            'title' => 'New title',
            'mainContent' => '<p>Main content</p>',
            'additionalContent' => '<p>Additional content</p>',
            'readerCount' => 0,
            'readers' => [],
        ]]);

        $this->assertDatabaseHas('news', [
            'audience' => 'P',
            'title' => 'New title',
            'main_content' => '<p>Main content</p>',
            'additional_content' => '<p>Additional content</p>',
        ]);
    });

    test('accepts a future publishedAt', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/news', [
            'audience' => 'A',
            'title' => 'Future news',
            'mainContent' => 'Main content',
            'additionalContent' => null,
            'publishedAt' => '2099-01-01 00:00:00',
        ]);

        $response->assertStatus(201)->assertJson(['data' => [
            'title' => 'Future news',
            'publishedAt' => '2098-12-31T23:00:00.000000Z',
        ]]);
    });

    test('rejects a missing title', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/news', [
            'audience' => 'P',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['title']);
    });

    test('rejects an invalid audience', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/news', [
            'audience' => 'X',
            'title' => 'New title',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['audience']);
    });

    test('returns 404 for a guest', function () {
        $response = $this->postJson('/api/admin/news', [
            'audience' => 'P',
            'title' => 'New title',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->postJson('/api/admin/news', [
            'audience' => 'P',
            'title' => 'New title',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-01 10:00:00',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetStoreNewsTestData(): void {
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
}
