<?php

namespace App\Http\Middleware;

use App\Models\AuthToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        // Accept the token as a header or as ?t= — document previews open URLs
        // directly in the browser, which cannot send headers.
        $plain = $request->bearerToken() ?: $request->query('t');

        if (! $plain) {
            return response()->json(['message' => 'غير مصرح: يجب تسجيل الدخول أولاً.'], 401);
        }

        $token = AuthToken::find($plain);

        if (! $token || $token->isExpired()) {
            return response()->json(['message' => 'انتهت صلاحية الجلسة، أعد تسجيل الدخول.'], 401);
        }

        $user = $token->user;

        if (! $user || ! $user->is_active) {
            $token->delete();

            return response()->json(['message' => 'هذا الحساب معطّل.'], 401);
        }

        $token->forceFill(['last_used_at' => now()])->save();

        $request->attributes->set('auth_user', $user);
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
