<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

describe('Update Document', function () {
    beforeEach(function () {
        Storage::fake('public');
        Storage::fake('local');
        resetUpdateDocumentTestData();
        Storage::disk('public')->put('integra/integra-flyer/flyer-2026.pdf', 'flyer contents');
    });

    test('updates the metadata only and leaves the file alone', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->post('/api/admin/documents/1', [
            'category' => 'integra-flyer',
            'displayName' => 'Flyer 2026 (updated)',
            'version' => '2.1',
            'publishedAt' => '2026-02-15 00:00:00',
        ]);

        $response->assertStatus(200)->assertJson(['data' => [
            'displayName' => 'Flyer 2026 (updated)',
            'version' => '2.1',
            'fileName' => 'flyer-2026.pdf',
        ]]);

        Storage::disk('public')->assertExists('integra/integra-flyer/flyer-2026.pdf');
        expect(Storage::disk('public')->get('integra/integra-flyer/flyer-2026.pdf'))->toBe('flyer contents');
    });

    test('moves the file when only the category changes, including a public-to-local move', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->post('/api/admin/documents/1', [
            'category' => 'integra-update',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
        ]);

        $response->assertStatus(200)->assertJson(['data' => [
            'category' => 'integra-update',
            'fileName' => 'flyer-2026.pdf',
        ]]);

        Storage::disk('public')->assertMissing('integra/integra-flyer/flyer-2026.pdf');
        Storage::disk('local')->assertExists('integra/integra-update/flyer-2026.pdf');
        expect(Storage::disk('local')->get('integra/integra-update/flyer-2026.pdf'))->toBe('flyer contents');

        $this->assertDatabaseHas('documents', [
            'id' => 1,
            'category' => 'integra-update',
            'path' => 'integra/integra-update/flyer-2026.pdf',
        ]);
    });

    test('replacing the file deletes the old one and stores the new one', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->post('/api/admin/documents/1', [
            'category' => 'integra-flyer',
            'displayName' => 'Flyer 2026',
            'version' => '2.1',
            'publishedAt' => '2026-02-10 00:00:00',
            'file' => UploadedFile::fake()->create('Flyer 2026 v2.pdf', 130),
        ]);

        $response->assertStatus(200)->assertJson(['data' => [
            'fileName' => 'flyer-2026-v2.pdf',
        ]]);

        Storage::disk('public')->assertMissing('integra/integra-flyer/flyer-2026.pdf');
        Storage::disk('public')->assertExists('integra/integra-flyer/flyer-2026-v2.pdf');

        $this->assertDatabaseHas('documents', [
            'id' => 1,
            'path' => 'integra/integra-flyer/flyer-2026-v2.pdf',
        ]);
    });

    test('a duplicate filename at the destination category rejects the category move and changes nothing', function () {
        Sanctum::actingAs(User::find(2));

        Storage::disk('public')->put('integra/integra-other/flyer-2026.pdf', 'other contents');

        $response = $this->postJson('/api/admin/documents/1', [
            'category' => 'integra-other',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['category']);

        Storage::disk('public')->assertExists('integra/integra-flyer/flyer-2026.pdf');
        expect(Storage::disk('public')->get('integra/integra-other/flyer-2026.pdf'))->toBe('other contents');

        $this->assertDatabaseHas('documents', [
            'id' => 1,
            'category' => 'integra-flyer',
            'path' => 'integra/integra-flyer/flyer-2026.pdf',
        ]);
    });

    test('a duplicate filename at the destination category rejects a replacement upload and changes nothing', function () {
        Sanctum::actingAs(User::find(2));

        Storage::disk('public')->put('integra/integra-flyer/flyer-2026-v2.pdf', 'other contents');

        $response = $this->postJson('/api/admin/documents/1', [
            'category' => 'integra-flyer',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
            'file' => UploadedFile::fake()->create('Flyer 2026 v2.pdf', 130),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['file']);

        Storage::disk('public')->assertExists('integra/integra-flyer/flyer-2026.pdf');
        expect(Storage::disk('public')->get('integra/integra-flyer/flyer-2026-v2.pdf'))->toBe('other contents');

        $this->assertDatabaseHas('documents', [
            'id' => 1,
            'path' => 'integra/integra-flyer/flyer-2026.pdf',
        ]);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/documents/999', [
            'category' => 'integra-flyer',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
        ]);

        $response->assertStatus(404);
    });

    test('returns 404 for a guest', function () {
        $response = $this->postJson('/api/admin/documents/1', [
            'category' => 'integra-flyer',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->postJson('/api/admin/documents/1', [
            'category' => 'integra-flyer',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetUpdateDocumentTestData(): void {
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
        'id' => 1,
        'category' => 'integra-flyer',
        'display_name' => 'Flyer 2026',
        'version' => '2.0',
        'path' => 'integra/integra-flyer/flyer-2026.pdf',
        'published_at' => '2026-02-10 00:00:00',
        'created_at' => '2026-02-10 00:00:00',
        'updated_at' => '2026-02-10 00:00:00',
    ]);
}
