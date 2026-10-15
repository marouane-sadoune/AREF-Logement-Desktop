<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppUser;
use App\Models\AuthLog;
use App\Models\AuthToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    private const TOKEN_TTL_DAYS = 30;

    /**
     * الحسابات القياسية تُزرع معطّلة وبلا كلمة سر: يفعّلها مسؤول النظام
     * ويمنحها كلمة سر عند التسليم، فلا يوجد أي حساب جاهز في نسخة العميل.
     */
    private const STANDARD_ACCOUNTS = [
        ['username' => 'agent_oujda', 'full_name' => 'مصلحة تدبير السكنيات - DP وجدة أنكاد', 'role' => 'dp_agent', 'dp_code' => 'OUJ', 'dp_name_ar' => 'المديرية الإقليمية بوجدة أنكاد', 'title' => 'ممثل المديرية الإقليمية بوجدة أنكاد'],
        ['username' => 'agent_berkane', 'full_name' => 'مصلحة تدبير السكنيات - DP بركان', 'role' => 'dp_agent', 'dp_code' => 'BRK', 'dp_name_ar' => 'المديرية الإقليمية ببركان', 'title' => 'ممثل المديرية الإقليمية ببركان'],
        ['username' => 'agent_nador', 'full_name' => 'مصلحة تدبير السكنيات - DP الناظور', 'role' => 'dp_agent', 'dp_code' => 'NAD', 'dp_name_ar' => 'المديرية الإقليمية بالناظور', 'title' => 'ممثل المديرية الإقليمية بالناظور'],
        ['username' => 'agent_driouch', 'full_name' => 'مصلحة تدبير السكنيات - DP الدريوش', 'role' => 'dp_agent', 'dp_code' => 'DRI', 'dp_name_ar' => 'المديرية الإقليمية بالدريوش', 'title' => 'ممثل المديرية الإقليمية بالدريوش'],
        ['username' => 'agent_taourirt', 'full_name' => 'مصلحة تدبير السكنيات - DP تاوريرت', 'role' => 'dp_agent', 'dp_code' => 'TAO', 'dp_name_ar' => 'المديرية الإقليمية بتاوريرت', 'title' => 'ممثل المديرية الإقليمية بتاوريرت'],
        ['username' => 'agent_guercif', 'full_name' => 'مصلحة تدبير السكنيات - DP جرسيف', 'role' => 'dp_agent', 'dp_code' => 'GUE', 'dp_name_ar' => 'المديرية الإقليمية بجرسيف', 'title' => 'ممثل المديرية الإقليمية بجرسيف'],
        ['username' => 'agent_jerada', 'full_name' => 'مصلحة تدبير السكنيات - DP جرادة', 'role' => 'dp_agent', 'dp_code' => 'JER', 'dp_name_ar' => 'المديرية الإقليمية بجرادة', 'title' => 'ممثل المديرية الإقليمية بجرادة'],
        ['username' => 'agent_figuig', 'full_name' => 'مصلحة تدبير السكنيات - DP فكيك (بوعرفة)', 'role' => 'dp_agent', 'dp_code' => 'FIG', 'dp_name_ar' => 'المديرية الإقليمية بفكيك (بوعرفة)', 'title' => 'ممثل المديرية الإقليمية بفكيك'],
        ['username' => 'validateur_aref', 'full_name' => 'رئيس مصلحة الممتلكات والسكنيات بالأكاديمية', 'role' => 'aref_validator', 'title' => 'مسؤول التدقيق والافتحاص الجهوي (AREF)'],
        ['username' => 'directeur_aref', 'full_name' => 'السيد مدير الأكاديمية الجهوية لجهة الشرق', 'role' => 'aref_director', 'title' => 'مدير الأكاديمية الجهوية (صاحب القرار النهائي والتوقيع)'],
    ];

    // حالة النظام قبل الدخول: هل يحتاج ضبط مسؤول أول؟
    public function status(): JsonResponse
    {
        $admin = AppUser::where('role', 'dev')->first();

        return response()->json([
            'needs_setup' => ! $admin || empty($admin->password_hash),
            'username' => $admin?->username,
        ]);
    }

    public function setup(Request $request): JsonResponse
    {
        if (AppUser::where('role', 'dev')->whereNotNull('password_hash')->exists()) {
            return response()->json(['message' => 'تم ضبط حساب مسؤول النظام مسبقًا.'], 403);
        }

        $validated = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:40', 'regex:/^[a-zA-Z0-9._-]+$/'],
            'full_name' => 'required|string|max:160',
            'password' => 'required|string|min:8|max:200',
        ]);

        $admin = DB::transaction(function () use ($validated) {
            $user = AppUser::updateOrCreate(
                ['role' => 'dev'],
                [
                    'username' => strtolower($validated['username']),
                    'full_name' => $validated['full_name'],
                    'title' => 'مسؤول النظام (Super Admin)',
                    'is_active' => true,
                ]
            );
            $user->setPassword($validated['password']);
            $user->save();

            foreach (self::STANDARD_ACCOUNTS as $account) {
                if (! AppUser::where('username', $account['username'])->exists()) {
                    AppUser::create($account + ['is_active' => false]);
                }
            }

            return $user;
        });

        AuthLog::record($request, 'setup', ['actor' => $admin]);

        return response()->json([
            'message' => 'تم ضبط مسؤول النظام بنجاح.',
            'data' => $this->issueSession($admin),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|max:60',
            'password' => 'required|string|max:200',
        ]);

        $username = strtolower(trim($validated['username']));
        $user = AppUser::whereRaw('lower(username) = ?', [$username])->first();

        if (! $user) {
            AuthLog::record($request, 'login_failed', ['attempted' => $username, 'reason' => 'unknown_user', 'success' => false]);

            return response()->json(['message' => 'اسم المستخدم أو كلمة السر غير صحيحة.'], 401);
        }

        if (! $user->is_active) {
            AuthLog::record($request, 'login_failed', ['actor' => $user, 'reason' => 'disabled', 'success' => false]);

            return response()->json(['message' => 'هذا الحساب غير مُفعّل بعد. تواصل مع مسؤول النظام.'], 403);
        }

        if (empty($user->password_hash)) {
            AuthLog::record($request, 'login_failed', ['actor' => $user, 'reason' => 'password_not_set', 'success' => false]);

            return response()->json(['message' => 'لم تُضبط كلمة سر لهذا الحساب بعد. تواصل مع مسؤول النظام.'], 403);
        }

        if (! $user->checkPassword($validated['password'])) {
            AuthLog::record($request, 'login_failed', ['actor' => $user, 'reason' => 'wrong_password', 'success' => false]);

            return response()->json(['message' => 'اسم المستخدم أو كلمة السر غير صحيحة.'], 401);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        AuthLog::record($request, 'login_success', ['actor' => $user]);

        return response()->json(['data' => $this->issueSession($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $token = $request->bearerToken() ?: $request->query('t');

        if ($token) {
            AuthToken::where('token', $token)->delete();
        }

        AuthLog::record($request, 'logout', ['actor' => $user]);

        return response()->json(['message' => 'تم تسجيل الخروج.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->userPayload($request->attributes->get('auth_user'))]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        $validated = $request->validate([
            'current_password' => 'required|string|max:200',
            'password' => 'required|string|min:8|max:200',
        ]);

        if (! $user->checkPassword($validated['current_password'])) {
            AuthLog::record($request, 'password_change_failed', ['actor' => $user, 'reason' => 'wrong_password', 'success' => false]);

            return response()->json(['message' => 'كلمة السر الحالية غير صحيحة.'], 422);
        }

        $user->setPassword($validated['password']);
        $user->save();

        // إنهاء كل الجلسات الأخرى لهذا الحساب بعد تغيير كلمة السر.
        AuthToken::where('user_id', $user->id)
            ->where('token', '!=', $request->bearerToken() ?: $request->query('t'))
            ->delete();

        AuthLog::record($request, 'password_changed', ['actor' => $user]);

        return response()->json(['message' => 'تم تحديث كلمة السر.']);
    }

    // سجلّ الدخول: مسؤول النظام ومدير الأكاديمية فقط.
    public function logs(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        if (! in_array($user->role, ['dev', 'aref_director'], true)) {
            return response()->json(['message' => 'سجلّ الدخول متاح لمسؤول النظام ومدير الأكاديمية فقط.'], 403);
        }

        $query = AuthLog::query();

        if ($request->filled('event')) {
            $query->where('event', $request->string('event')->toString());
        }
        if ($request->filled('username')) {
            $query->where('username', 'like', '%'.$request->string('username')->toString().'%');
        }
        if ($request->has('success') && $request->query('success') !== '') {
            $query->where('success', filter_var($request->query('success'), FILTER_VALIDATE_BOOLEAN));
        }

        $page = max(1, (int) $request->query('page', 1));
        $perPage = min(200, max(10, (int) $request->query('per_page', 100)));
        $total = (clone $query)->count();
        $rows = $query->orderByDesc('id')->forPage($page, $perPage)->get();

        return response()->json([
            'data' => $rows,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
        ]);
    }

    private function issueSession(AppUser $user): array
    {
        $token = AuthToken::create([
            'token' => bin2hex(random_bytes(32)),
            'user_id' => $user->id,
            'created_at' => now(),
            'expires_at' => now()->addDays(self::TOKEN_TTL_DAYS),
        ]);

        return [
            'token' => $token->token,
            'user' => $this->userPayload($user),
        ];
    }

    private function userPayload(AppUser $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'full_name' => $user->full_name,
            'role' => $user->role,
            'dp_code' => $user->dp_code,
            'dp_name_ar' => $user->dp_name_ar,
            'title' => $user->title,
            'is_active' => (bool) $user->is_active,
            'has_password' => ! empty($user->password_hash),
            'last_login_at' => $user->last_login_at?->toIso8601String(),
        ];
    }
}
