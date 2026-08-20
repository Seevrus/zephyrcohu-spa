<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OfferRequested extends Mailable {
    use Queueable, SerializesModels;

    public readonly string $email;

    public readonly string $name;

    public readonly string $requestSubject;

    public readonly string $requestMessage;

    /**
     * Create a new message instance.
     */
    public function __construct(string $email, string $name, string $requestSubject, string $requestMessage) {
        $this->email = $email;
        $this->name = $name;
        $this->requestSubject = $requestSubject;
        $this->requestMessage = $requestMessage;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope {
        return new Envelope(
            subject: '[Zephyr Bt.] Árajánlatkérés érkezett',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content {
        return new Content(
            view: 'mail.offer_requested.html',
            text: 'mail.offer_requested.text'
        );
    }
}
