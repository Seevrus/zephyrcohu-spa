<?php

namespace App\Http\Requests;

enum ErrorCode: string {
    case BAD_EMAIL_CODE = 'BAD_EMAIL_CODE';
    case USER_ALREADY_CONFIRMED = 'USER_ALREADY_CONFIRMED';
    case USER_EXISTS = 'USER_EXISTS';
    case USER_NOT_CONFIRMED = 'USER_NOT_CONFIRMED';
}
