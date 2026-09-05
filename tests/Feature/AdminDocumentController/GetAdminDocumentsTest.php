<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

describe('Get Admin Documents', function () {
    beforeEach(function () {
        resetAdminDocumentsTestData();
    });

    test('lists every document in every category, published or not, ordered by category then display name', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/documents');

        $response->assertStatus(200)->assertExactJson(['data' => [
            [
                'id' => 3,
                'category' => 'integra-flyer',
                'displayName' => 'Flyer 2025',
                'version' => '1.0',
                'fileName' => 'flyer-2025.pdf',
                'publishedAt' => '2026-01-09T23:00:00.000000Z',
            ],
            [
                'id' => 1,
                'category' => 'integra-flyer',
                'displayName' => 'Flyer 2026',
                'version' => '2.0',
                'fileName' => 'flyer-2026.pdf',
                'publishedAt' => '2026-02-09T23:00:00.000000Z',
            ],
            [
                'id' => 4,
                'category' => 'integra-flyer',
                'displayName' => 'Flyer 2027',
                'version' => '3.0',
                'fileName' => 'flyer-2027.pdf',
                'publishedAt' => '2098-12-31T23:00:00.000000Z',
            ],
            [
                'id' => 2,
                'category' => 'integra-update',
                'displayName' => 'Update 2026.1',
                'version' => '2026.1',
                'fileName' => 'update-2026-1.zip',
                'publishedAt' => '2026-02-28T23:00:00.000000Z',
            ],
        ]]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->getJson('/api/admin/documents');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->getJson('/api/admin/documents');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

describe('Get Admin Document', function () {
    beforeEach(function () {
        resetAdminDocumentsTestData();
    });

    test('returns a single document', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/documents/1');

        $response->assertStatus(200)->assertExactJson(['data' => [
            'id' => 1,
            'category' => 'integra-flyer',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'fileName' => 'flyer-2026.pdf',
            'publishedAt' => '2026-02-09T23:00:00.000000Z',
        ]]);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->getJson('/api/admin/documents/999');

        $response->assertStatus(404);
    });

    test('returns 404 for a guest', function () {
        $response = $this->getJson('/api/admin/documents/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->getJson('/api/admin/documents/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetAdminDocumentsTestData(): void {
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

    DB::table('documents')->insert([
        [
            'id' => 1,
            'category' => 'integra-flyer',
            'display_name' => 'Flyer 2026',
            'version' => '2.0',
            'path' => 'integra/integra-flyer/flyer-2026.pdf',
            'published_at' => '2026-02-10 00:00:00',
            'created_at' => '2026-02-10 00:00:00',
            'updated_at' => '2026-02-10 00:00:00',
        ],
        [
            'id' => 2,
            'category' => 'integra-update',
            'display_name' => 'Update 2026.1',
            'version' => '2026.1',
            'path' => 'integra/integra-update/update-2026-1.zip',
            'published_at' => '2026-03-01 00:00:00',
            'created_at' => '2026-03-01 00:00:00',
            'updated_at' => '2026-03-01 00:00:00',
        ],
        [
            'id' => 3,
            'category' => 'integra-flyer',
            'display_name' => 'Flyer 2025',
            'version' => '1.0',
            'path' => 'integra/integra-flyer/flyer-2025.pdf',
            'published_at' => '2026-01-10 00:00:00',
            'created_at' => '2026-01-10 00:00:00',
            'updated_at' => '2026-01-10 00:00:00',
        ],
        [
            'id' => 4,
            'category' => 'integra-flyer',
            'display_name' => 'Flyer 2027',
            'version' => '3.0',
            'path' => 'integra/integra-flyer/flyer-2027.pdf',
            'published_at' => '2099-01-01 00:00:00',
            'created_at' => '2099-01-01 00:00:00',
            'updated_at' => '2099-01-01 00:00:00',
        ],
    ]);
}
