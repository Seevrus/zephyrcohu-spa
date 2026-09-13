<?php

namespace App\Console\Commands;

use App\Models\UserNewEmail;
use App\Models\UserNewPassword;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('zephyr:prune-expired-records')]
#[Description('Delete expired password/email codes and access tokens.')]
class PruneExpiredRecords extends Command {
    public function handle(): int {
        $threshold = now()->subDay();

        $passwords = UserNewPassword::where('issued_at', '<', $threshold)->delete();
        $emails = UserNewEmail::where('issued_at', '<', $threshold)->delete();
        $tokens = DB::table('personal_access_tokens')->where('created_at', '<', $threshold)->delete();

        $this->info("Pruned: {$passwords} password codes, {$emails} email codes, {$tokens} tokens.");

        return self::SUCCESS;
    }
}
