<?php

return [
    'broadcasting' => [
        'default' => 'null',
        'connections' => [
            'reverb' => [
                'driver' => 'reverb',
                'key' => null,
                'secret' => null,
                'app_id' => null,
                'options' => [
                    'host' => null,
                    'port' => 443,
                    'scheme' => 'https',
                    'useTLS' => true,
                ],
                'client_options' => [
                ],
            ],
            'pusher' => [
                'driver' => 'pusher',
                'key' => null,
                'secret' => null,
                'app_id' => null,
                'options' => [
                    'cluster' => null,
                    'host' => 'api-mt1.pusher.com',
                    'port' => 443,
                    'scheme' => 'https',
                    'encrypted' => true,
                    'useTLS' => true,
                ],
                'client_options' => [
                ],
            ],
            'ably' => [
                'driver' => 'ably',
                'key' => null,
            ],
            'log' => [
                'driver' => 'log',
            ],
            'null' => [
                'driver' => 'null',
            ],
        ],
    ],
    'concurrency' => [
        'default' => 'process',
    ],
    'hashing' => [
        'driver' => 'bcrypt',
        'bcrypt' => [
            'rounds' => '12',
            'verify' => true,
            'limit' => null,
        ],
        'argon' => [
            'memory' => 65536,
            'threads' => 1,
            'time' => 4,
            'verify' => true,
        ],
        'rehash_on_login' => true,
    ],
    'view' => [
        'paths' => [
            0 => 'D:\\zephyrcohu-spa\\resources\\views',
        ],
        'compiled' => 'D:\\zephyrcohu-spa\\storage\\framework\\views',
    ],
    'app' => [
        'name' => 'zephyrcohu-spa',
        'env' => 'local',
        'debug' => true,
        'url' => 'http://localhost',
        'frontend_url' => 'http://localhost:3000',
        'asset_url' => null,
        'timezone' => 'Europe/Budapest',
        'locale' => 'hu',
        'fallback_locale' => 'hu',
        'faker_locale' => 'en_US',
        'cipher' => 'AES-256-CBC',
        'key' => 'base64:ndS6l5hjAANheaUm9e9/48y3KXjdS3iFchKVrearjpA=',
        'previous_keys' => [
        ],
        'maintenance' => [
            'driver' => 'file',
            'store' => 'database',
        ],
        'providers' => [
            0 => 'Illuminate\\Auth\\AuthServiceProvider',
            1 => 'Illuminate\\Broadcasting\\BroadcastServiceProvider',
            2 => 'Illuminate\\Bus\\BusServiceProvider',
            3 => 'Illuminate\\Cache\\CacheServiceProvider',
            4 => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
            5 => 'Illuminate\\Concurrency\\ConcurrencyServiceProvider',
            6 => 'Illuminate\\Cookie\\CookieServiceProvider',
            7 => 'Illuminate\\Database\\DatabaseServiceProvider',
            8 => 'Illuminate\\Encryption\\EncryptionServiceProvider',
            9 => 'Illuminate\\Filesystem\\FilesystemServiceProvider',
            10 => 'Illuminate\\Foundation\\Providers\\FoundationServiceProvider',
            11 => 'Illuminate\\Hashing\\HashServiceProvider',
            12 => 'Illuminate\\Mail\\MailServiceProvider',
            13 => 'Illuminate\\Notifications\\NotificationServiceProvider',
            14 => 'Illuminate\\Pagination\\PaginationServiceProvider',
            15 => 'Illuminate\\Auth\\Passwords\\PasswordResetServiceProvider',
            16 => 'Illuminate\\Pipeline\\PipelineServiceProvider',
            17 => 'Illuminate\\Queue\\QueueServiceProvider',
            18 => 'Illuminate\\Redis\\RedisServiceProvider',
            19 => 'Illuminate\\Session\\SessionServiceProvider',
            20 => 'Illuminate\\Translation\\TranslationServiceProvider',
            21 => 'Illuminate\\Validation\\ValidationServiceProvider',
            22 => 'Illuminate\\View\\ViewServiceProvider',
            23 => 'App\\Providers\\AppServiceProvider',
        ],
        'aliases' => [
            'App' => 'Illuminate\\Support\\Facades\\App',
            'Arr' => 'Illuminate\\Support\\Arr',
            'Artisan' => 'Illuminate\\Support\\Facades\\Artisan',
            'Auth' => 'Illuminate\\Support\\Facades\\Auth',
            'Benchmark' => 'Illuminate\\Support\\Benchmark',
            'Blade' => 'Illuminate\\Support\\Facades\\Blade',
            'Broadcast' => 'Illuminate\\Support\\Facades\\Broadcast',
            'Bus' => 'Illuminate\\Support\\Facades\\Bus',
            'Cache' => 'Illuminate\\Support\\Facades\\Cache',
            'Concurrency' => 'Illuminate\\Support\\Facades\\Concurrency',
            'Config' => 'Illuminate\\Support\\Facades\\Config',
            'Context' => 'Illuminate\\Support\\Facades\\Context',
            'Cookie' => 'Illuminate\\Support\\Facades\\Cookie',
            'Crypt' => 'Illuminate\\Support\\Facades\\Crypt',
            'Date' => 'Illuminate\\Support\\Facades\\Date',
            'DB' => 'Illuminate\\Support\\Facades\\DB',
            'Eloquent' => 'Illuminate\\Database\\Eloquent\\Model',
            'Event' => 'Illuminate\\Support\\Facades\\Event',
            'File' => 'Illuminate\\Support\\Facades\\File',
            'Gate' => 'Illuminate\\Support\\Facades\\Gate',
            'Hash' => 'Illuminate\\Support\\Facades\\Hash',
            'Http' => 'Illuminate\\Support\\Facades\\Http',
            'Js' => 'Illuminate\\Support\\Js',
            'Lang' => 'Illuminate\\Support\\Facades\\Lang',
            'Log' => 'Illuminate\\Support\\Facades\\Log',
            'Mail' => 'Illuminate\\Support\\Facades\\Mail',
            'Notification' => 'Illuminate\\Support\\Facades\\Notification',
            'Number' => 'Illuminate\\Support\\Number',
            'Password' => 'Illuminate\\Support\\Facades\\Password',
            'Process' => 'Illuminate\\Support\\Facades\\Process',
            'Queue' => 'Illuminate\\Support\\Facades\\Queue',
            'RateLimiter' => 'Illuminate\\Support\\Facades\\RateLimiter',
            'Redirect' => 'Illuminate\\Support\\Facades\\Redirect',
            'Request' => 'Illuminate\\Support\\Facades\\Request',
            'Response' => 'Illuminate\\Support\\Facades\\Response',
            'Route' => 'Illuminate\\Support\\Facades\\Route',
            'Schedule' => 'Illuminate\\Support\\Facades\\Schedule',
            'Schema' => 'Illuminate\\Support\\Facades\\Schema',
            'Session' => 'Illuminate\\Support\\Facades\\Session',
            'Storage' => 'Illuminate\\Support\\Facades\\Storage',
            'Str' => 'Illuminate\\Support\\Str',
            'Uri' => 'Illuminate\\Support\\Uri',
            'URL' => 'Illuminate\\Support\\Facades\\URL',
            'Validator' => 'Illuminate\\Support\\Facades\\Validator',
            'View' => 'Illuminate\\Support\\Facades\\View',
            'Vite' => 'Illuminate\\Support\\Facades\\Vite',
        ],
    ],
    'auth' => [
        'defaults' => [
            'guard' => 'web',
            'passwords' => 'users',
        ],
        'guards' => [
            'web' => [
                'driver' => 'session',
                'provider' => 'users',
            ],
            'sanctum' => [
                'driver' => 'sanctum',
                'provider' => null,
            ],
        ],
        'providers' => [
            'users' => [
                'driver' => 'eloquent',
                'model' => 'App\\Models\\User',
            ],
        ],
        'passwords' => [
            'users' => [
                'provider' => 'users',
                'table' => 'password_reset_tokens',
                'expire' => 60,
                'throttle' => 60,
            ],
        ],
        'password_timeout' => 10800,
    ],
    'cache' => [
        'default' => 'database',
        'stores' => [
            'array' => [
                'driver' => 'array',
                'serialize' => false,
            ],
            'session' => [
                'driver' => 'session',
                'key' => '_cache',
            ],
            'database' => [
                'driver' => 'database',
                'connection' => null,
                'table' => 'cache',
                'lock_connection' => null,
                'lock_table' => null,
            ],
            'file' => [
                'driver' => 'file',
                'path' => 'D:\\zephyrcohu-spa\\storage\\framework/cache/data',
                'lock_path' => 'D:\\zephyrcohu-spa\\storage\\framework/cache/data',
            ],
            'memcached' => [
                'driver' => 'memcached',
                'persistent_id' => null,
                'sasl' => [
                    0 => null,
                    1 => null,
                ],
                'options' => [
                ],
                'servers' => [
                    0 => [
                        'host' => '127.0.0.1',
                        'port' => 11211,
                        'weight' => 100,
                    ],
                ],
            ],
            'redis' => [
                'driver' => 'redis',
                'connection' => 'cache',
                'lock_connection' => 'default',
            ],
            'dynamodb' => [
                'driver' => 'dynamodb',
                'key' => null,
                'secret' => null,
                'region' => 'us-east-1',
                'table' => 'cache',
                'endpoint' => null,
            ],
            'octane' => [
                'driver' => 'octane',
            ],
            'failover' => [
                'driver' => 'failover',
                'stores' => [
                    0 => 'database',
                    1 => 'array',
                ],
            ],
        ],
        'prefix' => 'zephyrcohu-spa-cache-',
    ],
    'cors' => [
        'paths' => [
            0 => 'api/*',
            1 => 'sanctum/*',
        ],
        'allowed_methods' => [
            0 => 'GET',
            1 => 'OPTIONS',
            2 => 'POST',
        ],
        'allowed_origins' => [
            0 => 'http://127.0.0.1:4200',
        ],
        'allowed_origins_patterns' => [
        ],
        'allowed_headers' => [
            0 => 'Content-Type',
            1 => 'X-XSRF-Token',
        ],
        'exposed_headers' => [
        ],
        'max_age' => 300,
        'supports_credentials' => true,
    ],
    'database' => [
        'default' => 'mysql',
        'connections' => [
            'sqlite' => [
                'driver' => 'sqlite',
                'url' => null,
                'database' => 'zephyrco_fo_honlap',
                'prefix' => '',
                'foreign_key_constraints' => true,
                'busy_timeout' => null,
                'journal_mode' => null,
                'synchronous' => null,
            ],
            'mysql' => [
                'driver' => 'mysql',
                'url' => null,
                'host' => '127.0.0.1',
                'port' => '',
                'database' => 'zephyrco_fo_honlap',
                'username' => 'root',
                'password' => 'root',
                'unix_socket' => '',
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_hungarian_ci',
                'prefix' => '',
                'prefix_indexes' => true,
                'strict' => true,
                'engine' => null,
                'options' => [
                ],
            ],
            'mariadb' => [
                'driver' => 'mariadb',
                'url' => null,
                'host' => '127.0.0.1',
                'port' => '',
                'database' => 'zephyrco_fo_honlap',
                'username' => 'root',
                'password' => 'root',
                'unix_socket' => '',
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_hungarian_ci',
                'prefix' => '',
                'prefix_indexes' => true,
                'strict' => true,
                'engine' => null,
                'options' => [
                ],
            ],
            'pgsql' => [
                'driver' => 'pgsql',
                'url' => null,
                'host' => '127.0.0.1',
                'port' => '',
                'database' => 'zephyrco_fo_honlap',
                'username' => 'root',
                'password' => 'root',
                'charset' => 'utf8mb4',
                'prefix' => '',
                'prefix_indexes' => true,
                'search_path' => 'public',
                'sslmode' => 'prefer',
            ],
            'sqlsrv' => [
                'driver' => 'sqlsrv',
                'url' => null,
                'host' => '127.0.0.1',
                'port' => '',
                'database' => 'zephyrco_fo_honlap',
                'username' => 'root',
                'password' => 'root',
                'charset' => 'utf8mb4',
                'prefix' => '',
                'prefix_indexes' => true,
            ],
        ],
        'migrations' => [
            'table' => 'migrations',
            'update_date_on_publish' => true,
        ],
        'redis' => [
            'client' => 'phpredis',
            'options' => [
                'cluster' => 'redis',
                'prefix' => 'zephyrcohu-spa-database-',
            ],
            'default' => [
                'url' => null,
                'host' => '127.0.0.1',
                'username' => null,
                'password' => null,
                'port' => '6379',
                'database' => '0',
            ],
            'cache' => [
                'url' => null,
                'host' => '127.0.0.1',
                'username' => null,
                'password' => null,
                'port' => '6379',
                'database' => '1',
            ],
        ],
    ],
    'filesystems' => [
        'default' => 'local',
        'disks' => [
            'local' => [
                'driver' => 'local',
                'root' => 'D:\\zephyrcohu-spa\\storage\\app/private',
                'serve' => true,
                'throw' => false,
            ],
            'public' => [
                'driver' => 'local',
                'root' => 'D:\\zephyrcohu-spa\\storage\\app/public',
                'url' => 'http://localhost/storage',
                'visibility' => 'public',
                'throw' => false,
            ],
            's3' => [
                'driver' => 's3',
                'key' => null,
                'secret' => null,
                'region' => null,
                'bucket' => null,
                'url' => null,
                'endpoint' => null,
                'use_path_style_endpoint' => false,
                'throw' => false,
            ],
        ],
        'links' => [
            'D:\\zephyrcohu-spa\\public\\storage' => 'D:\\zephyrcohu-spa\\storage\\app/public',
        ],
    ],
    'logging' => [
        'default' => 'stack',
        'deprecations' => [
            'channel' => 'null',
            'trace' => false,
        ],
        'channels' => [
            'stack' => [
                'driver' => 'stack',
                'channels' => [
                    0 => 'single',
                ],
                'ignore_exceptions' => false,
            ],
            'single' => [
                'driver' => 'single',
                'path' => 'D:\\zephyrcohu-spa\\storage\\logs/laravel.log',
                'level' => 'debug',
                'replace_placeholders' => true,
            ],
            'daily' => [
                'driver' => 'daily',
                'path' => 'D:\\zephyrcohu-spa\\storage\\logs/laravel.log',
                'level' => 'debug',
                'days' => 14,
                'replace_placeholders' => true,
            ],
            'slack' => [
                'driver' => 'slack',
                'url' => null,
                'username' => 'Laravel Log',
                'emoji' => ':boom:',
                'level' => 'debug',
                'replace_placeholders' => true,
            ],
            'papertrail' => [
                'driver' => 'monolog',
                'level' => 'debug',
                'handler' => 'Monolog\\Handler\\SyslogUdpHandler',
                'handler_with' => [
                    'host' => null,
                    'port' => null,
                    'connectionString' => 'tls://:',
                ],
                'processors' => [
                    0 => 'Monolog\\Processor\\PsrLogMessageProcessor',
                ],
            ],
            'stderr' => [
                'driver' => 'monolog',
                'level' => 'debug',
                'handler' => 'Monolog\\Handler\\StreamHandler',
                'handler_with' => [
                    'stream' => 'php://stderr',
                ],
                'formatter' => null,
                'processors' => [
                    0 => 'Monolog\\Processor\\PsrLogMessageProcessor',
                ],
            ],
            'syslog' => [
                'driver' => 'syslog',
                'level' => 'debug',
                'facility' => 8,
                'replace_placeholders' => true,
            ],
            'errorlog' => [
                'driver' => 'errorlog',
                'level' => 'debug',
                'replace_placeholders' => true,
            ],
            'null' => [
                'driver' => 'monolog',
                'handler' => 'Monolog\\Handler\\NullHandler',
            ],
            'emergency' => [
                'path' => 'D:\\zephyrcohu-spa\\storage\\logs/laravel.log',
            ],
        ],
    ],
    'mail' => [
        'default' => 'smtp',
        'mailers' => [
            'smtp' => [
                'transport' => 'smtp',
                'scheme' => null,
                'url' => null,
                'host' => 'mail.zephyr.co.hu',
                'port' => '465',
                'username' => 'info@zephyr.co.hu',
                'password' => 'yr+@[P=0ujKN',
                'timeout' => null,
                'local_domain' => 'localhost',
            ],
            'ses' => [
                'transport' => 'ses',
            ],
            'postmark' => [
                'transport' => 'postmark',
            ],
            'resend' => [
                'transport' => 'resend',
            ],
            'sendmail' => [
                'transport' => 'sendmail',
                'path' => '/usr/sbin/sendmail -bs -i',
            ],
            'log' => [
                'transport' => 'log',
                'channel' => null,
            ],
            'array' => [
                'transport' => 'array',
            ],
            'failover' => [
                'transport' => 'failover',
                'mailers' => [
                    0 => 'smtp',
                    1 => 'log',
                ],
                'retry_after' => 60,
            ],
            'roundrobin' => [
                'transport' => 'roundrobin',
                'mailers' => [
                    0 => 'ses',
                    1 => 'postmark',
                ],
                'retry_after' => 60,
            ],
        ],
        'from' => [
            'address' => 'info@zephyr.co.hu',
            'name' => 'Zephyr Bt.',
        ],
        'markdown' => [
            'theme' => 'default',
            'paths' => [
                0 => 'D:\\zephyrcohu-spa\\resources\\views/vendor/mail',
            ],
        ],
        'reply_to' => [
            'address' => 'zephyr.bt@gmail.com',
            'name' => 'Zephyr Bt.',
        ],
    ],
    'queue' => [
        'default' => 'sync',
        'connections' => [
            'sync' => [
                'driver' => 'sync',
            ],
            'database' => [
                'driver' => 'database',
                'connection' => null,
                'table' => 'jobs',
                'queue' => 'default',
                'retry_after' => 90,
                'after_commit' => false,
            ],
            'beanstalkd' => [
                'driver' => 'beanstalkd',
                'host' => 'localhost',
                'queue' => 'default',
                'retry_after' => 90,
                'block_for' => 0,
                'after_commit' => false,
            ],
            'sqs' => [
                'driver' => 'sqs',
                'key' => null,
                'secret' => null,
                'prefix' => 'https://sqs.us-east-1.amazonaws.com/your-account-id',
                'queue' => 'default',
                'suffix' => null,
                'region' => 'us-east-1',
                'after_commit' => false,
            ],
            'redis' => [
                'driver' => 'redis',
                'connection' => 'default',
                'queue' => 'default',
                'retry_after' => 90,
                'block_for' => null,
                'after_commit' => false,
            ],
            'deferred' => [
                'driver' => 'deferred',
            ],
            'failover' => [
                'driver' => 'failover',
                'connections' => [
                    0 => 'database',
                    1 => 'deferred',
                ],
            ],
        ],
        'batching' => [
            'database' => 'mysql',
            'table' => 'job_batches',
        ],
        'failed' => [
            'driver' => 'database-uuids',
            'database' => 'mysql',
            'table' => 'failed_jobs',
        ],
    ],
    'sanctum' => [
        'stateful' => [
            0 => '127.0.0.1:4200',
        ],
        'guard' => [
            0 => 'web',
        ],
        'expiration' => null,
        'token_prefix' => '',
        'middleware' => [
            'authenticate_session' => 'Laravel\\Sanctum\\Http\\Middleware\\AuthenticateSession',
            'encrypt_cookies' => 'Illuminate\\Cookie\\Middleware\\EncryptCookies',
            'validate_csrf_token' => 'Illuminate\\Foundation\\Http\\Middleware\\ValidateCsrfToken',
        ],
    ],
    'services' => [
        'postmark' => [
            'token' => null,
        ],
        'resend' => [
            'key' => null,
        ],
        'ses' => [
            'key' => null,
            'secret' => null,
            'region' => 'us-east-1',
        ],
        'slack' => [
            'notifications' => [
                'bot_user_oauth_token' => null,
                'channel' => null,
            ],
        ],
    ],
    'session' => [
        'driver' => 'cookie',
        'lifetime' => 120,
        'expire_on_close' => false,
        'encrypt' => true,
        'files' => 'D:\\zephyrcohu-spa\\storage\\framework/sessions',
        'connection' => null,
        'table' => 'sessions',
        'store' => null,
        'lottery' => [
            0 => 2,
            1 => 100,
        ],
        'cookie' => 'zephyrcohu-spa-session',
        'path' => '/',
        'domain' => null,
        'secure' => false,
        'http_only' => true,
        'same_site' => 'lax',
        'partitioned' => false,
    ],
    'tinker' => [
        'commands' => [
        ],
        'alias' => [
        ],
        'dont_alias' => [
            0 => 'App\\Nova',
        ],
    ],
];
