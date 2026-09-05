<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminUpdatedUser extends Mailable {
    use Queueable, SerializesModels;

    /**
     * @param  array<int, string>  $modifiedItems
     */
    public function __construct(public readonly array $modifiedItems) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope {
        return new Envelope(
            subject: 'Adatait módosítottuk',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content {
        return new Content(
            view: 'mail.admin_updated_user.html',
            text: 'mail.admin_updated_user.text'
        );
    }
}
