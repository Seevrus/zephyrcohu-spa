<?php

namespace App\Http\Controllers;

use App\ErrorCode;
use App\Http\Requests\ConfirmEmailRequest;
use App\Http\Requests\CreateUserRequest;
use App\Http\Requests\ForgottenPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\ResendConfirmEmailRequest;
use App\Http\Resources\ErrorResource;
use App\Http\Resources\UserResource;
use App\Mail\ForgottenPassword;
use App\Mail\UserRegistered;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Throwable;

class UserController extends Controller {
    private function generate_code() {
        return rand(pow(10, 8), pow(10, 9) - 1);
    }

    public function confirmEmail(ConfirmEmailRequest $request) {
        try {
            $email = $request->email;
            $emailCode = (int) $request->code;

            $canConfirm = Gate::inspect('confirmEmail', [User::class, $email, $emailCode]);

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
            abort(500);
        }
    }

    public function login(LoginRequest $request) {
        try {
            $email = $request->email;
            $password = $request->password;

            $canLogin = Gate::inspect('login', [User::class, $email, $password]);

            if ($canLogin->denied()) {
                return response(
                    new ErrorResource($canLogin->status(), ErrorCode::from($canLogin->message())),
                    $canLogin->status()
                );
            }

            if (Auth::attempt(['email' => $email, 'password' => $password])) {
                $request->session()->regenerate();
                $user = Auth::user();

                return new UserResource($user->load('admin'));
            }

            return response(
                new ErrorResource(401, ErrorCode::BAD_CREDENTIALS)
            );
        } catch (Throwable $e) {
            if ($e instanceof RuntimeException) {
                throw new BadRequestException;
            }

            abort(500);
        }
    }

    public function logout(Request $request) {
        try {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        } catch (Throwable $e) {
            if ($e instanceof RuntimeException) {
                throw new BadRequestException;
            }

            abort(500);
        }
    }

    public function registerUser(CreateUserRequest $request) {
        try {
            $email = $request->email;
            $password = $request->password;
            $cookiesAccepted = $request->cookiesAccepted;
            $newsletter = $request->newsletter;

            $canCreate = Gate::inspect('registerUser', [User::class, $email]);

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
                'password' => Hash::make($password),
            ]);

            $emailCode = $this->generate_code();

            $newUser->newUser()->create([
                'user_id' => $newUser->id,
                'email_code' => $emailCode,
            ]);

            Mail::to($email)->send(new UserRegistered($email, $emailCode));

            $newUser->refresh();

            return new UserResource($newUser->load('admin'));
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function requestNewPassword(ForgottenPasswordRequest $request) {
        try {
            $email = $request->email;
            $user = User::with('admin')->firstWhere('email', $email);

            $canRequestPasswordChange = Gate::inspect('requestNewPassword', [User::class, $user]);

            if ($canRequestPasswordChange->denied()) {
                return response(
                    new ErrorResource($canRequestPasswordChange->status(), ErrorCode::from($canRequestPasswordChange->message())),
                    $canRequestPasswordChange->status()
                );
            }

            $passwordCode = $this->generate_code();

            $user->newPassword()->upsert([
                'issued_at' => Carbon::now(),
                'password_code' => $passwordCode,
            ], ['user_id'], ['issued_at', 'password_code']);

            Mail::to($email)->send(new ForgottenPassword($email, $passwordCode));

            return response(null, 201);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function resendConfirmEmail(ResendConfirmEmailRequest $request) {
        try {
            $email = $request->email;
            $user = User::firstWhere('email', $email);

            $canConfirm = Gate::inspect('resendConfirmationEmail', [User::class, $user]);

            if ($canConfirm->denied()) {
                return response(
                    new ErrorResource($canConfirm->status(), ErrorCode::from($canConfirm->message())),
                    $canConfirm->status()
                );
            }

            Mail::to($email)->send(new UserRegistered($email, $user->newUser->email_code));

            return null;
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function revokeRegistration(ConfirmEmailRequest $request) {
        try {
            $email = $request->email;
            $emailCode = (int) $request->code;

            $canRevoke = Gate::inspect('revokeRegistration', [User::class, $email, $emailCode]);

            if ($canRevoke->denied()) {
                return response(
                    new ErrorResource($canRevoke->status(), ErrorCode::from($canRevoke->message())),
                    $canRevoke->status()
                );
            }

            DB::table('users')->where('email', $email)->delete();

            return null;
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function session(Request $request) {
        try {
            $user = $request->user();

            return new UserResource($user->load('admin'));
        } catch (Throwable $e) {
            abort(500);
        }
    }
}
