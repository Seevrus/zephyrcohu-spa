<?php

use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

describe('Store Newsletter', function () {
    beforeEach(function () {
        resetStoreNewsletterTestData();
    });

    test('creates the newsletter, sends no mail, and returns 201 with counters', function () {
        Mail::fake();
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/newsletters', [
            'subject' => 'Új hírlevél',
            'content' => '<p>Hírlevél tartalma</p>',
        ]);

        $response->assertStatus(201)->assertJson(['data' => [
            'subject' => 'Új hírlevél',
            'content' => '<p>Hírlevél tartalma</p>',
            'recipientCount' => 1,
            'sentCount' => 0,
            'isSentToEveryone' => false,
        ]]);

        $this->assertDatabaseHas('newsletters', [
            'subject' => 'Új hírlevél',
            'content' => '<p>Hírlevél tartalma</p>',
        ]);

        Mail::assertNothingSent();
    });

    test('rejects a missing subject', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/newsletters', [
            'content' => '<p>Hírlevél tartalma</p>',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['subject']);
    });

    test('rejects a missing content', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/newsletters', [
            'subject' => 'Új hírlevél',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['content']);
    });

    test('returns 404 for a guest', function () {
        $response = $this->postJson('/api/admin/newsletters', [
            'subject' => 'Új hírlevél',
            'content' => '<p>Hírlevél tartalma</p>',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->postJson('/api/admin/newsletters', [
            'subject' => 'Új hírlevél',
            'content' => '<p>Hírlevél tartalma</p>',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetStoreNewsletterTestData(): void {
    DB::table('users')->insert([
        [
            'id' => 1,
            'email' => 'user001@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 1,
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
