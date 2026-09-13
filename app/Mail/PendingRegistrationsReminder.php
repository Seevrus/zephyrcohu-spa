<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PendingRegistrationsReminder extends Mailable {
    use Queueable, SerializesModels;

    /**
     * @param  string[]  $pendingEmails
     */
    public function __construct(
        public readonly array $pendingEmails,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope {
        return new Envelope(
            subject: 'Megerősítésre váró felhasználók',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content {
        return new Content(
            view: 'mail.pending_registrations_reminder.html',
            text: 'mail.pending_registrations_reminder.text',
            with: [
                'pendingEmails' => $this->pendingEmails,
            ],
        );
    }
}
