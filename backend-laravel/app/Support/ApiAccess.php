<?php

namespace App\Support;

use App\Models\AppUser;
use App\Models\DemandeLogement;
use Illuminate\Http\Request;

// سياسة الولوج المطابقة لما تسمح به الواجهة (src/types/auth.ts): تُطبَّق في الخادم
// حتى لا يستطيع مستعمل التقويم مباشرة أن يتجاوز صلاحيته أو يطلع على ملفات مديرية أخرى.
class ApiAccess
{
    public const DP_AGENT = 'dp_agent';

    public const OFFICIAL_DOC_ROLES = ['aref_director', 'dev'];

    public const STATUS_BY_ROLE = [
        'dp_agent' => ['draft', 'submitted_dp', 'under_review_dp', 'transmitted_aref', 'rejected'],
        'aref_validator' => ['under_review_dp', 'transmitted_aref', 'rejected'],
        'aref_director' => ['approved', 'rejected'],
        'dev' => ['draft', 'submitted_dp', 'under_review_dp', 'transmitted_aref', 'approved', 'rejected'],
    ];

    public static function user(Request $request): ?AppUser
    {
        return $request->attributes->get('auth_user');
    }

    public static function role(Request $request): string
    {
        return self::user($request)?->role ?? '';
    }

    public static function isDpAgent(Request $request): bool
    {
        return self::role($request) === self::DP_AGENT;
    }

    public static function assertCanGenerateOfficialDocument(Request $request): void
    {
        if (! in_array(self::role($request), self::OFFICIAL_DOC_ROLES, true)) {
            abort(403, 'عقد الإسناد ومحضر التسليم مخصّصان للسيد مدير الأكاديمية.');
        }
    }

    public static function assertCanUploadSupportingDocument(Request $request): void
    {
        if (! in_array(self::role($request), [self::DP_AGENT, 'dev'], true)) {
            abort(403, 'إيداع وثائق الملف من صلاحيات ممثلة(ه) المديرية الإقليمية.');
        }
    }

    public static function assertStatusAllowed(Request $request, string $status): void
    {
        $allowed = self::STATUS_BY_ROLE[self::role($request)] ?? [];

        abort_unless(
            in_array($status, $allowed, true),
            403,
            'هذا القرار لا تدخل ضمن صلاحيات حسابك في مسار المذكرة 40.'
        );
    }

    // مطابقة الملف لمديرية الحساب: الاسم العربي الكامل أو رمزه (OUJ، BRK، ...).
    public static function belongsToDp(?AppUser $user, ?string $directionProvinciale): bool
    {
        if (! $user || $user->role !== self::DP_AGENT) {
            return true;
        }

        $dossierDp = trim((string) $directionProvinciale);
        $accountDp = trim((string) $user->dp_name_ar);

        if ($dossierDp === '') {
            return false;
        }

        if ($accountDp !== '' && $dossierDp === $accountDp) {
            return true;
        }

        $code = strtoupper(trim((string) $user->dp_code));

        return $code !== '' && mb_strpos(mb_strtoupper($dossierDp), $code) !== false;
    }

    public static function assertDossierVisible(Request $request, DemandeLogement $demande): void
    {
        $candidate = $demande->candidat;

        abort_unless(
            self::belongsToDp(self::user($request), $candidate?->direction_provinciale),
            403,
            'هذا الملف يعود إلى مديرية إقليمية أخرى.'
        );
    }

    // سجلّ المسار يحمل اسم الحساب المصادَق عليه، لا ما أرسلته الواجهة.
    public static function actorLabel(Request $request, ?string $fallback = null): ?string
    {
        $user = self::user($request);

        if (! $user) {
            return $fallback;
        }

        return $user->full_name ? "{$user->full_name} ({$user->username})" : $user->username;
    }
}
