<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppUser extends Model
{
    protected $table = 'app_users';

    protected $guarded = ['id'];

    protected $hidden = ['password_hash'];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login_at' => 'datetime',
    ];

    public const ROLES = ['dp_agent', 'aref_validator', 'aref_director', 'dev'];

    public function setPassword(string $plain): void
    {
        $this->password_hash = password_hash($plain, PASSWORD_BCRYPT);
    }

    public function checkPassword(string $plain): bool
    {
        return ! empty($this->password_hash) && password_verify($plain, $this->password_hash);
    }

    // حساب بلا كلمة سر (مزروع ولم يفعّله المسؤول بعد) لا يمكنه الدخول.
    public function canSignIn(): bool
    {
        return $this->is_active && ! empty($this->password_hash);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'dev';
    }
}
