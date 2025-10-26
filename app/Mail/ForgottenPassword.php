<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ForgottenPassword extends Mailable {
    use Queueable, SerializesModels;

    public readonly string $email;

    public readonly string $code;

    /**
     * Create a new message instance.
     */
    public function __construct(string $email, string $code) {
        $this->email = urlencode($email);
        $this->code = urlencode($code);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope {
        return new Envelope(
            subject: '[Zephyr Bt.] Elfelejtett jelszó',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content {
        return new Content(
            view: 'mail.forgotten_password.html',
            text: 'mail.forgotten_password.text'
        );
    }
}
