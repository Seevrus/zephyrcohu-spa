<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

describe('Store Document', function () {
    beforeEach(function () {
        Storage::fake('public');
        Storage::fake('local');
        resetStoreDocumentTestData();
    });

    test('stores the file on the public disk and slugifies the filename for a public category', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->post('/api/admin/documents', [
            'category' => 'tajekoztato',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
            'file' => UploadedFile::fake()->create('Integra Flyer 2026.pdf', 120),
        ]);

        $response->assertStatus(201)->assertJson(['data' => [
            'category' => 'tajekoztato',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'fileName' => 'integra-flyer-2026.pdf',
        ]]);

        Storage::disk('public')->assertExists('integra/tajekoztato/integra-flyer-2026.pdf');
        Storage::disk('local')->assertMissing('integra/tajekoztato/integra-flyer-2026.pdf');

        $this->assertDatabaseHas('documents', [
            'category' => 'tajekoztato',
            'path' => 'integra/tajekoztato/integra-flyer-2026.pdf',
        ]);
    });

    test('stores the file on the local disk for the update category', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->post('/api/admin/documents', [
            'category' => 'programfrissites',
            'displayName' => 'Update 2026.1',
            'version' => '2026.1',
            'publishedAt' => '2026-03-01 00:00:00',
            'file' => UploadedFile::fake()->create('update-2026-1.zip', 500),
        ]);

        $response->assertStatus(201);

        Storage::disk('local')->assertExists('integra/programfrissites/update-2026-1.zip');
        Storage::disk('public')->assertMissing('integra/programfrissites/update-2026-1.zip');
    });

    test('rejects a duplicate filename in the same category without overwriting it', function () {
        Sanctum::actingAs(User::find(2));

        Storage::disk('public')->put('integra/tajekoztato/flyer-2026.pdf', 'existing contents');

        $response = $this->postJson('/api/admin/documents', [
            'category' => 'tajekoztato',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
            'file' => UploadedFile::fake()->create('flyer-2026.pdf', 120),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['file']);

        expect(Storage::disk('public')->get('integra/tajekoztato/flyer-2026.pdf'))
            ->toBe('existing contents');
        $this->assertDatabaseCount('documents', 0);
    });

    test('rejects a missing file', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/documents', [
            'category' => 'tajekoztato',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['file']);
    });

    test('rejects a file over the size limit with a translated message', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->post('/api/admin/documents', [
            'category' => 'tajekoztato',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
            'file' => UploadedFile::fake()->create('flyer-2026.pdf', 51201),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors([
            'file' => 'A feltöltött fájl legfeljebb 50 MB méretű lehet.',
        ]);

        Storage::disk('public')->assertMissing('integra/tajekoztato/flyer-2026.pdf');
        $this->assertDatabaseCount('documents', 0);
    });

    test('answers a failed validation in Hungarian rather than with a translation key', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/documents', [
            'category' => 'tajekoztato',
            'displayName' => 'Flyer 2026',
            'publishedAt' => '2026-02-10 00:00:00',
            'file' => UploadedFile::fake()->create('flyer-2026.pdf', 120),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors([
            'version' => 'A(z) verzió mező kitöltése kötelező.',
        ]);
    });

    test('rejects an unknown category', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/documents', [
            'category' => 'not-a-real-category',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
            'file' => UploadedFile::fake()->create('flyer-2026.pdf', 120),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['category']);
    });

    test('rejects a missing version', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/documents', [
            'category' => 'tajekoztato',
            'displayName' => 'Flyer 2026',
            'publishedAt' => '2026-02-10 00:00:00',
            'file' => UploadedFile::fake()->create('flyer-2026.pdf', 120),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['version']);
    });

    test('an uploaded document can be downloaded through the public download endpoint', function () {
        Sanctum::actingAs(User::find(2));

        $this->post('/api/admin/documents', [
            'category' => 'tajekoztato',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
            'file' => UploadedFile::fake()->create('flyer-2026.pdf', 120),
        ])->assertStatus(201);

        $document = DB::table('documents')->where('display_name', 'Flyer 2026')->first();

        $response = $this->get("/api/documents/integra/{$document->id}/download");

        $response->assertStatus(200);
        $response->assertDownload('flyer-2026.pdf');
    });

    test('returns 404 for a guest', function () {
        $response = $this->postJson('/api/admin/documents', [
            'category' => 'tajekoztato',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
            'file' => UploadedFile::fake()->create('flyer-2026.pdf', 120),
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->postJson('/api/admin/documents', [
            'category' => 'tajekoztato',
            'displayName' => 'Flyer 2026',
            'version' => '2.0',
            'publishedAt' => '2026-02-10 00:00:00',
            'file' => UploadedFile::fake()->create('flyer-2026.pdf', 120),
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetStoreDocumentTestData(): void {
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
