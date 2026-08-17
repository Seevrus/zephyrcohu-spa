<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Get Knowledgebase Tags', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-08 21:46:00', 'Europe/Budapest');
        resetGetKnowledgebaseTagsTestData();
    });

    test('returns tag counts scoped to public articles for guest users', function () {
        $response = $this->getJson('/api/knowledgebase/tags');

        $response->assertStatus(200)->assertExactJson([
            'data' => [
                ['id' => 1, 'name' => 'Billing', 'count' => 2],
                ['id' => 2, 'name' => 'Onboarding', 'count' => 1],
            ],
        ]);
    });

    test('returns tag counts across all visible articles for authenticated users', function () {
        Sanctum::actingAs(
            User::find(1),
        );

        $response = $this->getJson('/api/knowledgebase/tags');

        $response->assertStatus(200)->assertExactJson([
            'data' => [
                ['id' => 4, 'name' => 'Admin Only', 'count' => 1],
                ['id' => 1, 'name' => 'Billing', 'count' => 2],
                ['id' => 2, 'name' => 'Onboarding', 'count' => 1],
            ],
        ]);
    });

    test('excludes tags used only by unpublished articles', function () {
        $response = $this->getJson('/api/knowledgebase/tags');

        $response->assertJsonMissing(['name' => 'Future']);
    });

    test('excludes tags with no matching articles', function () {
        $response = $this->getJson('/api/knowledgebase/tags');

        $response->assertJsonMissing(['name' => 'Unused']);
    });
});

function resetGetKnowledgebaseTagsTestData(): void {
    DB::table('users')->insert([
        'id' => 1,
        'email' => 'user001@example.com',
        'password' => Hash::make('abc123456'),
        'confirmed' => 1,
        'newsletter' => 0,
        'ip_address' => '127.0.0.1',
        'last_active' => '2026-02-08 21:39:00',
    ]);

    DB::table('tags')->insert([
        ['id' => 1, 'tag_name' => 'Billing'],
        ['id' => 2, 'tag_name' => 'Onboarding'],
        ['id' => 3, 'tag_name' => 'Unused'],
        ['id' => 4, 'tag_name' => 'Admin Only'],
        ['id' => 5, 'tag_name' => 'Future'],
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
        [
            'id' => 3,
            'audience' => 'A',
            'title' => 'Admin 1',
            'main_content' => 'Admin Content 1',
            'additional_content' => null,
            'created_at' => '2026-02-08 21:38:00',
            'updated_at' => '2026-02-08 21:38:00',
            'published_at' => '2026-02-08 21:38:00',
        ],
        [
            'id' => 4,
            'audience' => 'P',
            'title' => 'Not Yet Published',
            'main_content' => 'Main Content 4',
            'additional_content' => null,
            'created_at' => '2026-02-08 21:19:00',
            'updated_at' => '2026-02-08 21:19:00',
            'published_at' => '2099-01-01 00:00:00',
        ],
    ]);

    DB::table('knowledgebase_tags')->insert([
        ['knowledgebase_id' => 1, 'tag_id' => 1],
        ['knowledgebase_id' => 1, 'tag_id' => 2],
        ['knowledgebase_id' => 2, 'tag_id' => 1],
        ['knowledgebase_id' => 3, 'tag_id' => 4],
        ['knowledgebase_id' => 4, 'tag_id' => 5],
    ]);
}
