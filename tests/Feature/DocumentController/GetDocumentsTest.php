<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

describe('Get Documents', function () {
    beforeEach(function () {
        resetGetDocumentsTestData();
    });

    test('retrieves documents for a public category in published_at desc order for guest users', function () {
        $response = $this->getJson('/api/documents/integra/integra-flyer');

        $response->assertStatus(200)->assertExactJson(['data' => [
            [
                'id' => 2,
                'category' => 'integra-flyer',
                'displayName' => 'Flyer 2026',
                'version' => '2.0',
                'publishedAt' => '2026-02-09T23:00:00.000000Z',
            ],
            [
                'id' => 1,
                'category' => 'integra-flyer',
                'displayName' => 'Flyer 2025',
                'version' => '1.0',
                'publishedAt' => '2026-01-09T23:00:00.000000Z',
            ],
        ]]);
    });

    test('returns 401 for the update category when the user is not logged in', function () {
        $response = $this->getJson('/api/documents/integra/integra-update');

        $response->assertStatus(401)->assertExactJson([
            'code' => 'GENERIC_UNAUTHORIZED',
            'status' => 401,
        ]);
    });

    test('returns the update category documents for a logged in user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->getJson('/api/documents/integra/integra-update');

        $response->assertStatus(200)->assertExactJson(['data' => [
            [
                'id' => 3,
                'category' => 'integra-update',
                'displayName' => 'Update 2026.1',
                'version' => '2026.1',
                'publishedAt' => '2026-02-28T23:00:00.000000Z',
            ],
        ]]);
    });

    test('returns 404 for an unknown category', function () {
        $response = $this->getJson('/api/documents/integra/unknown');

        $response->assertStatus(404);
    });
});

function resetGetDocumentsTestData(): void {
    DB::table('users')->insert([
        'id' => 1,
        'email' => 'user001@example.com',
        'password' => Hash::make('abc123456'),
        'confirmed' => 1,
        'newsletter' => 0,
        'ip_address' => '127.0.0.1',
        'last_active' => '2026-02-08 21:39:00',
    ]);

    DB::table('documents')->insert([
        [
            'id' => 1,
            'category' => 'integra-flyer',
            'display_name' => 'Flyer 2025',
            'version' => '1.0',
            'path' => 'documents/integra-flyer/flyer-2025.pdf',
            'published_at' => '2026-01-10 00:00:00',
            'created_at' => '2026-01-10 00:00:00',
            'updated_at' => '2026-01-10 00:00:00',
        ],
        [
            'id' => 2,
            'category' => 'integra-flyer',
            'display_name' => 'Flyer 2026',
            'version' => '2.0',
            'path' => 'documents/integra-flyer/flyer-2026.pdf',
            'published_at' => '2026-02-10 00:00:00',
            'created_at' => '2026-02-10 00:00:00',
            'updated_at' => '2026-02-10 00:00:00',
        ],
        [
            'id' => 3,
            'category' => 'integra-update',
            'display_name' => 'Update 2026.1',
            'version' => '2026.1',
            'path' => 'documents/integra-update/update-2026-1.zip',
            'published_at' => '2026-03-01 00:00:00',
            'created_at' => '2026-03-01 00:00:00',
            'updated_at' => '2026-03-01 00:00:00',
        ],
    ]);
}
