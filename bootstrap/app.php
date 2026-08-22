<?php

use App\ErrorHandling;
use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Spatie\Csp\AddCspHeaders;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\LockedHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\HttpKernel\Exception\UnsupportedMediaTypeHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(AddCspHeaders::class);
        $middleware->statefulApi();
        $middleware->throttleApi();
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(fn (AccessDeniedHttpException $e) => ErrorHandling::forbidden());
        $exceptions->render(fn (AuthenticationException $e) => ErrorHandling::unauthorized());
        $exceptions->render(fn (BadRequestHttpException $e) => ErrorHandling::bad_request());
        $exceptions->render(fn (LockedHttpException $e) => ErrorHandling::locked());
        $exceptions->render(fn (MethodNotAllowedHttpException $e) => ErrorHandling::method_not_allowed());
        $exceptions->render(fn (NotFoundHttpException $e) => ErrorHandling::not_found());
        $exceptions->render(fn (UnauthorizedHttpException $e) => ErrorHandling::unauthorized());
        $exceptions->render(fn (UnsupportedMediaTypeHttpException $e) => ErrorHandling::unsupported_media_type());
        $exceptions->render(fn (ThrottleRequestsException $e) => ErrorHandling::too_many_requests());

        $exceptions->render(fn (HttpException $e) => ErrorHandling::internal_Server_error());
    })->create();
