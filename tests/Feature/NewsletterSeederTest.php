<?php

use App\Models\Newsletter;
use App\Models\User;
use Database\Seeders\NewsletterSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Support\Facades\DB;

test('seeds fully sent, partially sent and unsent newsletters to eligible users only', function () {
    $this->seed(UserSeeder::class);

    User::query()->update(['newsletter' => false]);
    $eligibleUserIds = User::limit(5)->pluck('id');
    User::whereIn('id', $eligibleUserIds)->update(['newsletter' => true]);

    $this->seed(NewsletterSeeder::class);

    $sentCounts = Newsletter::withCount('recipients')->pluck('recipients_count');

    expect($sentCounts)->toHaveCount(12)
        ->and($sentCounts->filter(fn (int $count) => $count === 5))->toHaveCount(5)
        ->and($sentCounts->filter(fn (int $count) => $count > 0 && $count < 5))->toHaveCount(4)
        ->and($sentCounts->filter(fn (int $count) => $count === 0))->toHaveCount(3)
        ->and(DB::table('users_newsletters')->whereNotIn('user_id', $eligibleUserIds)->exists())->toBeFalse()
        ->and(Newsletter::first()->content)->toContain('<p>');
});
