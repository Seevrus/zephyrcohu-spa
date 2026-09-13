<?php

use App\Console\Commands\PruneExpiredRecords;
use App\Console\Commands\SendPendingRegistrationsReminder;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Schedule::command(PruneExpiredRecords::class)->dailyAt('03:00');
Schedule::command(SendPendingRegistrationsReminder::class)->dailyAt('06:00');
