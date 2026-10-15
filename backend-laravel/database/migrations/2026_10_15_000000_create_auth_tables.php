<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_users', function (Blueprint $table) {
            $table->id();
            $table->string('username')->unique();
            $table->string('full_name');
            $table->string('role')->default('dp_agent');
            $table->string('dp_code')->nullable();
            $table->string('dp_name_ar')->nullable();
            $table->string('title')->nullable();
            $table->string('password_hash')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
        });

        Schema::create('auth_tokens', function (Blueprint $table) {
            $table->string('token', 64)->primary();
            $table->unsignedBigInteger('user_id')->index();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
        });

        Schema::create('auth_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('username')->nullable();
            $table->string('event');
            $table->boolean('success')->default(true);
            $table->string('reason')->nullable();
            $table->string('target_username')->nullable();
            $table->string('role')->nullable();
            $table->string('dp_code')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auth_logs');
        Schema::dropIfExists('auth_tokens');
        Schema::dropIfExists('app_users');
    }
};
