<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Delete Tag', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetDeleteTagTestData();
    });

    test('deletes the tag row and its pivot rows, but leaves the article alone', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/tags/1');

        $response->assertStatus(204)->assertNoContent();

        $this->assertDatabaseMissing('tags', ['id' => 1]);
        $this->assertDatabaseMissing('knowledgebase_tags', ['tag_id' => 1]);
        $this->assertDatabaseHas('knowledgebase', ['id' => 1]);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/tags/999');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->deleteJson('/api/admin/tags/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->deleteJson('/api/admin/tags/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetDeleteTagTestData(): void {
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

    DB::table('tags')->insert([
        'id' => 1,
        'tag_name' => 'Onboarding',
    ]);

    DB::table('knowledgebase')->insert([
        'id' => 1,
        'audience' => 'P',
        'title' => 'Public 1',
        'main_content' => 'Main Content 1',
        'additional_content' => 'Additional content 1',
        'created_at' => '2026-02-08 21:31:00',
        'updated_at' => '2026-02-08 21:31:00',
        'published_at' => '2026-02-08 21:31:00',
    ]);

    DB::table('knowledgebase_tags')->insert([
        'knowledgebase_id' => 1,
        'tag_id' => 1,
    ]);
}
