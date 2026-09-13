<?php

use Illuminate\Console\Scheduling\Schedule;

describe('Schedule Registration', function () {
    test('both zephyr scheduled commands are registered', function () {
        $commands = collect(app(Schedule::class)->events())
            ->map(fn ($event) => $event->command)
            ->filter(fn (?string $command) => $command !== null);

        expect($commands->filter(fn (string $command) => str_contains($command, 'zephyr:send-pending-registrations-reminder')))->not->toBeEmpty();
        expect($commands->filter(fn (string $command) => str_contains($command, 'zephyr:prune-expired-records')))->not->toBeEmpty();
    });
});
