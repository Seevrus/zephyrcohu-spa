<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewsletterSent extends Mailable {
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $newsletterSubject,
        public readonly string $body,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope {
        return new Envelope(
            subject: $this->newsletterSubject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content {
        return new Content(
            view: 'mail.newsletter_sent.html',
            text: 'mail.newsletter_sent.text'
        );
    }
}
