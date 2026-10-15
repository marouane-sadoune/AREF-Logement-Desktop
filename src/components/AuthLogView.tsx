import { useCallback, useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, RefreshCw, Search } from 'lucide-react';
import { fetchAuthLogs, AuthLogEntry } from '../api/client';

const EVENT_LABELS_AR: Record<string, string> = {
  setup: 'ضبط مسؤول النظام',
  login_success: 'دخول ناجح',
  login_failed: 'محاولة دخول فاشلة',
  logout: 'تسجيل خروج',
  password_changed: 'تغيير كلمة السر',
  password_change_failed: 'فشل تغيير كلمة السر',
  user_created: 'إنشاء حساب',
  user_updated: 'تعديل حساب',
  user_password_reset: 'إعادة ضبط كلمة سر',
  user_deleted: 'حذف حساب',
};

const REASON_LABELS_AR: Record<string, string> = {
  unknown_user: 'اسم مستخدم غير موجود',
  wrong_password: 'كلمة سر خاطئة',
  disabled: 'حساب معطّل',
  password_not_set: 'لم تُضبط كلمة السر',
};

const PER_PAGE = 100;

export const AuthLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuthLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [eventFilter, setEventFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState('');

  const load = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAuthLogs({
        event: eventFilter || undefined,
        username: usernameFilter.trim() || undefined,
        success: successFilter || undefined,
        page: targetPage,
      });
      setLogs(res.data || []);
      setTotal(res.total || 0);
      setPage(targetPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل سجلّ الدخول.');
    } finally {
      setIsLoading(false);
    }
  }, [eventFilter, usernameFilter, successFilter]);

  useEffect(() => {
    load(1);
  }, [load]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const failedCount = logs.filter(l => !l.success).length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e2e6e2] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              سجلّ الدخول والأمن
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              كل محاولة دخول وخروج وتغيير كلمة سر تُسجَّل هنا ولا يمكن تعديلها من داخل المنصة.
            </p>
          </div>
          <div className="flex items-center gap-4 text-center">
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
              <div className="text-base font-bold text-slate-800">{total}</div>
              <div className="text-[10px] text-slate-500">مجموع الأحداث</div>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
              <div className="text-base font-bold text-rose-700">{failedCount}</div>
              <div className="text-[10px] text-rose-600">أحداث فاشلة (هذه الصفحة)</div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,auto))]">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={usernameFilter}
              onChange={e => setUsernameFilter(e.target.value)}
              placeholder='بحث باسم المستخدم'
              className="h-10 w-full rounded-md border border-slate-300 bg-white pr-9 pl-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
          </div>
          <select
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-700"
          >
            <option value="">كل الأحداث</option>
            {Object.entries(EVENT_LABELS_AR).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={successFilter}
            onChange={e => setSuccessFilter(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-700"
          >
            <option value="">الكل</option>
            <option value="1">ناجحة</option>
            <option value="0">فاشلة</option>
          </select>
          <button
            type="button"
            onClick={() => load(page)}
            className="h-10 rounded-md border border-emerald-200 bg-emerald-50 px-4 text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#e2e6e2] bg-white overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-sm text-rose-700">{error}</div>
        ) : isLoading && logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">جارٍ تحميل السجل…</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">لا توجد أحداث مطابقة لهذا التصفية.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#f5f7f5] text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-bold">التاريخ والوقت</th>
                  <th className="px-4 py-3 font-bold">الحدث</th>
                  <th className="px-4 py-3 font-bold">المستخدم</th>
                  <th className="px-4 py-3 font-bold">النتيجة</th>
                  <th className="px-4 py-3 font-bold">الحساب المعني</th>
                  <th className="px-4 py-3 font-bold">العنوان IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className={log.success ? 'hover:bg-slate-50' : 'bg-rose-50/50 hover:bg-rose-50'}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-600" dir="ltr">
                      {log.created_at ? new Date(log.created_at).toLocaleString('fr-MA') : '—'}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">
                      {EVENT_LABELS_AR[log.event] || log.event}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700" dir="ltr">
                      {log.username || '—'}
                      {log.role && (
                        <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                          {log.dp_code || log.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <ShieldCheck className="h-3 w-3" /> نجاح
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                          <ShieldAlert className="h-3 w-3" />
                          {REASON_LABELS_AR[log.reason || ''] || log.reason || 'فشل'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600" dir="ltr">{log.target_username || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500" dir="ltr">{log.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>صفحة {page} من {pageCount}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => load(page - 1)}
              className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40 hover:bg-slate-50"
            >
              الأحدث
            </button>
            <button
              type="button"
              disabled={page >= pageCount || isLoading}
              onClick={() => load(page + 1)}
              className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40 hover:bg-slate-50"
            >
              الأقدم
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthLogView;
