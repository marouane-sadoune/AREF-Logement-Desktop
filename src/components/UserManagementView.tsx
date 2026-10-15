import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  Building,
  Stamp,
  FileCheck2,
  Code,
  MapPin,
  Trash2,
  CheckCircle,
  XCircle,
  KeyRound,
  Check,
  RefreshCw,
  Search,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { ORIENTAL_DIRECTORATES } from '../types/housing';
import {
  ApiUser,
  createUserAccount,
  deleteUserAccount,
  fetchUsers,
  resetUserPassword,
  updateUserAccount
} from '../api/client';
import Swal from 'sweetalert2';

const ROLE_META: Record<UserRole, { label: string; badge: string; icon: typeof Building; desc: string }> = {
  dp_agent: {
    label: '1. ممثل المديرية الإقليمية',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: Building,
    desc: 'مُدخل ومعالج بيانات بإقليمه فقط - إدخال المعطيات وقفل الملفات وإرسالها للأكاديمية'
  },
  aref_validator: {
    label: '2. مسؤول الأكاديمية الجهوية',
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
    icon: FileCheck2,
    desc: 'المراقب والمدقق الجهوي - تدقيق ملفات المديريات الثماني والموافقة المبدئية أو الإرجاع'
  },
  aref_director: {
    label: '3. مدير الأكاديمية الجهوية',
    badge: 'bg-amber-50 text-amber-900 border-amber-200',
    icon: Stamp,
    desc: 'صاحب القرار النهائي والتوقيعات - المصادقة وتوليد عقود الإسناد الرسمية وسجلّ الدخول'
  },
  dev: {
    label: '4. مسؤول النظام',
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: Code,
    desc: 'المشرف التقني (Super Admin) - إنشاء الحسابات وضبط كلمات السر وإدارة قاعدة البيانات'
  }
};

export const UserManagementView: React.FC = () => {
  const { currentUser, updateOwnPassword } = useAuth();

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [isSaving, setIsSaving] = useState(false);

  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('dp_agent');
  const [newDpCode, setNewDpCode] = useState('OUJ');
  const [newTitle, setNewTitle] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [ownPwMessage, setOwnPwMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setUsers(await fetchUsers());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'تعذّر تحميل الحسابات.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter(u => {
      const matchesSearch =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.dp_name_ar || '').includes(searchQuery.trim());
      return matchesSearch && (roleFilter === 'all' || u.role === roleFilter);
    });
  }, [users, searchQuery, roleFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      Swal.fire({
        icon: 'warning',
        title: 'كلمة السر قصيرة',
        text: 'يجب أن تتكون كلمة السر من 8 أحرف على الأقل.',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#059669'
      });
      return;
    }

    const selectedDp = ORIENTAL_DIRECTORATES.find(d => d.code === newDpCode);
    setIsSaving(true);
    try {
      await createUserAccount({
        username: newUsername.trim().toLowerCase(),
        full_name: newFullName.trim(),
        role: newRole,
        dp_code: newRole === 'dp_agent' ? newDpCode : null,
        dp_name_ar: newRole === 'dp_agent' ? selectedDp?.nameAr || null : null,
        title:
          newTitle.trim() ||
          (newRole === 'dp_agent'
            ? `ممثل ${selectedDp?.nameAr || 'المديرية الإقليمية'}`
            : ROLE_META[newRole].desc),
        password: newPassword,
        is_active: true
      });
      setShowAddModal(false);
      setNewFullName('');
      setNewUsername('');
      setNewTitle('');
      setNewPassword('');
      await loadUsers();
      Swal.fire({
        icon: 'success',
        title: 'تم إنشاء الحساب',
        text: 'يمكن تسليم اسم الدخول وكلمة السر للمستخدم الآن.',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#059669'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'تعذّر إنشاء الحساب',
        text: err instanceof Error ? err.message : 'خطأ غير معروف.',
        confirmButtonText: 'إغلاق',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (user: ApiUser) => {
    try {
      await updateUserAccount(user.id, { is_active: !user.is_active });
      await loadUsers();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'تعذّر تغيير الحالة',
        text: err instanceof Error ? err.message : 'خطأ غير معروف.',
        confirmButtonText: 'إغلاق',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleResetPassword = async (user: ApiUser) => {
    const { value, isConfirmed } = await Swal.fire({
      icon: 'warning',
      title: `ضبط كلمة سر "${user.username}"`,
      html: '<p class="text-xs text-slate-600 mb-3">الحساب الحالي لنفسه لا يُضبط من هنا؛ استخدم بطاقة "كلمة سر حسابي".</p>',
      input: 'text',
      inputPlaceholder: 'كلمة سر جديدة (8 أحرف على الأقل)',
      inputAttributes: { autocapitalize: 'off', spellcheck: 'false' },
      showCancelButton: true,
      confirmButtonText: 'ضبط كلمة السر',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      preConfirm: (v: string) => {
        if (!v || v.trim().length < 8) {
          Swal.showValidationMessage('يجب أن تتكون كلمة السر من 8 أحرف على الأقل.');
          return false;
        }
        return v;
      }
    });
    if (!isConfirmed) return;

    try {
      await resetUserPassword(user.id, String(value).trim());
      await loadUsers();
      Swal.fire({
        icon: 'success',
        title: 'تم ضبط كلمة السر',
        text: 'انتهت كل جلسات هذا الحساب المفتوحة حالياً.',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#059669'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'تعذّر ضبط كلمة السر',
        text: err instanceof Error ? err.message : 'خطأ غير معروف.',
        confirmButtonText: 'إغلاق',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteUser = async (user: ApiUser) => {
    const ok = await Swal.fire({
      icon: 'warning',
      title: 'حذف الحساب؟',
      text: `سيتم حذف حساب "${user.full_name}" نهائياً وإنهاء جلساته.`,
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b'
    });
    if (!ok.isConfirmed) return;

    try {
      await deleteUserAccount(user.id);
      await loadUsers();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'تعذّر حذف الحساب',
        text: err instanceof Error ? err.message : 'خطأ غير معروف.',
        confirmButtonText: 'إغلاق',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnPwMessage(null);
    if (newPw.length < 8) {
      setOwnPwMessage({ kind: 'err', text: 'يجب أن تتكون كلمة السر الجديدة من 8 أحرف على الأقل.' });
      return;
    }
    if (newPw !== confirmPw) {
      setOwnPwMessage({ kind: 'err', text: 'كلمتا السر غير متطابقتين.' });
      return;
    }

    const message = await updateOwnPassword(currentPw, newPw);
    if (message) {
      setOwnPwMessage({ kind: 'err', text: message });
      return;
    }
    setOwnPwMessage({ kind: 'ok', text: 'تم تحديث كلمة سر حسابك. الجلسات الأخرى أُنهيت.' });
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-2xl border border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              لوحة تحكم مسؤول النظام
            </span>
            <span className="text-slate-400 text-xs">·</span>
            <span className="text-slate-300 text-xs">الحسابات مخزّنة في قاعدة البيانات المحلية</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            إدارة المستخدمين والأدوار والارتباطات الإقليمية
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            لا يوجد أي حساب جاهز في النسخة: أنشئ الحسابات بنفسك، اضبط كلمات سرها، وعطّل من ينتهي عمله. كل عملية تُسجَّل في سجلّ الدخول.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadUsers}
            className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>
      </div>

      {/* Change own password */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-sm text-slate-900">كلمة سر حسابي ({currentUser.username})</h3>
        </div>
        <form onSubmit={handleChangeOwnPassword} className="grid gap-3 md:grid-cols-4 md:items-end">
          <label className="block text-[11px] font-bold text-slate-600">
            كلمة السر الحالية
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-emerald-500"
            />
          </label>
          <label className="block text-[11px] font-bold text-slate-600">
            كلمة سر جديدة (8 أحرف+)
            <input
              type="password"
              required
              autoComplete="new-password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-emerald-500"
            />
          </label>
          <label className="block text-[11px] font-bold text-slate-600">
            تأكيد الجديدة
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-emerald-500"
            />
          </label>
          <button
            type="submit"
            className="h-[42px] px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
          >
            <KeyRound className="w-4 h-4" />
            <span>تحديث كلمة سر حسابي</span>
          </button>
        </form>
        {ownPwMessage && (
          <p
            className={`mt-3 rounded-md border px-3 py-2 text-[11px] ${
              ownPwMessage.kind === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {ownPwMessage.text}
          </p>
        )}
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['dp_agent', 'aref_validator', 'aref_director', 'dev'] as UserRole[]).map(role => {
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          return (
            <div key={role} className={`bg-white p-4 rounded-xl border shadow-2xs space-y-2 ${
              role === 'aref_director' ? 'border-amber-200' :
              role === 'aref_validator' ? 'border-teal-200' :
              role === 'dev' ? 'border-slate-300' : 'border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg border ${meta.badge}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  {users.filter(u => u.role === role).length} حساب
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">{meta.label}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">{meta.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث بالاسم أو اسم الدخول أو الإقليم..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-bold">تصفية حسب الدور:</span>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as UserRole | 'all')}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-bold outline-none cursor-pointer"
          >
            <option value="all">جميع الأدوار ({users.length})</option>
            <option value="dp_agent">1. ممثل المديرية الإقليمية</option>
            <option value="aref_validator">2. مسؤول الأكاديمية</option>
            <option value="aref_director">3. مدير الأكاديمية</option>
            <option value="dev">4. مسؤول النظام</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loadError ? (
          <div className="p-8 text-center text-sm text-rose-700">{loadError}</div>
        ) : isLoading && users.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">جارٍ تحميل الحسابات…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">المستخدم</th>
                  <th className="py-3 px-4">اسم الدخول</th>
                  <th className="py-3 px-4">الدور الوظيفي (Role)</th>
                  <th className="py-3 px-4">الارتباط الجغرافي (DP)</th>
                  <th className="py-3 px-4">كلمة السر</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">آخر دخول</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => {
                  const meta = ROLE_META[user.role as UserRole] || ROLE_META.dp_agent;
                  const RoleIcon = meta.icon;
                  const isCurrent = String(user.id) === currentUser.id;

                  return (
                    <tr key={user.id} className={`hover:bg-slate-50/80 transition-colors ${isCurrent ? 'bg-emerald-50/50' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{user.full_name}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-bold">
                                  أنت
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{user.title}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-700">{user.username}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[11px] border ${meta.badge}`}>
                          <RoleIcon className="w-3.5 h-3.5" />
                          <span>{meta.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {user.dp_name_ar ? (
                          <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{user.dp_name_ar}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">جهة الشرق عامة (AREF)</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {user.has_password ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            مضبوطة
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            لم تُضبط
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={isCurrent}
                          title={isCurrent ? 'لا يمكنك تعطيل حسابك الجاري' : 'تغيير حالة التفعيل'}
                          className="flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {user.is_active ? (
                            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                              <CheckCircle className="w-3 h-3" />
                              مفعل
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">
                              <XCircle className="w-3 h-3" />
                              معطل
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleString('fr-MA') : '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                          >
                            ضبط كلمة السر
                          </button>

                          {user.role !== 'dev' && !isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="حذف الحساب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden" dir="rtl">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">إضافة مستخدم جديد للنظام الإداري</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم الكامل للمستخدم *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ذ. عبد الرحيم العلوي"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم الدخول (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="agent_oujda_2"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    كلمة السر الابتدائية *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={8}
                    placeholder="8 أحرف على الأقل"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نوع وصلاحيات المستخدم (Role) *
                </label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                >
                  <option value="dp_agent">1. ممثل المديرية الإقليمية - معالج ملفات الإقليم</option>
                  <option value="aref_validator">2. مسؤول الأكاديمية الجهوية - مدقق الملفات</option>
                  <option value="aref_director">3. مدير الأكاديمية الجهوية - المصادقة والتوقيع</option>
                  <option value="dev">4. مسؤول النظام - Super Admin</option>
                </select>
              </div>

              {newRole === 'dp_agent' && (
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                  <label className="block text-xs font-bold text-emerald-900">
                    الارتباط الجغرافي: تحديد المديرية الإقليمية من بين أقاليم الشرق الثمانية *
                  </label>
                  <select
                    value={newDpCode}
                    onChange={e => setNewDpCode(e.target.value)}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 outline-none"
                  >
                    {ORIENTAL_DIRECTORATES.map(dp => (
                      <option key={dp.code} value={dp.code}>
                        {dp.nameAr} ({dp.nameFr}) - {dp.chiefTown}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-emerald-800">
                    * سيكون هذا المستخدم مقيداً فقط بإدخال وتدبير وقفل ملفات السكنيات التابعة لهذه المديرية، وبالوثائق التي تعنيه.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الصفة أو المنصب الإداري (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: رئيس مكتب تدبير السكنيات والممتلكات"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'جارٍ الإنشاء…' : 'تأكيد إنشاء المستخدم'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementView;
