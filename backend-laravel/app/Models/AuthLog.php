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

    // تسجيل حدث مصادقة (دخول/فشل/خروج/إنشاء مستخدم...) مع مصدر الطلب.
    public static function record(Request $request, string $event, bool $success = true, ?AppUser $user = null, ?string $username = null, ?string $reason = null): void
    {
        static::create([
            'user_id' => $user?->id,
            'username' => $user?->username ?? $username,
            'event' => $event,
            'success' => $success,
            'reason' => $reason,
            'role' => $user?->role,
            'dp_code' => $user?->dp_code,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
            'created_at' => now(),
        ]);
    }
}
