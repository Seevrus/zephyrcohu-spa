<?php

use App\Mail\NewsletterSent;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

describe('Send Newsletter', function () {
    beforeEach(function () {
        resetSendNewsletterTestData();
    });

    test('sends the newsletter to the recipient and records the pivot row', function () {
        Mail::fake();
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/newsletters/1/recipients/3');

        $response->assertStatus(204)->assertNoContent();

        Mail::assertSent(NewsletterSent::class, function (NewsletterSent $mail) {
            return $mail->hasTo('user002@example.com')
                && $mail->newsletterSubject === 'A hírlevél'
                && $mail->assertSeeInHtml('A tartalom')
                && $mail->assertSeeInText('A tartalom')
                && $mail->assertSeeInHtml('profil')
                && $mail->assertSeeInText('https://zephyr.co.hu/profil');
        });

        $this->assertDatabaseHas('users_newsletters', ['user_id' => 3, 'newsletter_id' => 1]);
    });

    test('a second call for the same pair sends nothing and still returns 204', function () {
        Mail::fake();
        Sanctum::actingAs(User::find(2));

        $this->postJson('/api/admin/newsletters/1/recipients/1')->assertStatus(204);

        Mail::fake();

        $response = $this->postJson('/api/admin/newsletters/1/recipients/1');

        $response->assertStatus(204)->assertNoContent();
        Mail::assertNothingSent();
    });

    test('returns 404 for an opted-out user', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/newsletters/1/recipients/5');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for an unconfirmed user', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/newsletters/1/recipients/6');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for an unknown user', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/newsletters/1/recipients/999');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for an unknown newsletter', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->postJson('/api/admin/newsletters/999/recipients/1');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 500 and leaves no pivot row when the mailer throws', function () {
        Sanctum::actingAs(User::find(2));

        Mail::shouldReceive('to->send')->andThrow(new RuntimeException('smtp down'));

        Log::shouldReceive('error')
            ->once()
            ->with('Newsletter: mail failed to send.', [
                'newsletter_id' => 1,
                'user_id' => 3,
                'message' => 'smtp down',
            ]);

        $response = $this->postJson('/api/admin/newsletters/1/recipients/3');

        $response->assertStatus(500)->assertJson([
            'status' => 500,
            'code' => 'INTERNAL_SERVER_ERROR',
        ]);

        $this->assertDatabaseMissing('users_newsletters', ['user_id' => 3, 'newsletter_id' => 1]);
    });

    test('70 consecutive sends in one minute all succeed', function () {
        Mail::fake();
        Sanctum::actingAs(User::find(2));

        resetSendNewsletterManyRecipientsTestData();

        for ($id = 100; $id < 170; $id++) {
            $this->postJson("/api/admin/newsletters/1/recipients/{$id}")->assertStatus(204);
        }
    });

    test('returns 404 for a guest', function () {
        $response = $this->postJson('/api/admin/newsletters/1/recipients/3');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->postJson('/api/admin/newsletters/1/recipients/3');

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetSendNewsletterTestData(): void {
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
        [
            'id' => 3,
            'email' => 'user002@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 1,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
        [
            'id' => 5,
            'email' => 'user004@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 0,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
        [
            'id' => 6,
            'email' => 'user005@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 0,
            'newsletter' => 1,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
    ]);

    DB::table('user_admins')->insert([
        'user_id' => 2,
    ]);

    DB::table('newsletters')->insert([
        'id' => 1,
        'subject' => 'A hírlevél',
        'content' => '<p>A tartalom</p>',
        'created_at' => '2026-02-08 21:31:00',
        'updated_at' => '2026-02-08 21:31:00',
    ]);
}

function resetSendNewsletterManyRecipientsTestData(): void {
    $users = [];

    for ($id = 100; $id < 170; $id++) {
        $users[] = [
            'id' => $id,
            'email' => "user{$id}@example.com",
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 1,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ];
    }

    DB::table('users')->insert($users);
}
