<?php

namespace App;

use Illuminate\Http\Response;

class ErrorHandling {
    public static function bad_request(): Response {
        $response = [
            'status' => 400,
            'code' => 'Bad Request',
            'message' => 'The server cannot or will not process the request due to something that is perceived to be a client error.',
        ];

        return response($response, 400);
    }

    public static function unauthorized(): Response {
        $response = [
            'status' => 401,
            'code' => ErrorCode::GENERIC_UNAUTHORIZED,
            'message' => 'The client must authenticate itself to get the requested response.',
        ];

        return response($response, 401);
    }

    public static function forbidden(): Response {
        $response = [
            'status' => 403,
            'code' => ErrorCode::GENERIC_FORBIDDEN,
            'message' => 'The client does not have access rights to the content.',
        ];

        return response($response, 403);
    }

    public static function not_found(): Response {
        $response = [
            'status' => 404,
            'code' => ErrorCode::GENERIC_NOT_FOUND,
            'message' => 'The server cannot find the requested resource.',
        ];

        return response($response, 404);
    }

    public static function method_not_allowed(): Response {
        $response = [
            'status' => 405,
            'code' => ErrorCode::GENERIC_METHOD_NOT_ALLOWED,
            'message' => 'The request method is known by the server but is not supported by the target resource.',
        ];

        return response($response, 405);
    }

    public static function unsupported_media_type(): Response {
        $response = [
            'status' => 415,
            'code' => ErrorCode::GENERIC_UNSUPPORTED_MEDIA_TYPE,
            'message' => 'The request is not JSON, or not well formatted.',
        ];

        return response($response, 415);
    }

    public static function locked(): Response {
        $response = [
            'status' => 423,
            'code' => ErrorCode::GENERIC_LOCKED,
            'message' => 'The resource that is being accessed is locked.',
        ];

        return response($response, 423);
    }

    public static function too_many_requests(): Response {
        $response = [
            'status' => 429,
            'code' => ErrorCode::GENERIC_TOO_MANY_REQUESTS,
            'message' => 'The user has sent too many requests in a given amount of time.',
        ];

        return response($response, 429);
    }

    public static function internal_Server_error(): Response {
        $response = [
            'status' => 500,
            'code' => ErrorCode::INTERNAL_SERVER_ERROR,
            'message' => 'The server has encountered a situation it does not know how to handle.',
        ];

        return response($response, 500);
    }
}
