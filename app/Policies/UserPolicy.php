<?php

namespace App\Policies;

use App\Http\Requests\ErrorCode;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\DB;

class UserPolicy {
    public function create_user(?User $sender, string $email): Response {
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
