<?php

use App\Mail\OfferRequested;

describe('Request offer request', function () {
    test('checks for required fields', function () {
        $response = $this->postJson('/api/offers/request', []);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.required (and 3 more errors)',
            'errors' => [
                'name' => ['validation.required'],
                'email' => ['validation.required'],
                'subject' => ['validation.required'],
                'message' => ['validation.required'],
            ],
        ]);
    });

    test('email should be well-formed', function () {
        $request = [
            'name' => 'Teszt Elek',
            'email' => 'hello-there',
            'subject' => 'other',
            'message' => 'Kérem hívjanak vissza.',
        ];
        $response = $this->postJson('/api/offers/request', $request);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'validation.email',
            'errors' => [
                'email' => ['validation.email'],
            ],
        ]);
    });

    test('subject should be a valid enum value', function () {
        $request = [
            'name' => 'Teszt Elek',
            'email' => 'teszt@example.com',
            'subject' => 'not-a-real-subject',
            'message' => 'Kérem hívjanak vissza.',
        ];
        $response = $this->postJson('/api/offers/request', $request);

        $response->assertStatus(422)->assertExactJson([
            'message' => 'The selected subject is invalid.',
            'errors' => [
                'subject' => ['The selected subject is invalid.'],
            ],
        ]);
    });
});

describe('Request offer controller', function () {
    test('sends an offer request email to the central address', function () {
        Mail::fake();

        $request = [
            'name' => 'Teszt Elek',
            'email' => 'teszt@example.com',
            'subject' => 'integra-new-client-general',
            'message' => 'Kérem hívjanak vissza.',
        ];
        $response = $this->postJson('/api/offers/request', $request);

        $response->assertStatus(201);

        Mail::assertSent(OfferRequested::class, function ($mail) {
            return $mail->hasTo(config('mail.from.address'))
                && $mail->name === 'Teszt Elek'
                && $mail->email === 'teszt@example.com'
                && $mail->requestSubject === 'Zephyr INTEGRA - új ügyfél, cégügyvitel'
                && $mail->requestMessage === 'Kérem hívjanak vissza.';
        });
    });
});
