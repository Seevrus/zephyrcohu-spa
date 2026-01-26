<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailUpdateRequested extends Mailable {
    use Queueable, SerializesModels;

    public readonly string $email;

    public readonly string $code;

    /**
     * Create a new message instance.
     */
    public function __construct(string $email, string $code) {
        $this->email = $email;
        $this->code = $code;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope {
        return new Envelope(
            subject: '[Zephyr Bt.] Új email cím aktiválása',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content {
        return new Content(
            view: 'mail.email_update_requested.html',
            text: 'mail.email_update_requested.text'
        );
    }
}
