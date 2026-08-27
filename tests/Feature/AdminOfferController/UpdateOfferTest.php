<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Update Offer', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetUpdateOfferTestData();
    });

    test('updates every field', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/offers/1', [
            'audience' => 'A',
            'title' => 'Updated title',
            'mainContent' => '<p>Updated main</p>',
            'additionalContent' => '<p>Updated additional</p>',
            'publishedAt' => '2026-03-05 12:00:00',
        ]);

        $response->assertStatus(200)->assertJson(['data' => [
            'id' => 1,
            'audience' => 'A',
            'title' => 'Updated title',
            'mainContent' => '<p>Updated main</p>',
            'additionalContent' => '<p>Updated additional</p>',
        ]]);

        $this->assertDatabaseHas('offers', [
            'id' => 1,
            'audience' => 'A',
            'title' => 'Updated title',
            'main_content' => '<p>Updated main</p>',
            'additional_content' => '<p>Updated additional</p>',
        ]);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/offers/999', [
            'audience' => 'P',
            'title' => 'Updated title',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-05 12:00:00',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('rejects a missing title', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/offers/1', [
            'audience' => 'P',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-05 12:00:00',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['title']);
    });

    test('returns 404 for a guest', function () {
        $response = $this->putJson('/api/admin/offers/1', [
            'audience' => 'P',
            'title' => 'Updated title',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-05 12:00:00',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->putJson('/api/admin/offers/1', [
            'audience' => 'P',
            'title' => 'Updated title',
            'mainContent' => 'Main content',
            'publishedAt' => '2026-03-05 12:00:00',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetUpdateOfferTestData(): void {
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

    DB::table('offers')->insert([
        'id' => 1,
        'audience' => 'P',
        'title' => 'Public 1',
        'main_content' => 'Main Content 1',
        'additional_content' => 'Additional content 1',
        'created_at' => '2026-02-08 21:31:00',
        'updated_at' => '2026-02-08 21:31:00',
        'published_at' => '2026-02-08 21:31:00',
    ]);
}
