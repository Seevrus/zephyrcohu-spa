<?php

use Carbon\Carbon;

describe('Prune Expired Records', function () {
    beforeEach(function () {
        Carbon::setTestNowAndTimezone('2026-02-28 12:00:00', 'Europe/Budapest');
        resetPruneExpiredRecordsTestData();
    });

    test('deletes password codes older than a day and keeps newer ones', function () {
        $this->artisan('zephyr:prune-expired-records')->assertSuccessful();

        $this->assertDatabaseMissing('users_new_passwords', ['user_id' => 1]);
        $this->assertDatabaseHas('users_new_passwords', ['user_id' => 2]);
    });

    test('deletes email codes older than a day and keeps newer ones', function () {
        $this->artisan('zephyr:prune-expired-records')->assertSuccessful();

        $this->assertDatabaseMissing('users_new_emails', ['user_id' => 1]);
        $this->assertDatabaseHas('users_new_emails', ['user_id' => 2]);
    });

    test('deletes access tokens older than a day and keeps newer ones', function () {
        $this->artisan('zephyr:prune-expired-records')->assertSuccessful();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => 1]);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => 2]);
    });

    test('never touches pending registrations, which have no timestamp to prune by', function () {
        $this->artisan('zephyr:prune-expired-records')->assertSuccessful();

        $this->assertDatabaseHas('users_new', ['user_id' => 1]);
    });

    test('reports the pruned counts', function () {
        $this->artisan('zephyr:prune-expired-records')
            ->assertSuccessful()
            ->expectsOutputToContain('Pruned: 1 password codes, 1 email codes, 1 tokens.');
    });
});

function resetPruneExpiredRecordsTestData(): void {
    DB::table('users')->insert([
        ['id' => 1, 'email' => 'user001@example.com', 'password' => Hash::make('abc123456'), 'confirmed' => 1, 'newsletter' => 0, 'ip_address' => '127.0.0.1', 'last_active' => '2026-02-08 21:39:00'],
        ['id' => 2, 'email' => 'user002@example.com', 'password' => Hash::make('abc123456'), 'confirmed' => 1, 'newsletter' => 0, 'ip_address' => '127.0.0.1', 'last_active' => '2026-02-08 21:39:00'],
    ]);

    DB::table('users_new')->insert([
        'user_id' => 1,
        'email_code' => 'oldcode',
    ]);

    DB::table('users_new_passwords')->insert([
        ['user_id' => 1, 'password_code' => 'old', 'issued_at' => '2026-02-27 11:59:59'],
        ['user_id' => 2, 'password_code' => 'new', 'issued_at' => '2026-02-27 12:00:01'],
    ]);

    DB::table('users_new_emails')->insert([
        ['user_id' => 1, 'new_email' => 'old@example.com', 'email_code' => 'old', 'issued_at' => '2026-02-27 11:59:59'],
        ['user_id' => 2, 'new_email' => 'new@example.com', 'email_code' => 'new', 'issued_at' => '2026-02-27 12:00:01'],
    ]);

    DB::table('personal_access_tokens')->insert([
        ['id' => 1, 'tokenable_type' => 'App\\Models\\User', 'tokenable_id' => 1, 'name' => 'old', 'token' => hash('sha256', 'old'), 'created_at' => '2026-02-27 11:59:59'],
        ['id' => 2, 'tokenable_type' => 'App\\Models\\User', 'tokenable_id' => 2, 'name' => 'new', 'token' => hash('sha256', 'new'), 'created_at' => '2026-02-27 12:00:01'],
    ]);
}
