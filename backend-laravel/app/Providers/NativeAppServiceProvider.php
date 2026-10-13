<?php

namespace App\Providers;

use Native\Desktop\Facades\Window;
use Native\Desktop\Contracts\ProvidesPhpIni;

class NativeAppServiceProvider implements ProvidesPhpIni
{
    /**
     * Executed once the native application has been booted.
     * Use this method to open windows, register global shortcuts, etc.
     */
    public function boot(): void
    {
        // NativePHP starts this Laravel app on 127.0.0.1:8100 (first free port
        // in 8100-9000). Load the window over plain HTTP so the SPA's relative
        // /api/v1 calls hit the same origin; the default URL scheme breaks fetch().
        Window::open()->url('http://127.0.0.1:8100');
    }

    /**
     * Return an array of php.ini directives to be set.
     */
    public function phpIni(): array
    {
        return [
        ];
    }
}
