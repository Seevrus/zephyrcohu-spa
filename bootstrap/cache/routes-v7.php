<?php

app('router')->setCompiledRoutes(
    [
        'compiled' => [
            0 => false,
            1 => [
                '/sanctum/csrf-cookie' => [
                    0 => [
                        0 => [
                            '_route' => 'sanctum.csrf-cookie',
                        ],
                        1 => null,
                        2 => [
                            'GET' => 0,
                            'HEAD' => 1,
                        ],
                        3 => null,
                        4 => false,
                        5 => false,
                        6 => null,
                    ],
                ],
                '/api/users/profile/request_new_password' => [
                    0 => [
                        0 => [
                            '_route' => 'generated::6V6hn7wI4I0yPTqN',
                        ],
                        1 => null,
                        2 => [
                            'POST' => 0,
                        ],
                        3 => null,
                        4 => false,
                        5 => false,
                        6 => null,
                    ],
                ],
                '/api/users/profile/reset_password' => [
                    0 => [
                        0 => [
                            '_route' => 'generated::diYPZXqV9rPIyeDS',
                        ],
                        1 => null,
                        2 => [
                            'POST' => 0,
                        ],
                        3 => null,
                        4 => false,
                        5 => false,
                        6 => null,
                    ],
                ],
                '/api/users/register' => [
                    0 => [
                        0 => [
                            '_route' => 'generated::mwS5kTqfoheMDUYV',
                        ],
                        1 => null,
                        2 => [
                            'POST' => 0,
                        ],
                        3 => null,
                        4 => false,
                        5 => false,
                        6 => null,
                    ],
                ],
                '/api/users/register/confirm_email' => [
                    0 => [
                        0 => [
                            '_route' => 'generated::dva0LBFinEqxXDM5',
                        ],
                        1 => null,
                        2 => [
                            'POST' => 0,
                        ],
                        3 => null,
                        4 => false,
                        5 => false,
                        6 => null,
                    ],
                ],
                '/api/users/register/resend_confirm_email' => [
                    0 => [
                        0 => [
                            '_route' => 'generated::qNaQkvBk9okkfnrF',
                        ],
                        1 => null,
                        2 => [
                            'POST' => 0,
                        ],
                        3 => null,
                        4 => false,
                        5 => false,
                        6 => null,
                    ],
                ],
                '/api/users/register/revoke' => [
                    0 => [
                        0 => [
                            '_route' => 'generated::wbwYszbyelSGHsF8',
                        ],
                        1 => null,
                        2 => [
                            'POST' => 0,
                        ],
                        3 => null,
                        4 => false,
                        5 => false,
                        6 => null,
                    ],
                ],
                '/api/users/login' => [
                    0 => [
                        0 => [
                            '_route' => 'generated::6g0daDBogJnf3B2L',
                        ],
                        1 => null,
                        2 => [
                            'POST' => 0,
                        ],
                        3 => null,
                        4 => false,
                        5 => false,
                        6 => null,
                    ],
                ],
                '/api/users/logout' => [
                    0 => [
                        0 => [
                            '_route' => 'generated::LsLSkVS3ovQvxjr4',
                        ],
                        1 => null,
                        2 => [
                            'POST' => 0,
                        ],
                        3 => null,
                        4 => false,
                        5 => false,
                        6 => null,
                    ],
                ],
                '/api/users/session' => [
                    0 => [
                        0 => [
                            '_route' => 'generated::cqI4GURfTwjcG2Wj',
                        ],
                        1 => null,
                        2 => [
                            'GET' => 0,
                            'HEAD' => 1,
                        ],
                        3 => null,
                        4 => false,
                        5 => false,
                        6 => null,
                    ],
                ],
                '/up' => [
                    0 => [
                        0 => [
                            '_route' => 'generated::VdybpZVOv2EiNMlB',
                        ],
                        1 => null,
                        2 => [
                            'GET' => 0,
                            'HEAD' => 1,
                        ],
                        3 => null,
                        4 => false,
                        5 => false,
                        6 => null,
                    ],
                ],
            ],
            2 => [
                0 => '{^(?|/((?!api/).*)(*:20)|/storage/(.*)(*:40))/?$}sDu',
            ],
            3 => [
                20 => [
                    0 => [
                        0 => [
                            '_route' => 'generated::UpkL8hhcZ84DFaQc',
                        ],
                        1 => [
                            0 => 'any',
                        ],
                        2 => [
                            'GET' => 0,
                            'HEAD' => 1,
                        ],
                        3 => null,
                        4 => false,
                        5 => true,
                        6 => null,
                    ],
                ],
                40 => [
                    0 => [
                        0 => [
                            '_route' => 'storage.local',
                        ],
                        1 => [
                            0 => 'path',
                        ],
                        2 => [
                            'GET' => 0,
                            'HEAD' => 1,
                        ],
                        3 => null,
                        4 => false,
                        5 => true,
                        6 => null,
                    ],
                    1 => [
                        0 => null,
                        1 => null,
                        2 => null,
                        3 => null,
                        4 => false,
                        5 => false,
                        6 => 0,
                    ],
                ],
            ],
            4 => null,
        ],
        'attributes' => [
            'sanctum.csrf-cookie' => [
                'methods' => [
                    0 => 'GET',
                    1 => 'HEAD',
                ],
                'uri' => 'sanctum/csrf-cookie',
                'action' => [
                    'uses' => 'Laravel\\Sanctum\\Http\\Controllers\\CsrfCookieController@show',
                    'controller' => 'Laravel\\Sanctum\\Http\\Controllers\\CsrfCookieController@show',
                    'namespace' => null,
                    'prefix' => 'sanctum',
                    'where' => [
                    ],
                    'middleware' => [
                        0 => 'web',
                    ],
                    'as' => 'sanctum.csrf-cookie',
                ],
                'fallback' => false,
                'defaults' => [
                ],
                'wheres' => [
                ],
                'bindingFields' => [
                ],
                'lockSeconds' => null,
                'waitSeconds' => null,
                'withTrashed' => false,
            ],
            'generated::6V6hn7wI4I0yPTqN' => [
                'methods' => [
                    0 => 'POST',
                ],
                'uri' => 'api/users/profile/request_new_password',
                'action' => [
                    'middleware' => [
                        0 => 'api',
                    ],
                    'uses' => 'App\\Http\\Controllers\\UserController@requestNewPassword',
                    'controller' => 'App\\Http\\Controllers\\UserController@requestNewPassword',
                    'namespace' => null,
                    'prefix' => 'api/users/profile',
                    'where' => [
                    ],
                    'as' => 'generated::6V6hn7wI4I0yPTqN',
                ],
                'fallback' => false,
                'defaults' => [
                ],
                'wheres' => [
                ],
                'bindingFields' => [
                ],
                'lockSeconds' => null,
                'waitSeconds' => null,
                'withTrashed' => false,
            ],
            'generated::diYPZXqV9rPIyeDS' => [
                'methods' => [
                    0 => 'POST',
                ],
                'uri' => 'api/users/profile/reset_password',
                'action' => [
                    'middleware' => [
                        0 => 'api',
                    ],
                    'uses' => 'App\\Http\\Controllers\\UserController@resetPassword',
                    'controller' => 'App\\Http\\Controllers\\UserController@resetPassword',
                    'namespace' => null,
                    'prefix' => 'api/users/profile',
                    'where' => [
                    ],
                    'as' => 'generated::diYPZXqV9rPIyeDS',
                ],
                'fallback' => false,
                'defaults' => [
                ],
                'wheres' => [
                ],
                'bindingFields' => [
                ],
                'lockSeconds' => null,
                'waitSeconds' => null,
                'withTrashed' => false,
            ],
            'generated::mwS5kTqfoheMDUYV' => [
                'methods' => [
                    0 => 'POST',
                ],
                'uri' => 'api/users/register',
                'action' => [
                    'middleware' => [
                        0 => 'api',
                    ],
                    'uses' => 'App\\Http\\Controllers\\UserController@registerUser',
                    'controller' => 'App\\Http\\Controllers\\UserController@registerUser',
                    'namespace' => null,
                    'prefix' => 'api/users/register',
                    'where' => [
                    ],
                    'as' => 'generated::mwS5kTqfoheMDUYV',
                ],
                'fallback' => false,
                'defaults' => [
                ],
                'wheres' => [
                ],
                'bindingFields' => [
                ],
                'lockSeconds' => null,
                'waitSeconds' => null,
                'withTrashed' => false,
            ],
            'generated::dva0LBFinEqxXDM5' => [
                'methods' => [
                    0 => 'POST',
                ],
                'uri' => 'api/users/register/confirm_email',
                'action' => [
                    'middleware' => [
                        0 => 'api',
                    ],
                    'uses' => 'App\\Http\\Controllers\\UserController@confirmEmail',
                    'controller' => 'App\\Http\\Controllers\\UserController@confirmEmail',
                    'namespace' => null,
                    'prefix' => 'api/users/register',
                    'where' => [
                    ],
                    'as' => 'generated::dva0LBFinEqxXDM5',
                ],
                'fallback' => false,
                'defaults' => [
                ],
                'wheres' => [
                ],
                'bindingFields' => [
                ],
                'lockSeconds' => null,
                'waitSeconds' => null,
                'withTrashed' => false,
            ],
            'generated::qNaQkvBk9okkfnrF' => [
                'methods' => [
                    0 => 'POST',
                ],
                'uri' => 'api/users/register/resend_confirm_email',
                'action' => [
                    'middleware' => [
                        0 => 'api',
                    ],
                    'uses' => 'App\\Http\\Controllers\\UserController@resendConfirmEmail',
                    'controller' => 'App\\Http\\Controllers\\UserController@resendConfirmEmail',
                    'namespace' => null,
                    'prefix' => 'api/users/register',
                    'where' => [
                    ],
                    'as' => 'generated::qNaQkvBk9okkfnrF',
                ],
                'fallback' => false,
                'defaults' => [
                ],
                'wheres' => [
                ],
                'bindingFields' => [
                ],
                'lockSeconds' => null,
                'waitSeconds' => null,
                'withTrashed' => false,
            ],
            'generated::wbwYszbyelSGHsF8' => [
                'methods' => [
                    0 => 'POST',
                ],
                'uri' => 'api/users/register/revoke',
                'action' => [
                    'middleware' => [
                        0 => 'api',
                    ],
                    'uses' => 'App\\Http\\Controllers\\UserController@revokeRegistration',
                    'controller' => 'App\\Http\\Controllers\\UserController@revokeRegistration',
                    'namespace' => null,
                    'prefix' => 'api/users/register',
                    'where' => [
                    ],
                    'as' => 'generated::wbwYszbyelSGHsF8',
                ],
                'fallback' => false,
                'defaults' => [
                ],
                'wheres' => [
                ],
                'bindingFields' => [
                ],
                'lockSeconds' => null,
                'waitSeconds' => null,
                'withTrashed' => false,
            ],
            'generated::6g0daDBogJnf3B2L' => [
                'methods' => [
                    0 => 'POST',
                ],
                'uri' => 'api/users/login',
                'action' => [
                    'middleware' => [
                        0 => 'api',
                    ],
                    'uses' => 'App\\Http\\Controllers\\UserController@login',
                    'controller' => 'App\\Http\\Controllers\\UserController@login',
                    'namespace' => null,
                    'prefix' => 'api/users',
                    'where' => [
                    ],
                    'as' => 'generated::6g0daDBogJnf3B2L',
                ],
                'fallback' => false,
                'defaults' => [
                ],
                'wheres' => [
                ],
                'bindingFields' => [
                ],
                'lockSeconds' => null,
                'waitSeconds' => null,
                'withTrashed' => false,
            ],
            'generated::LsLSkVS3ovQvxjr4' => [
                'methods' => [
                    0 => 'POST',
                ],
                'uri' => 'api/users/logout',
                'action' => [
                    'middleware' => [
                        0 => 'api',
                        1 => 'auth:sanctum',
                    ],
                    'uses' => 'App\\Http\\Controllers\\UserController@logout',
                    'controller' => 'App\\Http\\Controllers\\UserController@logout',
                    'namespace' => null,
                    'prefix' => 'api/users',
                    'where' => [
                    ],
                    'as' => 'generated::LsLSkVS3ovQvxjr4',
                ],
                'fallback' => false,
                'defaults' => [
                ],
                'wheres' => [
                ],
                'bindingFields' => [
                ],
                'lockSeconds' => null,
                'waitSeconds' => null,
                'withTrashed' => false,
            ],
            'generated::cqI4GURfTwjcG2Wj' => [
                'methods' => [
                    0 => 'GET',
                    1 => 'HEAD',
                ],
                'uri' => 'api/users/session',
                'action' => [
                    'middleware' => [
                        0 => 'api',
                        1 => 'auth:sanctum',
                    ],
                    'uses' => 'App\\Http\\Controllers\\UserController@session',
                    'controller' => 'App\\Http\\Controllers\\UserController@session',
                    'namespace' => null,
                    'prefix' => 'api/users',
                    'where' => [
                    ],
                    'as' => 'generated::cqI4GURfTwjcG2Wj',
                ],
                'fallback' => false,
                'defaults' => [
                ],
                'wheres' => [
                ],
                'bindingFields' => [
                ],
                'lockSeconds' => null,
                'waitSeconds' => null,
                'withTrashed' => false,
            ],
            'generated::VdybpZVOv2EiNMlB' => [
                'methods' => [
                    0 => 'GET',
                    1 => 'HEAD',
                ],
                'uri' => 'up',
                'action' => [
                    'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:819:"function () {
                    $exception = null;

                    try {
                        \\Illuminate\\Support\\Facades\\Event::dispatch(new \\Illuminate\\Foundation\\Events\\DiagnosingHealth);
                    } catch (\\Throwable $e) {
                        if (app()->hasDebugModeEnabled()) {
                            throw $e;
                        }

                        report($e);

                        $exception = $e->getMessage();
                    }

                    return response(\\Illuminate\\Support\\Facades\\View::file(\'D:\\\\zephyrcohu-spa\\\\vendor\\\\laravel\\\\framework\\\\src\\\\Illuminate\\\\Foundation\\\\Configuration\'.\'/../resources/health-up.blade.php\', [
                        \'exception\' => $exception,
                    ]), status: $exception ? 500 : 200);
                }";s:5:"scope";s:54:"Illuminate\\Foundation\\Configuration\\ApplicationBuilder";s:4:"this";N;s:4:"self";s:32:"000000000000051c0000000000000000";}}',
                    'as' => 'generated::VdybpZVOv2EiNMlB',
                ],
                'fallback' => false,
                'defaults' => [
                ],
                'wheres' => [
                ],
                'bindingFields' => [
                ],
                'lockSeconds' => null,
                'waitSeconds' => null,
                'withTrashed' => false,
            ],
            'generated::UpkL8hhcZ84DFaQc' => [
                'methods' => [
                    0 => 'GET',
                    1 => 'HEAD',
                ],
                'uri' => '{any}',
                'action' => [
                    'middleware' => [
                        0 => 'web',
                    ],
                    'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:0:{}s:8:"function";s:75:"function () {
    return \\file_get_contents(\\public_path(\'zephyr.html\'));
}";s:5:"scope";s:37:"Illuminate\\Routing\\RouteFileRegistrar";s:4:"this";N;s:4:"self";s:32:"00000000000005290000000000000000";}}',
                    'namespace' => null,
                    'prefix' => '',
                    'where' => [
                    ],
                    'as' => 'generated::UpkL8hhcZ84DFaQc',
                ],
                'fallback' => false,
                'defaults' => [
                ],
                'wheres' => [
                    'any' => '^(?!api/).*$',
                ],
                'bindingFields' => [
                ],
                'lockSeconds' => null,
                'waitSeconds' => null,
                'withTrashed' => false,
            ],
            'storage.local' => [
                'methods' => [
                    0 => 'GET',
                    1 => 'HEAD',
                ],
                'uri' => 'storage/{path}',
                'action' => [
                    'uses' => 'O:55:"Laravel\\SerializableClosure\\UnsignedSerializableClosure":1:{s:12:"serializable";O:46:"Laravel\\SerializableClosure\\Serializers\\Native":5:{s:3:"use";a:3:{s:4:"disk";s:5:"local";s:6:"config";a:4:{s:6:"driver";s:5:"local";s:4:"root";s:37:"D:\\zephyrcohu-spa\\storage\\app/private";s:5:"serve";b:1;s:5:"throw";b:0;}s:12:"isProduction";b:0;}s:8:"function";s:323:"function (\\Illuminate\\Http\\Request $request, string $path) use ($disk, $config, $isProduction) {
                    return (new \\Illuminate\\Filesystem\\ServeFile(
                        $disk,
                        $config,
                        $isProduction
                    ))($request, $path);
                }";s:5:"scope";s:47:"Illuminate\\Filesystem\\FilesystemServiceProvider";s:4:"this";N;s:4:"self";s:32:"000000000000052b0000000000000000";}}',
                    'as' => 'storage.local',
                ],
                'fallback' => false,
                'defaults' => [
                ],
                'wheres' => [
                    'path' => '.*',
                ],
                'bindingFields' => [
                ],
                'lockSeconds' => null,
                'waitSeconds' => null,
                'withTrashed' => false,
            ],
        ],
    ]
);
