<?php

namespace App\Policies;

use App\CanValidateCsrf;
use App\ErrorCode;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\DB;

class UserPolicy {
    use CanValidateCsrf;

    public function confirm_user(?User $sender, string $email, int $code): Response {
        if (! $this->isCsrfValid()) {
            return $this->csrfErrorResponse();
        }

        $user = DB::table('users')
            ->select('users.confirmed', 'users_new.email_code')
            ->leftJoin('users_new', 'users.id', '=', 'users_new.user_id')
            ->where('users.email', '=', $email)
            ->first();

        if (is_null($user) || (! is_null($user->email_code) && $user->email_code != $code)) {
            return Response::denyWithStatus(404, ErrorCode::BAD_EMAIL_CODE->value);
        }

        if ($user->confirmed) {
            return Response::denyWithStatus(410, ErrorCode::USER_ALREADY_CONFIRMED->value);
        }

        return Response::allow();
    }

    public function create_user(?User $sender, string $email): Response {
        if (! $this->isCsrfValid()) {
            return $this->csrfErrorResponse();
        }

        $confirmed = DB::table('users')
            ->leftJoin('users_new_emails', 'users.id', '=', 'users_new_emails.user_id')
            ->where('users.email', '=', $email)
            ->orWhere('users_new_emails.new_email', '=', $email)
            ->value('users.confirmed');

        if (is_null($confirmed)) {
            return Response::allow();
        }

        if ($confirmed) {
            return Response::denyWithStatus(409, ErrorCode::USER_EXISTS->value);
        }

        return Response::denyWithStatus(409, ErrorCode::USER_NOT_CONFIRMED->value);
    }
}
