<?php

use Illuminate\Support\Facades\Route;

// Desktop build: the React SPA (built into public/) is served by this
// Laravel app so the NativePHP window and the API share one origin.
Route::get('/{any?}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '^(?!api).*$');
