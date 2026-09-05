<?php

use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

describe('Delete Document', function () {
    beforeEach(function () {
        Storage::fake('public');
        Storage::fake('local');
        resetDeleteDocumentTestData();
    });

    test('deletes the row and the file', function () {
        Sanctum::actingAs(User::find(2));

        Storage::disk('public')->put('integra/tajekoztato/flyer-2026.pdf', 'flyer contents');

        $response = $this->deleteJson('/api/admin/documents/1');

        $response->assertStatus(204);
        $this->assertDatabaseMissing('documents', ['id' => 1]);
        Storage::disk('public')->assertMissing('integra/tajekoztato/flyer-2026.pdf');
    });

    test('deletes the row even when the file is already missing from disk', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/documents/1');

        $response->assertStatus(204);
        $this->assertDatabaseMissing('documents', ['id' => 1]);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/documents/999');

        $response->assertStatus(404);
    });

    test('returns 404 for a guest', function () {
        $response = $this->deleteJson('/api/admin/documents/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->deleteJson('/api/admin/documents/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetDeleteDocumentTestData(): void {
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
        'category' => 'tajekoztato',
        'display_name' => 'Flyer 2026',
        'version' => '2.0',
        'path' => 'integra/tajekoztato/flyer-2026.pdf',
        'published_at' => '2026-02-10 00:00:00',
        'created_at' => '2026-02-10 00:00:00',
        'updated_at' => '2026-02-10 00:00:00',
    ]);
}
