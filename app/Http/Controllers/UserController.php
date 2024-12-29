<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateUserRequest;
use App\Http\Requests\ErrorCode;
use App\Http\Resources\ErrorResource;
use App\Http\Resources\UserResource;
use App\Mail\UserRegistered;
use App\Models\User;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class UserController extends Controller {
    private $password_max_lifetime = 90 * 24 * 60 * 60;

    private function generate_code() {
        return rand(pow(10, 9), pow(10, 10) - 1);
    }

    public function create_user(CreateUserRequest $request) {
        try {
            $email = $request->email;
            $password = $request->password;
            $cookies = $request->cookies;
            $newsletter = $request->newsletter;

            $existingUser = DB::table('users')
                ->select('users.email', 'users.confirmed', 'users_new_emails.new_email', 'users_new.email_code')
                ->join('users_new', 'users.id', '=', 'users_new.user_id')
                ->join('users_new_emails', 'users.id', '=', 'users_new_emails.user_id')
                ->where('users.email', '=', $email)
                ->orWhere('users_new_emails.new_email', '=', $email)
                ->first();

            if ($existingUser) {
                if (($existingUser->email && $existingUser->confirmed) || ($existingUser->new_email)) {
                    return new ErrorResource(409, ErrorCode::USER_EXISTS);
                } else if ($existingUser->email_code) {
                    return new ErrorResource(409, ErrorCode::USER_NOT_CONFIRMED);
                }
            }

            $new_user = User::create([
                'email' => $email,
                'cookies' => $cookies,
                'newsletter' => $newsletter,
            ]);

            $new_user->passwords()->create([
                'user_id' => $new_user->id,
                'password' => Hash::make($password),
            ]);

            $email_code = $this->generate_code();

            $new_user->newUser()->create([
                'user_id' => $new_user->id,
                'email_code' => $email_code,
            ]);

            Mail::to($email)->queue(new UserRegistered($email_code));

            return new UserResource($new_user);
        } catch (Exception $e) {
            if (
                $e instanceof UnauthorizedHttpException
                || $e instanceof AuthorizationException
            ) {
                throw $e;
            }

            throw new BadRequestException;
        }
    }
}
