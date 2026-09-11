<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNewsletterRequest;
use App\Http\Resources\AdminNewsletterRecipientResource;
use App\Http\Resources\AdminNewsletterResource;
use App\Mail\NewsletterSent;
use App\Models\Newsletter;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class AdminNewsletterController extends Controller {
    public function getNewsletters() {
        try {
            $eligibleCount = User::where('newsletter', true)->where('confirmed', true)->count();

            $newsletters = Newsletter::select(['id', 'subject', 'created_at'])
                ->withCount(['recipients as sent_count'])
                ->orderBy('created_at', 'desc')
                ->get();

            $newsletters->each(fn (Newsletter $newsletter) => $newsletter->recipient_count = $eligibleCount);

            return AdminNewsletterResource::collection($newsletters);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function storeNewsletter(StoreNewsletterRequest $request) {
        try {
            $newsletter = Newsletter::create([
                'subject' => $request->validated('subject'),
                'content' => $request->validated('content'),
            ]);

            $newsletter->recipient_count = User::where('newsletter', true)->where('confirmed', true)->count();
            $newsletter->sent_count = 0;

            return (new AdminNewsletterResource($newsletter))->response()->setStatusCode(201);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function getNewsletter(Newsletter $newsletter) {
        try {
            $eligibleCount = User::where('newsletter', true)->where('confirmed', true)->count();

            $newsletter->loadCount(['recipients as sent_count']);
            $newsletter->recipient_count = $eligibleCount;

            return new AdminNewsletterResource($newsletter);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function getRecipients(Newsletter $newsletter) {
        try {
            $recipients = User::where('newsletter', true)
                ->where('confirmed', true)
                ->whereDoesntHave('newsletters', fn ($query) => $query->where('newsletters.id', $newsletter->id))
                ->orderBy('email')
                ->get();

            return AdminNewsletterRecipientResource::collection($recipients);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function sendToRecipient(Newsletter $newsletter, User $user) {
        if (! $user->newsletter || ! $user->confirmed) {
            abort(404);
        }

        $alreadySent = DB::table('users_newsletters')
            ->where(['user_id' => $user->id, 'newsletter_id' => $newsletter->id])
            ->exists();

        if ($alreadySent) {
            return response(null, 204);
        }

        try {
            Mail::to($user->email)->send(new NewsletterSent($newsletter->subject, $newsletter->content));

            DB::table('users_newsletters')->insertOrIgnore([
                'user_id' => $user->id,
                'newsletter_id' => $newsletter->id,
            ]);

            return response(null, 204);
        } catch (Throwable $e) {
            Log::error('Newsletter: mail failed to send.', [
                'newsletter_id' => $newsletter->id,
                'user_id' => $user->id,
                'message' => $e->getMessage(),
            ]);

            abort(500);
        }
    }
}
