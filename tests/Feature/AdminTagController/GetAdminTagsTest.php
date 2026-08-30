<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Get Admin Tags', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetGetAdminTagsTestData();
    });

    test('lists every tag alphabetically with correct article counts, including a zero-count tag', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/tags');

        $response->assertStatus(200)->assertExactJson(['data' => [
            ['id' => 2, 'name' => 'Billing', 'count' => 2],
            ['id' => 1, 'name' => 'Onboarding', 'count' => 1],
            ['id' => 3, 'name' => 'Unused', 'count' => 0],
        ]]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->getJson('/api/admin/tags');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->getJson('/api/admin/tags');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetGetAdminTagsTestData(): void {
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
        ['id' => 1, 'tag_name' => 'Onboarding'],
        ['id' => 2, 'tag_name' => 'Billing'],
        ['id' => 3, 'tag_name' => 'Unused'],
    ]);

    DB::table('knowledgebase')->insert([
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
    ]);

    DB::table('knowledgebase_tags')->insert([
        ['knowledgebase_id' => 1, 'tag_id' => 1],
        ['knowledgebase_id' => 1, 'tag_id' => 2],
        ['knowledgebase_id' => 2, 'tag_id' => 2],
    ]);
}
