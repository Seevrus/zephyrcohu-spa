<?php

namespace App\Http\Controllers;

use App\ErrorCode;
use App\Http\Requests\ConfirmEmailRequest;
use App\Http\Requests\CreateUserRequest;
use App\Http\Resources\ErrorResource;
use App\Http\Resources\UserResource;
use App\Mail\UserRegistered;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Throwable;

class UserController extends Controller {
    private $password_max_lifetime = 90 * 24 * 60 * 60;

    private function generate_code() {
        return rand(pow(10, 8), pow(10, 9) - 1);
    }

    public function confirm_email(ConfirmEmailRequest $request) {
        try {
            $email = $request->email;
            $emailCode = (int) $request->code;

            $canConfirm = Gate::inspect('confirm_user', [User::class, $email, $emailCode]);

            if ($canConfirm->denied()) {
                return response(
                    new ErrorResource($canConfirm->status(), ErrorCode::from($canConfirm->message())),
                    $canConfirm->status()
                );
            }

            $user = User::with('admin')->where('email', $email)->firstOrFail();
            $user->confirmed = true;
            $user->newUser()->delete();
            $user->save();

            return new UserResource($user);
        } catch (Throwable $e) {
            if (
                $e instanceof UnauthorizedHttpException
                || $e instanceof AuthorizationException
            ) {
                throw $e;
            }

            throw new BadRequestHttpException;
        }
    }

    public function create_user(CreateUserRequest $request) {
        try {
            $email = $request->email;
            $password = $request->password;
            $cookiesAccepted = $request->cookiesAccepted;
            $newsletter = $request->newsletter;

            $canCreate = Gate::inspect('create_user', [User::class, $email]);

            if ($canCreate->denied()) {
                return response(
                    new ErrorResource($canCreate->status(), ErrorCode::from($canCreate->message())),
                    $canCreate->status()
                );
            }

            $newUser = User::create([
                'email' => $email,
                'cookies' => $cookiesAccepted,
                'newsletter' => $newsletter,
            ]);

            $newUser->passwords()->create([
                'user_id' => $newUser->id,
                'password' => Hash::make($password),
            ]);

            $emailCode = $this->generate_code();

            $newUser->newUser()->create([
                'user_id' => $newUser->id,
                'email_code' => $emailCode,
            ]);

            Mail::to($email)->queue(new UserRegistered($emailCode));

            return new UserResource($newUser->load('admin'));
        } catch (Throwable $e) {
            if (
                $e instanceof UnauthorizedHttpException
                || $e instanceof AuthorizationException
            ) {
                throw $e;
            }

            throw new BadRequestHttpException;
        }
    }
}
