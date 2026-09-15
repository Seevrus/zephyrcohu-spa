<?php

use App\Console\Commands\PruneExpiredRecords;
use App\Console\Commands\SendPendingRegistrationsReminder;
use Illuminate\Support\Facades\Schedule;

Schedule::command(PruneExpiredRecords::class)->dailyAt('03:00');
Schedule::command(SendPendingRegistrationsReminder::class)->dailyAt('06:00');
