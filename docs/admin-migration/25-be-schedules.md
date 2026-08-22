# Task 25 — BE: scheduled commands (registration reminders + cleanup)

**Type:** Backend
**Depends on:** —  (independent of the admin API; can be done at any time)
**Legacy source:** `src_cron/send_reminders.php`, `src_cron/clean_db.php`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

Replace the two legacy cron scripts with Laravel artisan commands and schedule entries
(decision D10).

## Files

- Create: `app/Console/Commands/SendPendingRegistrationsReminder.php`
- Create: `app/Console/Commands/PruneExpiredRecords.php`
- Create: `app/Mail/PendingRegistrationsReminder.php`
  (+ views `resources/views/mail/pending_registrations_reminder/{html,text}.blade.php`)
- Modify: `routes/console.php` — the two `Schedule::command(...)` entries
- Modify: `.env.example` (and mention `.env` in the journal) — `ZEPHYR_ADMIN_EMAIL`
- Modify: `config/mail.php` — an `admin_address` entry reading that env var
- Create: `tests/Feature/Console/SendPendingRegistrationsReminderTest.php`
- Create: `tests/Feature/Console/PruneExpiredRecordsTest.php`

`app/Console/Commands/` does not exist yet; `php artisan make:command` creates it. That is the
framework's standard location, so it does not count as inventing a new base folder.

## 1. `zephyr:send-pending-registrations-reminder`

Legacy behaviour (`send_reminders.php`): every day, if there are users whose registration is not
confirmed, mail the list of their email addresses to the Zephyr mailbox
(`zephyr.bt@gmail.com` in the legacy script — read it from config instead).

```php
$pendingEmails = User::where('confirmed', false)->orderBy('email')->pluck('email');

if ($pendingEmails->isEmpty()) {
    $this->info('No pending registrations.');
    return self::SUCCESS;
}

Mail::to(config('mail.admin_address'))->send(new PendingRegistrationsReminder($pendingEmails->all()));
```

Mail subject: "Megerősítésre váró felhasználók" (legacy). The view lists the addresses, matching
`src_cron/reminder_email.html`.

Config addition:

```php
// config/mail.php
'admin_address' => env('ZEPHYR_ADMIN_EMAIL', env('MAIL_FROM_ADDRESS')),
```

Schedule in `routes/console.php`:

```php
Schedule::command('zephyr:send-pending-registrations-reminder')->dailyAt('06:00');
```

## 2. `zephyr:prune-expired-records`

Legacy behaviour (`clean_db.php`): delete rows older than one day from the password-code table,
the API token table and the swagger table. The SPA has no swagger table; its equivalents are:

| Legacy | New | Column |
|---|---|---|
| `felhasznalo_ujjelszo` | `users_new_passwords` | `issued_at` |
| — | `users_new_emails` | `issued_at` |
| `personal_access_tokens` | `personal_access_tokens` | `created_at` |
| `swagger` | *(none — dropped)* | — |

```php
$threshold = now()->subDay();

$passwords = UserNewPassword::where('issued_at', '<', $threshold)->delete();
$emails = UserNewEmail::where('issued_at', '<', $threshold)->delete();
$tokens = DB::table('personal_access_tokens')->where('created_at', '<', $threshold)->delete();

$this->info("Pruned: {$passwords} password codes, {$emails} email codes, {$tokens} tokens.");
```

`users_new` (pending registrations) has **no** timestamp column and is deliberately **not**
pruned — deleting it would silently break a pending registration. Say so in a code comment and in
the journal.

Schedule:

```php
Schedule::command('zephyr:prune-expired-records')->dailyAt('03:00');
```

## Steps

- [ ] **Step 1:** `php artisan make:command SendPendingRegistrationsReminder --no-interaction`
      and `php artisan make:command PruneExpiredRecords --no-interaction`; set their
      `$signature` to the names above and write real `$description`s.
- [ ] **Step 2:** Write `SendPendingRegistrationsReminderTest` first (cases below), then the
      command and its mailable/views.
- [ ] **Step 3:** Write `PruneExpiredRecordsTest`, then the command.
- [ ] **Step 4:** Add both `Schedule::command(...)` lines and assert they are registered:
      `$this->artisan('schedule:list')` output contains both signatures — or inspect
      `app(Schedule::class)->events()`. Pick one and keep it in a test so a lost schedule entry
      fails the suite.
- [ ] **Step 5:** Document the host cron entry in the journal — the server still needs
      `* * * * * cd /path && php artisan schedule:run >> /dev/null 2>&1` for any of this to fire.
      If the production host cannot run a per-minute cron, note that both commands can also be
      invoked directly by the existing cron mechanism (`php artisan zephyr:...` once a day).
- [ ] **Step 6:** Pint, self review, journal, tick Task 25.

## Tests to write

`SendPendingRegistrationsReminderTest`:

- with pending users, sends one mail to `config('mail.admin_address')` listing every pending
  address, sorted
- with no pending users, sends nothing and exits successfully
- confirmed users are never listed
- run it through `$this->artisan('zephyr:send-pending-registrations-reminder')->assertSuccessful()`
  with `Mail::fake()`

`PruneExpiredRecordsTest`:

- deletes `users_new_passwords` / `users_new_emails` rows older than a day and keeps newer ones
  (freeze time with `Carbon::setTestNowAndTimezone`)
- deletes `personal_access_tokens` older than a day
- leaves `users_new` untouched
- reports the counts in its output (`->expectsOutputToContain(...)`)

Plus one test asserting both commands appear in the schedule.

## Verification

```bash
php artisan test --compact --filter=Console
php artisan schedule:list
vendor/bin/pint --dirty --format agent
```

## Self review

- [ ] Neither command touches `users_new`.
- [ ] Both commands are idempotent and safe to run twice in a row.
- [ ] The reminder recipient comes from config, not a hard-coded address.
- [ ] Times are chosen so the two commands do not overlap.
- [ ] The schedule registration is covered by a test, not just by reading the file.

## Done when

Both commands run, their tests pass, `schedule:list` shows them, Pint is clean, journal updated
(including the host cron note), work **left uncommitted**.
