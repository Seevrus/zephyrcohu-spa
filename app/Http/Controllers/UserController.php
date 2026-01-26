<?php

namespace App\Http\Controllers;

use App\ErrorCode;
use App\Http\Requests\ConfirmEmailRequest;
use App\Http\Requests\CreateUserRequest;
use App\Http\Requests\ForgottenPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\ResendConfirmEmailRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\UpdateProfileEmailRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\ErrorResource;
use App\Http\Resources\UserResource;
use App\Mail\EmailUpdateRequested;
use App\Mail\ForgottenPassword;
use App\Mail\UserDeleted;
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
use Str;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Throwable;

class UserController extends Controller {
    private function generate_code() {
        return Str::random(64);
    }

    public function confirmEmail(ConfirmEmailRequest $request) {
        try {
            $email = $request->email;
            $emailCode = $request->code;

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

    public function deleteProfile(Request $request) {
        try {
            $user = $request->user();
            $email = $user->email;

            $user->delete();

            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            Mail::to($email)->send(new UserDeleted);

            return response(null, 204);
        } catch (Throwable $e) {
            if ($e instanceof RuntimeException) {
                throw new BadRequestException;
            }

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

                $user->ip_address = request()->ip();
                $user->last_active = Carbon::now();
                $user->save();

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
            $user = Auth::user();
            $user->ip_address = null;
            $user->save();

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

            if ($user && ! $user->admin) {
                $passwordCode = $this->generate_code();

                $user->newPassword()->upsert([
                    'issued_at' => Carbon::now(),
                    'password_code' => Hash::make($passwordCode),
                ], ['user_id'], ['issued_at', 'password_code']);

                Mail::to($email)->send(new ForgottenPassword($email, $passwordCode));
            }

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

    public function resetPassword(ResetPasswordRequest $request) {
        try {
            $email = $request->email;
            $emailCode = $request->code;
            $newPassword = $request->password;

            $user = User::with('newPassword')->firstWhere('email', $email);

            $canResetPassword = Gate::inspect('resetPassword', [User::class, $user, $emailCode]);

            if ($canResetPassword->denied()) {
                return response(
                    new ErrorResource($canResetPassword->status(), ErrorCode::from($canResetPassword->message())),
                    $canResetPassword->status()
                );
            }

            $user->password = Hash::make($newPassword);
            $user->password_set_at = Carbon::now();
            $user->newPassword()?->delete();
            $user->save();

            if (Auth::attempt(['email' => $email, 'password' => $newPassword])) {
                $request->session()->regenerate();
                $user = Auth::user();

                return new UserResource($user->load('admin'));
            }

            // don't think this is possible, but let's return something anyway
            return response(
                new ErrorResource(401, ErrorCode::BAD_CREDENTIALS)
            );
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function revokeRegistration(ConfirmEmailRequest $request) {
        try {
            $email = $request->email;
            $emailCode = $request->code;

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

    public function updateConfirmNewEmail(UpdateProfileEmailRequest $request) {
        try {
            $sender = $request->user();

            $email = $request->email;
            $emailCode = $request->code;
            $password = $request->password;

            $user = User::whereRelation('newEmail', 'new_email', '=', $email)->first();

            $canUpdateEmail = Gate::inspect('confirmNewEmail', [User::class, $user, $emailCode, $password]);
            if ($canUpdateEmail->denied()) {
                return response(
                    new ErrorResource($canUpdateEmail->status(), ErrorCode::from($canUpdateEmail->message())),
                    $canUpdateEmail->status()
                );
            }

            $user->email = $email;
            $user->newEmail()->delete();
            $user->save();

            if ($sender) {
                $request->session()->regenerate();
            }

            return new UserResource($user->load('admin'));
        } catch (Throwable $e) {
            if ($e instanceof RuntimeException) {
                throw new BadRequestException;
            }

            abort(500);
        }
    }

    public function updateProfile(UpdateProfileRequest $request) {
        try {
            $user = $request->user();

            $currentEmail = $user->email;
            $currentNewsletter = $user->newsletter;

            $email = $request->email;
            $password = $request->password;
            $newsletter = $request->newsletter;

            if ($email && $currentEmail != $email) {
                $emailCode = $this->generate_code();

                $user->newEmail()->upsert([
                    'new_email' => $email,
                    'email_code' => Hash::make($emailCode),
                    'issued_at' => Carbon::now(),
                ], ['user_id'], ['new_email', 'email_code', 'issued_at']);

                Mail::to($email)->send(new EmailUpdateRequested($email, $emailCode));
            }

            if ($password) {
                $user->password = Hash::make($password);
                $user->password_set_at = Carbon::now();
            }

            if (! is_null($newsletter) && $currentNewsletter != $newsletter) {
                $user->newsletter = (bool) $newsletter;
            }

            $user->save();

            return new UserResource($user->load('admin'));
        } catch (Throwable $e) {
            abort(500);
        }
    }
}
