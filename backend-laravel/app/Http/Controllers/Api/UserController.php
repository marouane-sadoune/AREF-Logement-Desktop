<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppUser;
use App\Models\AuthLog;
use App\Models\AuthToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => AppUser::orderByRaw('case when role = ? then 0 else 1 end', ['dev'])
                ->orderBy('username')
                ->get()
                ->map(fn (AppUser $u) => $this->payload($u)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|min:3|max:40|regex:/^[a-zA-Z0-9._-]+$/|unique:app_users,username',
            'full_name' => 'required|string|max:160',
            'role' => ['required', Rule::in(AppUser::ROLES)],
            'dp_code' => 'nullable|string|max:10',
            'dp_name_ar' => 'nullable|string|max:120',
            'title' => 'nullable|string|max:160',
            'password' => 'required|string|min:8|max:200',
            'is_active' => 'sometimes|boolean',
        ]);

        $user = new AppUser([
            ...collect($validated)->except('password')->all(),
            'username' => strtolower($validated['username']),
            'is_active' => $validated['is_active'] ?? true,
        ]);
        $user->setPassword($validated['password']);
        $user->save();

        AuthLog::record($request, 'user_created', ['actor' => $request->attributes->get('auth_user'), 'target' => $user->username]);

        return response()->json(['message' => 'تم إنشاء الحساب.', 'data' => $this->payload($user)], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $user = AppUser::findOrFail($id);

        $validated = $request->validate([
            'full_name' => 'sometimes|string|max:160',
            'role' => ['sometimes', Rule::in(AppUser::ROLES)],
            'dp_code' => 'nullable|string|max:10',
            'dp_name_ar' => 'nullable|string|max:120',
            'title' => 'nullable|string|max:160',
            'is_active' => 'sometimes|boolean',
        ]);

        // لا يُسمح بإيقاف آخر حساب مسؤول نشِط، ولا بإيقاف الحساب الجاري.
        if (array_key_exists('is_active', $validated) && ! $validated['is_active']) {
            $this->guardAgainstDisablingAdmin($request, $user);
        }

        $user->fill($validated)->save();

        AuthLog::record($request, 'user_updated', ['actor' => $request->attributes->get('auth_user'), 'target' => $user->username]);

        return response()->json(['message' => 'تم تحديث الحساب.', 'data' => $this->payload($user)]);
    }

    public function resetPassword(Request $request, $id): JsonResponse
    {
        $user = AppUser::findOrFail($id);

        $validated = $request->validate([
            'password' => 'required|string|min:8|max:200',
            'revoke_sessions' => 'sometimes|boolean',
        ]);

        $user->setPassword($validated['password']);
        $user->save();

        if ($validated['revoke_sessions'] ?? true) {
            AuthToken::where('user_id', $user->id)->delete();
        }

        AuthLog::record($request, 'user_password_reset', ['actor' => $request->attributes->get('auth_user'), 'target' => $user->username]);

        return response()->json(['message' => 'تم ضبط كلمة السر للحساب.']);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $user = AppUser::findOrFail($id);
        $current = $request->attributes->get('auth_user');

        if ($current->id === $user->id) {
            return response()->json(['message' => 'لا يمكنك حذف الحساب الذي تستعمله الآن.'], 422);
        }

        if ($user->role === 'dev') {
            return response()->json(['message' => 'حساب مسؤول النظام لا يُحذف؛ استخدم إعادة ضبط كلمة السر.'], 422);
        }

        AuthToken::where('user_id', $user->id)->delete();
        $username = $user->username;
        $user->delete();

        AuthLog::record($request, 'user_deleted', ['actor' => $current, 'target' => $username]);

        return response()->json(['message' => 'تم حذف الحساب.']);
    }

    private function guardAgainstDisablingAdmin(Request $request, AppUser $user): void
    {
        $current = $request->attributes->get('auth_user');

        if ($current->id === $user->id) {
            abort(422, 'لا يمكنك تعطيل الحساب الذي تستعمله الآن.');
        }

        if ($user->role === 'dev' && AppUser::where('role', 'dev')->where('is_active', true)->count() <= 1) {
            abort(422, 'لا يمكن تعطيل حساب مسؤول النظام الوحيد.');
        }
    }

    private function payload(AppUser $user): array
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
