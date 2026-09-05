<?php

use App\Mail\AdminUpdatedUser;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

describe('Update User', function () {
    beforeEach(function () {
        Carbon::setTestNow('2026-02-28 21:59:40');
        resetUpdateUserTestData();
    });

    test('changes the email and mails both the new and the old address', function () {
        Mail::fake();
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/users/1', [
            'email' => 'new-address@example.com',
            'confirmed' => true,
            'newsletter' => false,
            'generatePassword' => false,
        ]);

        $response->assertStatus(200)->assertJson(['data' => [
            'id' => 1,
            'email' => 'new-address@example.com',
        ]]);

        $this->assertDatabaseHas('users', ['id' => 1, 'email' => 'new-address@example.com']);

        Mail::assertSent(AdminUpdatedUser::class, function (AdminUpdatedUser $mail) {
            return $mail->hasTo('new-address@example.com')
                && in_array('Új email: new-address@example.com', $mail->modifiedItems, true)
                && $mail->assertSeeInHtml('new-address@example.com')
                && $mail->assertSeeInText('new-address@example.com');
        });

        Mail::assertSent(AdminUpdatedUser::class, function (AdminUpdatedUser $mail) {
            return $mail->hasTo('user001@example.com');
        });

        Mail::assertSent(AdminUpdatedUser::class, 2);
    });

    test('generating a password sets a new hash, bumps password_set_at and mails the plain password', function () {
        Mail::fake();
        Sanctum::actingAs(User::find(2));
        $previousHash = User::find(1)->password;

        $response = $this->putJson('/api/admin/users/1', [
            'email' => 'user001@example.com',
            'confirmed' => true,
            'newsletter' => true,
            'generatePassword' => true,
        ]);

        $response->assertStatus(200);

        $user = User::find(1);
        expect($user->password)->not->toBe($previousHash);
        expect($user->password_set_at->equalTo(Carbon::now()))->toBeTrue();

        Mail::assertSent(AdminUpdatedUser::class, function (AdminUpdatedUser $mail) use ($user) {
            $passwordItem = collect($mail->modifiedItems)->first(
                fn (string $item) => str_starts_with($item, 'Új jelszó: ')
            );

            if ($passwordItem === null) {
                return false;
            }

            $plainPassword = substr($passwordItem, strlen('Új jelszó: '));

            return Hash::check($plainPassword, $user->password)
                && in_array(
                    'Kérjük, jelentkezzen be, és a profil oldalon módosítsa a jelszavát.',
                    $mail->modifiedItems,
                    true
                )
                && $mail->assertSeeInHtml($plainPassword)
                && $mail->assertSeeInText($plainPassword);
        });
    });

    test('confirming a user removes the pending registration row and mails the confirmation sentence', function () {
        Mail::fake();
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/users/3', [
            'email' => 'unconfirmed@example.com',
            'confirmed' => true,
            'newsletter' => false,
            'generatePassword' => false,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users', ['id' => 3, 'confirmed' => 1]);
        $this->assertDatabaseMissing('users_new', ['user_id' => 3]);

        Mail::assertSent(AdminUpdatedUser::class, fn (AdminUpdatedUser $mail) => in_array(
            'Regisztrációját visszaigazoltuk, mostantól elérhető honlapunk teljes funkcionalitása. Köszönjük!',
            $mail->modifiedItems,
            true
        ));
    });

    test('toggling the newsletter flag on mails the opt-in sentence', function () {
        Mail::fake();
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/users/1', [
            'email' => 'user001@example.com',
            'confirmed' => true,
            'newsletter' => true,
            'generatePassword' => false,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => 1, 'newsletter' => 1]);

        Mail::assertSent(AdminUpdatedUser::class, fn (AdminUpdatedUser $mail) => in_array(
            'Felvettük hírlevelünk címzettjei közé.',
            $mail->modifiedItems,
            true
        ));
    });

    test('toggling the newsletter flag off mails the opt-out sentence', function () {
        Mail::fake();
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/users/3', [
            'email' => 'unconfirmed@example.com',
            'confirmed' => false,
            'newsletter' => false,
            'generatePassword' => false,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => 3, 'newsletter' => 0]);

        Mail::assertSent(AdminUpdatedUser::class, fn (AdminUpdatedUser $mail) => in_array(
            'Ön a továbbiakban nem fog hírlevelet kapni tőlünk.',
            $mail->modifiedItems,
            true
        ));
    });

    test('rejects a submit that changes nothing at all', function () {
        Mail::fake();
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/users/1', [
            'email' => 'user001@example.com',
            'confirmed' => true,
            'newsletter' => false,
            'generatePassword' => false,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors([
            'email' => 'Az űrlapon nem került semmi módosításra.',
        ]);

        Mail::assertNothingSent();
    });

    test('rejects a duplicate email', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/users/1', [
            'email' => 'admin001@example.com',
            'confirmed' => true,
            'newsletter' => false,
            'generatePassword' => false,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['email']);
    });

    test('still persists the change and returns 200 when sending the notification mail fails', function () {
        Sanctum::actingAs(User::find(2));

        Mail::shouldReceive('to->send')->andThrow(new RuntimeException('smtp down'));

        $response = $this->putJson('/api/admin/users/1', [
            'email' => 'still-saved@example.com',
            'confirmed' => true,
            'newsletter' => false,
            'generatePassword' => false,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => 1, 'email' => 'still-saved@example.com']);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->putJson('/api/admin/users/999', [
            'email' => 'whoever@example.com',
            'confirmed' => true,
            'newsletter' => false,
            'generatePassword' => false,
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->putJson('/api/admin/users/1', [
            'email' => 'whoever@example.com',
            'confirmed' => true,
            'newsletter' => false,
            'generatePassword' => false,
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->putJson('/api/admin/users/1', [
            'email' => 'whoever@example.com',
            'confirmed' => true,
            'newsletter' => false,
            'generatePassword' => false,
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetUpdateUserTestData(): void {
    DB::table('users')->insert([
        [
            'id' => 1,
            'email' => 'user001@example.com',
            'password' => Hash::make('abc123456'),
            'password_set_at' => '2026-02-01 10:00:00',
            'confirmed' => 1,
            'newsletter' => 0,
            'ip_address' => null,
            'last_active' => null,
        ],
        [
            'id' => 2,
            'email' => 'admin001@example.com',
            'password' => Hash::make('abc123456'),
            'password_set_at' => '2026-02-01 10:00:00',
            'confirmed' => 1,
            'newsletter' => 0,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
        [
            'id' => 3,
            'email' => 'unconfirmed@example.com',
            'password' => Hash::make('abc123456'),
            'password_set_at' => '2026-02-01 10:00:00',
            'confirmed' => 0,
            'newsletter' => 1,
            'ip_address' => null,
            'last_active' => null,
        ],
    ]);

    DB::table('user_admins')->insert([
        'user_id' => 2,
    ]);

    DB::table('users_new')->insert([
        'user_id' => 3,
        'email_code' => 12345678,
    ]);
}
