<?php

namespace App\Policies;

use App\ErrorCode;
use App\Models\User;
use App\Models\UserLoginAttempt;
use Carbon\Carbon;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserPolicy {
    public function confirmEmail(?User $sender, string $email, string $code): Response {
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

    public function login(?User $sender, string $email, string $password): Response {
        UserLoginAttempt::where('last_attempt', '<', Carbon::now()->subHour())
            ->delete();

        $user = User::with('loginAttempts')->firstWhere('email', '=', $email);

        if (is_null($user)) {
            return Response::denyWithStatus(401, ErrorCode::BAD_CREDENTIALS->value);
        }

        if (! $user->confirmed) {
            return Response::denyWithStatus(403, ErrorCode::USER_NOT_CONFIRMED->value);
        }

        $loginAttempts = $user->loginAttempts?->attempts ?? 0;

        if ($loginAttempts >= 3) {
            return Response::denyWithStatus(429, ErrorCode::TOO_MANY_LOGIN_ATTEMPTS->value);
        }

        $isPasswordCorrect = Hash::check($password, $user->password);

        if (! $isPasswordCorrect) {
            DB::table('users_login_attempts')->upsert(
                [
                    'user_id' => $user->id,
                    'attempts' => $loginAttempts + 1,
                    'last_attempt' => Carbon::now(),
                ],
                ['user_id'],
                ['attempts', 'last_attempt']
            );

            return Response::denyWithStatus(401, ErrorCode::BAD_CREDENTIALS->value);
        }

        if (
            $user->ip_address !== request()->ip() &&
            $user->last_active?->gt(Carbon::now()->subHour())
        ) {
            return Response::denyWithStatus(423, ErrorCode::USER_ALREADY_LOGGED_IN->value);
        }

        return Response::allow();
    }

    public function registerUser(?User $sender, string $email): Response {
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

    public function resendConfirmationEmail(?User $sender, ?User $user): Response {
        if (is_null($user)) {
            return Response::denyWithStatus(404, ErrorCode::EMAIL_NOT_FOUND->value);
        }

        if ($user->confirmed) {
            return Response::denyWithStatus(410, ErrorCode::USER_ALREADY_CONFIRMED->value);
        }

        return Response::allow();
    }

    public function resetPassword(?User $sender, ?User $user, string $code): Response {
        if (is_null($user) || ! $user->newPassword?->password_code) {
            return Response::denyWithStatus(400, ErrorCode::BAD_CREDENTIALS->value);
        }

        $isCodeCorrect = Hash::check($code, $user->newPassword->password_code);
        if (! $isCodeCorrect) {
            $user->newPassword()->delete();

            return Response::denyWithStatus(400, ErrorCode::BAD_CREDENTIALS->value);
        }

        $expired = $user->newPassword->issued_at->lt(Carbon::now()->subMinutes(30));
        if ($expired) {
            return Response::denyWithStatus(410, ErrorCode::CODE_EXPIRED->value);
        }

        return Response::allow();
    }

    public function revokeRegistration(?User $sender, string $email, string $code): Response {
        return $this->confirmEmail($sender, $email, $code);
    }
}
