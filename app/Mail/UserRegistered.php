<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserRegistered extends Mailable {
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
            subject: '[Zephyr Bt.] Új regisztráció a zephyr.co.hu weboldalon',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content {
        return new Content(
            view: 'mail.user_registered.html',
            text: 'mail.user_registered.text'
        );
    }
}
