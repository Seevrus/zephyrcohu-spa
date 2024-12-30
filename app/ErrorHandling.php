<?php

namespace App;

use Illuminate\Http\Response;

class ErrorHandling {
    public static function bad_request(): Response {
        $response = [
            'status' => 400,
            'codeName' => 'Bad Request',
            'message' => 'The server cannot or will not process the request due to something that is perceived to be a client error.',
        ];

        return response($response, 400);
    }

    public static function unauthorized(): Response {
        $response = [
            'status' => 401,
            'codeName' => 'Unauthorized',
            'message' => 'The client must authenticate itself to get the requested response.',
        ];

        return response($response, 401);
    }

    public static function forbidden(): Response {
        $response = [
            'status' => 403,
            'codeName' => 'Forbidden',
            'message' => 'The client does not have access rights to the content.',
        ];

        return response($response, 403);
    }

    public static function not_found(): Response {
        $response = [
            'status' => 404,
            'codeName' => 'Not Found',
            'message' => 'The server cannot find the requested resource.',
        ];

        return response($response, 404);
    }

    public static function method_not_allowed(): Response {
        $response = [
            'status' => 405,
            'codeName' => 'Method Not Allowed',
            'message' => 'The request method is known by the server but is not supported by the target resource.',
        ];

        return response($response, 405);
    }

    public static function unsupported_media_type(): Response {
        $response = [
            'status' => 415,
            'codeName' => 'Unsupported Media Type',
            'message' => 'The request is not JSON, or not well formatted.',
        ];

        return response($response, 415);
    }

    public static function locked(): Response {
        $response = [
            'status' => 423,
            'codeName' => 'Locked',
            'message' => 'The resource that is being accessed is locked.',
        ];

        return response($response, 423);
    }

    public static function too_many_requests(): Response {
        $response = [
            'status' => 429,
            'codeName' => 'Too Many Requests',
            'message' => 'The user has sent too many requests in a given amount of time.',
        ];

        return response($response, 429);
    }

    public static function internal_Server_error(): Response {
        $response = [
            'status' => 500,
            'codeName' => 'Internal Server Error',
            'message' => 'The server has encountered a situation it does not know how to handle.',
        ];

        return response($response, 500);
    }
}