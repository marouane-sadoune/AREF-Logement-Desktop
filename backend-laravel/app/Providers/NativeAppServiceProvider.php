<?php

namespace App\Providers;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Native\Desktop\Facades\Window;
use Native\Desktop\Contracts\ProvidesPhpIni;
use Throwable;

class NativeAppServiceProvider implements ProvidesPhpIni
{
    /**
     * Executed once the native application has been booted.
     * Use this method to open windows, register global shortcuts, etc.
     */
    public function boot(): void
    {
        $this->bootstrapPackagedDatabase();

        // NativePHP starts this Laravel app on 127.0.0.1:8100 (first free port
        // in 8100-9000). Load the window over plain HTTP so the SPA's relative
        // /api/v1 calls hit the same origin; the default URL scheme breaks fetch().
        Window::open()
            ->id('main')
            ->url('http://127.0.0.1:8100')
            ->width(1440)
            ->height(900)
            ->minWidth(1120)
            ->minHeight(700)
            ->center()
            ->rememberState();
    }

    /**
     * In the packaged app (APP_DEBUG=false) the SQLite database lives in the
     * user's AppData folder and starts empty: create it, migrate, and seed the
     * demo campaign so the installed app is usable on first launch.
     */
    private function bootstrapPackagedDatabase(): void
    {
        if (config('app.debug')) {
            return;
        }

        $database = config('database.connections.nativephp.database');

        if (! $database) {
            return;
        }

        if (! file_exists($database)) {
            if (! is_dir(dirname($database))) {
                mkdir(dirname($database), 0755, true);
            }
            touch($database);
        }

        // Seeding must never block the window from opening on a user's PC.
        try {
            // Always run pending migrations: an installed app only upgrades its
            // schema this way, since its database outlives the build.
            Artisan::call('native:migrate', ['--force' => true]);

            if (DB::table('demandes_logement')->count() === 0) {
                // native:seed goes through Laravel's confirm()-in-production path,
                // which needs a terminal and dies with "Undefined constant STDIN"
                // inside a packaged app, so the seeder class is run directly.
                $seeder = new DatabaseSeeder(app());
                $seeder->connection = 'nativephp';
                $seeder->run();
            }
        } catch (Throwable $e) {
            report($e);
        }
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
