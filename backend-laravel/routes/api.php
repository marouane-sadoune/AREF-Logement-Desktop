<?php

use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EvictionController;
use App\Http\Controllers\Api\RegistreLogementController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - AREF Oriental Housing Management System (Note 40)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // المساحة العامة: حالة الضبط وتسجيل الدخول فقط.
    Route::get('/auth/status', [AuthController::class, 'status']);
    Route::post('/auth/setup', [AuthController::class, 'setup']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth.api')->group(function () {

        // الجلسة الحالية وتغيير كلمة السر وسجلّ الدخول.
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
        Route::get('/auth/logs', [AuthController::class, 'logs']);

        // إدارة الحسابات: مسؤول النظام فقط.
        Route::middleware('auth.admin')->prefix('users')->group(function () {
            Route::get('/', [UserController::class, 'index']);
            Route::post('/', [UserController::class, 'store']);
            Route::patch('/{id}', [UserController::class, 'update']);
            Route::post('/{id}/password', [UserController::class, 'resetPassword']);
            Route::delete('/{id}', [UserController::class, 'destroy']);
        });

        // إدارة طلبات الإسناد (Assignments)
        Route::get('/assignments', [AssignmentController::class, 'index']);
        Route::post('/assignments', [AssignmentController::class, 'store']);
        Route::get('/assignments/{id}', [AssignmentController::class, 'show']);
        Route::patch('/assignments/{id}/status', [AssignmentController::class, 'updateStatus']);

        // توليد الوثائق الرسمية والطباعة (PDF Generation)
        Route::get('/assignments/{id}/documents/approval-letter', [DocumentController::class, 'generateApprovalLetter']);
        Route::get('/assignments/{id}/documents/pv-possession', [DocumentController::class, 'generatePvPossession']);

        // رفع وتفقد الوثائق الست الإلزامية المكونة لملف الطلب (Dossier de Demande)
        Route::post('/assignments/{id}/documents/{docKey}', [DocumentController::class, 'uploadSupportingDocument']);
        Route::get('/assignments/{id}/documents/{docKey}', [DocumentController::class, 'downloadSupportingDocument']);

        // حفظ PDF مطابق لورقة الوثيقة المعروضة (نافذة حفظ النظام داخل التطبيق المكتبي)
        Route::post('/documents/save-pdf', [DocumentController::class, 'savePdf']);

        // مساطر إفراغ المساكن الإدارية والوظيفية (المحور 4 من المذكرة 40)
        Route::get('/evictions', [EvictionController::class, 'index']);
        Route::post('/evictions', [EvictionController::class, 'store']);
        Route::patch('/evictions/{id}', [EvictionController::class, 'update']);
        Route::delete('/evictions/{id}', [EvictionController::class, 'destroy']);

        // المسجل المركزي للمساكن (Registre des Logements — المذكرة 40)
        Route::get('/logements', [RegistreLogementController::class, 'index']);
        Route::post('/logements', [RegistreLogementController::class, 'store']);
        Route::get('/logements/{id}', [RegistreLogementController::class, 'show']);
        Route::patch('/logements/{id}', [RegistreLogementController::class, 'update']);
        Route::delete('/logements/{id}', [RegistreLogementController::class, 'destroy']);
    });
});
