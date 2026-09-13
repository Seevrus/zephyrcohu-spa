<?php

namespace App\Console\Commands;

use App\Mail\PendingRegistrationsReminder;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

#[Signature('zephyr:send-pending-registrations-reminder')]
#[Description('Mail the admin mailbox the list of users whose registration is still unconfirmed.')]
class SendPendingRegistrationsReminder extends Command {
    public function handle(): int {
        $pendingEmails = User::where('confirmed', false)->orderBy('email')->pluck('email');

        if ($pendingEmails->isEmpty()) {
            $this->info('No pending registrations.');

            return self::SUCCESS;
        }

        Mail::to(config('mail.admin_address'))
            ->send(new PendingRegistrationsReminder($pendingEmails->all()));

        return self::SUCCESS;
    }
}
