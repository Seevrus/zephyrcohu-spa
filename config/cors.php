<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/*'],

    'allowed_methods' => ['GET', 'OPTIONS', 'POST'],

    'allowed_origins' => [env('APP_ORIGIN')],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'X-XSRF-Token'],

    'exposed_headers' => [],

    'max_age' => 300,

    'supports_credentials' => true,

];
