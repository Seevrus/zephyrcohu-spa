<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin {
    /**
     * Reject anyone who is not a logged in administrator with a 404, so that the
     * existence of the admin API is not disclosed.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response {
        $user = $request->user('sanctum');

        if (! $user || ! $user->admin) {
            abort(404);
        }

        return $next($request);
    }
}
