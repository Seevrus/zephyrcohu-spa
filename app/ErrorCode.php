<?php

namespace App;

enum ErrorCode: string {
    case BAD_CREDENTIALS = 'BAD_CREDENTIALS';
    case BAD_EMAIL_CODE = 'BAD_EMAIL_CODE';
    case GENERIC_FORBIDDEN = 'GENERIC_FORBIDDEN';
    case GENERIC_LOCKED = 'GENERIC_LOCKED';
    case GENERIC_METHOD_NOT_ALLOWED = 'GENERIC_METHOD_NOT_ALLOWED';
    case GENERIC_NOT_FOUND = 'GENERIC_NOT_FOUND';
    case GENERIC_TOO_MANY_REQUESTS = 'GENERIC_TOO_MANY_REQUESTS';
    case GENERIC_UNAUTHORIZED = 'GENERIC_UNAUTHORIZED';
    case GENERIC_UNSUPPORTED_MEDIA_TYPE = 'GENERIC_UNSUPPORTED_MEDIA_TYPE';
    case INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR';
    case INVALID_CSRF = 'INVALID_CSRF';
    case TOO_MANY_LOGIN_ATTEMPTS = 'TOO_MANY_LOGIN_ATTEMPTS';
    case USER_ALREADY_CONFIRMED = 'USER_ALREADY_CONFIRMED';
    case USER_ALREADY_LOGGED_IN = 'USER_ALREADY_LOGGED_IN';
    case USER_EXISTS = 'USER_EXISTS';
    case USER_NOT_CONFIRMED = 'USER_NOT_CONFIRMED';
}