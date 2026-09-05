<?php

use App\Mail\AdminDeletedUser;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

describe('Delete User', function () {
    beforeEach(function () {
        Carbon::setTestNow('2026-02-28 21:59:40');
        resetDeleteUserTestData();
    });

    test('deletes the user and their dependent rows, mailing the asked-for wording', function () {
        Mail::fake();
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/users/1', [
            'reason' => 'asked',
            'subject' => 'Regisztráció törölve',
        ]);

        $response->assertStatus(204)->assertNoContent();

        $this->assertDatabaseMissing('users', ['id' => 1]);
        $this->assertDatabaseMissing('users_new', ['user_id' => 1]);

        Mail::assertSent(AdminDeletedUser::class, function (AdminDeletedUser $mail) {
            return $mail->hasTo('user001@example.com')
                && $mail->mailSubject === 'Regisztráció törölve'
                && str_contains($mail->reasonText, 'minden adatot töröltünk')
                && $mail->assertSeeInHtml('minden adatot')
                && $mail->assertSeeInText('minden adatot');
        });
    });

    test('mails the custom reason wording, including the admin-provided text', function () {
        Mail::fake();
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/users/1', [
            'reason' => 'custom',
            'customReason' => 'ismétlődő regisztráció',
            'subject' => 'Regisztráció törölve',
        ]);

        $response->assertStatus(204);

        Mail::assertSent(AdminDeletedUser::class, function (AdminDeletedUser $mail) {
            return str_contains($mail->reasonText, 'ismétlődő regisztráció')
                && $mail->assertSeeInHtml('ismétlődő regisztráció')
                && $mail->assertSeeInText('ismétlődő regisztráció');
        });
    });

    test('rejects a custom reason without the custom reason text', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/users/1', [
            'reason' => 'custom',
            'subject' => 'Regisztráció törölve',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['customReason']);
    });

    test('an admin cannot delete their own account', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/users/2', [
            'reason' => 'asked',
            'subject' => 'Regisztráció törölve',
        ]);

        $response->assertStatus(403)->assertJson([
            'status' => 403,
            'code' => 'GENERIC_FORBIDDEN',
        ]);

        $this->assertDatabaseHas('users', ['id' => 2]);
    });

    test('an admin cannot delete another admin', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/users/4', [
            'reason' => 'asked',
            'subject' => 'Regisztráció törölve',
        ]);

        $response->assertStatus(403)->assertJson([
            'status' => 403,
            'code' => 'GENERIC_FORBIDDEN',
        ]);

        $this->assertDatabaseHas('users', ['id' => 4]);
    });

    test('returns 404 for an unknown id', function () {
        Sanctum::actingAs(User::find(2));

        $response = $this->deleteJson('/api/admin/users/999', [
            'reason' => 'asked',
            'subject' => 'Regisztráció törölve',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a guest', function () {
        $response = $this->deleteJson('/api/admin/users/1', [
            'reason' => 'asked',
            'subject' => 'Regisztráció törölve',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });

    test('returns 404 for a logged in non-admin user', function () {
        Sanctum::actingAs(User::find(1));

        $response = $this->deleteJson('/api/admin/users/1', [
            'reason' => 'asked',
            'subject' => 'Regisztráció törölve',
        ]);

        $response->assertStatus(404)->assertJson([
            'status' => 404,
            'code' => 'GENERIC_NOT_FOUND',
        ]);
    });
});

function resetDeleteUserTestData(): void {
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
        [
            'id' => 4,
            'email' => 'admin002@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 1,
            'newsletter' => 0,
            'ip_address' => null,
            'last_active' => null,
        ],
    ]);

    DB::table('user_admins')->insert([
        ['user_id' => 2],
        ['user_id' => 4],
    ]);

    DB::table('users_new')->insert([
        'user_id' => 1,
        'email_code' => 12345678,
    ]);
}
