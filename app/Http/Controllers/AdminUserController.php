<?php

namespace App\Http\Controllers;

use App\ErrorCode;
use App\Http\Requests\DeleteUserRequest;
use App\Http\Requests\SendUserEmailRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\AdminUserResource;
use App\Http\Resources\ErrorResource;
use App\Mail\AdminDeletedUser;
use App\Mail\AdminMessage;
use App\Mail\AdminUpdatedUser;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class AdminUserController extends Controller {
    public function getUsers() {
        try {
            $users = User::with('admin')->orderBy('email')->get();

            return AdminUserResource::collection($users);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function updateUser(UpdateUserRequest $request, User $user) {
        try {
            $oldEmail = $user->email;
            $newEmail = $request->validated('email');
            $emailChanged = $oldEmail !== $newEmail;
            $generatePassword = $request->boolean('generatePassword');
            $confirming = ! $user->confirmed && $request->boolean('confirmed');
            $newsletterChanged = $user->newsletter !== $request->boolean('newsletter');

            $modifiedItems = [];

            DB::transaction(function () use (
                $request, $user, $newEmail, $emailChanged, $generatePassword,
                $confirming, $newsletterChanged, &$modifiedItems
            ) {
                if ($emailChanged) {
                    $user->email = $newEmail;
                    $modifiedItems[] = "Új email: {$newEmail}";
                }

                if ($generatePassword) {
                    $plainPassword = Str::password(10, letters: true, numbers: true, symbols: false);
                    $user->password = Hash::make($plainPassword);
                    $user->password_set_at = Carbon::now();
                    $modifiedItems[] = "Új jelszó: {$plainPassword}";
                    $modifiedItems[] = 'Kérjük, jelentkezzen be, és a profil oldalon módosítsa a jelszavát.';
                }

                $user->confirmed = $request->boolean('confirmed');

                if ($confirming) {
                    $user->newUser()->delete();
                    $modifiedItems[] = 'Regisztrációját visszaigazoltuk, mostantól elérhető honlapunk teljes funkcionalitása. Köszönjük!';
                }

                if ($newsletterChanged) {
                    $user->newsletter = $request->boolean('newsletter');
                    $modifiedItems[] = $user->newsletter
                        ? 'Felvettük hírlevelünk címzettjei közé.'
                        : 'Ön a továbbiakban nem fog hírlevelet kapni tőlünk.';
                }

                $user->save();
            });

            try {
                Mail::to($newEmail)->send(new AdminUpdatedUser($modifiedItems));

                if ($emailChanged) {
                    Mail::to($oldEmail)->send(new AdminUpdatedUser($modifiedItems));
                }
            } catch (Throwable $e) {
                Log::error('Admin updated user: notification mail failed to send.', [
                    'user_id' => $user->id,
                    'message' => $e->getMessage(),
                ]);
            }

            return new AdminUserResource($user->load('admin'));
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function deleteUser(DeleteUserRequest $request, User $user) {
        try {
            $sender = $request->user();

            if ($sender->id === $user->id || (bool) $user->admin) {
                return response(new ErrorResource(403, ErrorCode::GENERIC_FORBIDDEN), 403);
            }

            $email = $user->email;
            $reason = $request->validated('reason');
            $reasonText = $reason === 'asked'
                ? 'Kérésének megfelelően töröltük regisztrációját. A regisztráció során vagy később megadott <strong>minden adatot töröltünk</strong> adatbázisunkból.'
                : 'Regisztrációját töröltük adatbázisunkból. Indoklás: '.e($request->validated('customReason')).'.';

            $user->delete();

            try {
                Mail::to($email)->send(new AdminDeletedUser($request->validated('subject'), $reasonText));
            } catch (Throwable $e) {
                Log::error('Admin deleted user: notification mail failed to send.', [
                    'email' => $email,
                    'message' => $e->getMessage(),
                ]);
            }

            return response(null, 204);
        } catch (Throwable $e) {
            abort(500);
        }
    }

    public function sendUserEmail(SendUserEmailRequest $request, User $user) {
        try {
            Mail::to($user->email)->send(new AdminMessage(
                $request->validated('subject'),
                $request->validated('body'),
            ));

            return response(null, 204);
        } catch (Throwable $e) {
            abort(500);
        }
    }
}
