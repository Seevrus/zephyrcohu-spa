<?php

use App\Mail\AdminMessage;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

describe('Send User Email', function () {
    beforeEach(function () {
        resetSendUserEmailTestData();
    });

    test('sends the given subject and body to the user address', function () {
        Mail::fake();
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/users/1/email', [
            'subject' => 'Kapcsolatfelvétel',
            'body' => '<p>Tisztelt Ügyfelünk, <strong>fontos</strong> üzenetünk van.</p>',
        ]);

        $response->assertStatus(204)->assertNoContent();

        Mail::assertSent(AdminMessage::class, function (AdminMessage $mail) {
            return $mail->hasTo('user001@example.com')
                && $mail->mailSubject === 'Kapcsolatfelvétel'
                && $mail->assertSeeInHtml('fontos')
                && $mail->assertSeeInText('fontos');
        });
    });

    test('returns 422 when the subject is missing', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/users/1/email', [
            'body' => 'Üzenet szövege.',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['subject']);
    });

    test('returns 422 when the body is missing', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/users/1/email', [
            'subject' => 'Kapcsolatfelvétel',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['body']);
    });

    test('returns 500 when the mailer throws, and logs why', function () {
        Sanctum::actingAs(User::find(2));

        Mail::shouldReceive('to->send')->andThrow(new RuntimeException('smtp down'));

        Log::shouldReceive('error')
            ->once()
            ->with('Admin message: mail failed to send.', [
                'user_id' => 1,
                'message' => 'smtp down',
            ]);

        $response = $this->postJson('/api/admin/users/1/email', [
            'subject' => 'Kapcsolatfelvétel',
            'body' => 'Üzenet szövege.',
        ]);

        $response->assertStatus(500)->assertJson([
            'status' => 500,
            'code' => 'INTERNAL_SERVER_ERROR',
        ]);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/users/999/email', [
            'subject' => 'Kapcsolatfelvétel',
            'body' => 'Üzenet szövege.',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->postJson('/api/admin/users/1/email', [
            'subject' => 'Kapcsolatfelvétel',
            'body' => 'Üzenet szövege.',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->postJson('/api/admin/users/1/email', [
            'subject' => 'Kapcsolatfelvétel',
            'body' => 'Üzenet szövege.',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetSendUserEmailTestData(): void {
    DB::table('users')->insert([
        [
            'id' => 1,
            'email' => 'user001@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 0,
            'ip_address' => null,
            'last_active' => null,
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
