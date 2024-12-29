<?php

namespace App\Http\Requests;

enum ErrorCode: string {
    case USER_EXISTS = 'USER_EXISTS';
    case USER_NOT_CONFIRMED = 'USER_NOT_CONFIRMED';
}
