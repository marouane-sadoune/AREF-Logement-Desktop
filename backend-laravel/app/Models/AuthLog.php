<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuthLog extends Model
{
    protected $table = 'auth_logs';

    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'created_at' => 'datetime',
        'success' => 'boolean',
    ];

    // تسجيل حدث مصادقة أو إدارة حسابات مع مصدر الطلب.
    // $context: actor | attempted | target | reason | success
    public static function record(Request $request, string $event, array $context = []): void
    {
        $actor = $context['actor'] ?? null;

        static::create([
            'user_id' => $actor?->id,
            'username' => $actor?->username ?? ($context['attempted'] ?? null),
            'event' => $event,
            'success' => $context['success'] ?? true,
            'reason' => $context['reason'] ?? null,
            'target_username' => $context['target'] ?? null,
            'role' => $actor?->role,
            'dp_code' => $actor?->dp_code,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
            'created_at' => now(),
        ]);
    }
}
