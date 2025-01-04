<?php

use App\ErrorHandling;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\LockedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\HttpKernel\Exception\UnsupportedMediaTypeHttpException;
use Symfony\Component\Routing\Exception\MethodNotAllowedException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(fn (AccessDeniedHttpException $e) => ErrorHandling::forbidden());
        $exceptions->render(fn (BadRequestHttpException $e) => ErrorHandling::bad_request());
        $exceptions->render(fn (HttpException $e) => ErrorHandling::internal_Server_error());
        $exceptions->render(fn (LockedHttpException $e) => ErrorHandling::locked());
        $exceptions->render(fn (MethodNotAllowedException $e) => ErrorHandling::method_not_allowed());
        $exceptions->render(fn (NotFoundHttpException $e) => ErrorHandling::not_found());
        $exceptions->render(fn (UnauthorizedHttpException $e) => ErrorHandling::unauthorized());
        $exceptions->render(fn (UnsupportedMediaTypeHttpException $e) => ErrorHandling::unsupported_media_type());
        $exceptions->render(fn (ThrottleRequestsException $e) => ErrorHandling::too_many_requests());
    })->create();
