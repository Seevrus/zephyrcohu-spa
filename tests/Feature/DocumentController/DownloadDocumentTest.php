<?php

use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

describe('Download Document', function () {
    beforeEach(function () {
        Storage::fake('public');
        Storage::fake('local');
        resetDownloadDocumentTestData();
    });

    test('downloads a public category document for a guest', function () {
        Storage::disk('public')->put('documents/integra-flyer/flyer-2026.pdf', 'flyer contents');

        $response = $this->get('/api/documents/integra/1/download');

        $response->assertStatus(200);
        $response->assertDownload('flyer-2026.pdf');
    });

    test('returns 401 for an update document when the user is not logged in', function () {
        Storage::disk('local')->put('documents/integra-update/update-2026-1.zip', 'update contents');

        $response = $this->getJson('/api/documents/integra/2/download');

        $response->assertStatus(401)->assertExactJson([
            'code' => 'GENERIC_UNAUTHORIZED',
            'status' => 401,
        ]);
    });

    test('downloads an update document for a logged in user', function () {
        Sanctum::actingAs(User::find(1));
        Storage::disk('local')->put('documents/integra-update/update-2026-1.zip', 'update contents');

        $response = $this->get('/api/documents/integra/2/download');

        $response->assertStatus(200);
        $response->assertDownload('update-2026-1.zip');
    });

    test('returns 404 for an unknown document id', function () {
        $response = $this->getJson('/api/documents/integra/999/download');

        $response->assertStatus(404);
    });
});

function resetDownloadDocumentTestData(): void {
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
            'display_name' => 'Flyer 2026',
            'version' => '2.0',
            'path' => 'documents/integra-flyer/flyer-2026.pdf',
            'published_at' => '2026-02-10 00:00:00',
            'created_at' => '2026-02-10 00:00:00',
            'updated_at' => '2026-02-10 00:00:00',
        ],
        [
            'id' => 2,
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
