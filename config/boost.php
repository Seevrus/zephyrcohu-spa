<?php

return [
    'process_isolation' => [
        'enabled' => env('BOOST_PROCESS_ISOLATION', true),
        'timeout' => env('BOOST_PROCESS_TIMEOUT', 180),
    ],
];
