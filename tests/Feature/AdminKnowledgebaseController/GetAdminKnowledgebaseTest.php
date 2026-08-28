<?php

use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

describe('Get Admin Knowledgebase', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest');
        resetGetAdminKnowledgebaseTestData();
    });

    test('lists all articles for an admin, including unpublished, with tags and readers, ordered by publishedAt desc', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/knowledgebase');

        $response->assertStatus(200)->assertExactJson(['data' => [
            [
                'id' => 3,
                'audience' => 'A',
                'title' => 'Future 1',
                'mainContent' => 'Main Content 3',
                'additionalContent' => 'Additional content 3',
                'tags' => [],
                'publishedAt' => '2099-01-01T00:00:00.000000Z',
                'createdAt' => '2026-02-08T20:31:30.000000Z',
                'updatedAt' => '2026-02-08T20:31:30.000000Z',
                'readerCount' => 0,
                'readers' => [],
            ],
            [
                'id' => 1,
                'audience' => 'P',
                'title' => 'Public 1',
                'mainContent' => 'Main Content 1',
                'additionalContent' => 'Additional content 1',
                'tags' => [
                    ['id' => 1, 'name' => 'INTEGRA'],
                    ['id' => 2, 'name' => 'HR'],
                ],
                'publishedAt' => '2026-02-08T20:31:00.000000Z',
                'createdAt' => '2026-02-08T20:31:00.000000Z',
                'updatedAt' => '2026-02-08T20:31:00.000000Z',
                'readerCount' => 1,
                'readers' => ['user001@example.com'],
            ],
            [
                'id' => 2,
                'audience' => 'A',
                'title' => 'Authorized 1',
                'mainContent' => 'Main Content 2',
                'additionalContent' => null,
                'tags' => [],
                'publishedAt' => '2026-02-08T20:30:00.000000Z',
                'createdAt' => '2026-02-08T20:30:00.000000Z',
                'updatedAt' => '2026-02-08T20:30:00.000000Z',
                'readerCount' => 0,
                'readers' => [],
            ],
        ]]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->getJson('/api/admin/knowledgebase');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->getJson('/api/admin/knowledgebase');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetGetAdminKnowledgebaseTestData(): void {
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
            'audience' => 'A',
            'title' => 'Authorized 1',
            'main_content' => 'Main Content 2',
            'additional_content' => null,
            'created_at' => '2026-02-08 21:30:00',
            'updated_at' => '2026-02-08 21:30:00',
            'published_at' => '2026-02-08 21:30:00',
        ],
        [
            'id' => 3,
            'audience' => 'A',
            'title' => 'Future 1',
            'main_content' => 'Main Content 3',
            'additional_content' => 'Additional content 3',
            'created_at' => '2026-02-08 21:31:30',
            'updated_at' => '2026-02-08 21:31:30',
            'published_at' => '2099-01-01 01:00:00',
        ],
    ]);

    DB::table('tags')->insert([
        ['id' => 1, 'tag_name' => 'INTEGRA'],
        ['id' => 2, 'tag_name' => 'HR'],
    ]);

    DB::table('knowledgebase_tags')->insert([
        ['knowledgebase_id' => 1, 'tag_id' => 1],
        ['knowledgebase_id' => 1, 'tag_id' => 2],
    ]);

    DB::table('users_knowledgebase')->insert([
        'user_id' => 1,
        'knowledgebase_id' => 1,
        'read_at' => '2026-02-08 21:35:00',
    ]);
}
