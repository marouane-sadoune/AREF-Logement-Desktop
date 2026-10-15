<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->attributes->get('auth_user');

        if (! $user || ! $user->isSuperAdmin()) {
            return response()->json(['message' => 'هذه العملية مخصّصة لمسؤول النظام فقط.'], 403);
        }

        return $next($request);
    }
}
