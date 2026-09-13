<?php

use App\Mail\PendingRegistrationsReminder;
use Illuminate\Support\Facades\Mail;

describe('Send Pending Registrations Reminder', function () {
    beforeEach(function () {
        resetSendPendingRegistrationsReminderTestData();
    });

    test('mails the admin mailbox the sorted list of unconfirmed users', function () {
        Mail::fake();
        config(['mail.admin_address' => 'admin@zephyr.co.hu']);

        $this->artisan('zephyr:send-pending-registrations-reminder')->assertSuccessful();

        Mail::assertSent(PendingRegistrationsReminder::class, function (PendingRegistrationsReminder $mail) {
            return $mail->hasTo('admin@zephyr.co.hu')
                && $mail->pendingEmails === ['user002@example.com', 'user003@example.com'];
        });
    });

    test('confirmed users are never listed', function () {
        Mail::fake();

        $this->artisan('zephyr:send-pending-registrations-reminder')->assertSuccessful();

        Mail::assertSent(PendingRegistrationsReminder::class, function (PendingRegistrationsReminder $mail) {
            return ! in_array('user001@example.com', $mail->pendingEmails, true);
        });
    });

    test('sends nothing when there are no pending registrations', function () {
        Mail::fake();

        DB::table('users')->where('confirmed', 0)->delete();

        $this->artisan('zephyr:send-pending-registrations-reminder')->assertSuccessful();

        Mail::assertNothingSent();
    });
});

function resetSendPendingRegistrationsReminderTestData(): void {
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
            'email' => 'user003@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 0,
            'newsletter' => 0,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
        [
            'id' => 3,
            'email' => 'user002@example.com',
            'password' => Hash::make('abc123456'),
            'confirmed' => 0,
            'newsletter' => 0,
            'ip_address' => '127.0.0.1',
            'last_active' => '2026-02-08 21:39:00',
        ],
    ]);
}
