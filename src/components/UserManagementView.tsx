import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Building, 
  Stamp, 
  FileCheck2, 
  Code, 
  MapPin, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Settings, 
  Database, 
  Key, 
  Check, 
  AlertCircle,
  RefreshCw,
  Search,
  Lock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserAccount, UserRole } from '../types/auth';
import { ORIENTAL_DIRECTORATES } from '../types/housing';
import Swal from 'sweetalert2';

export const UserManagementView: React.FC = () => {
  const { currentUser, users, addUser, updateUser, deleteUser, toggleUserStatus, switchUser } = useAuth();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  
  // New User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('dp_agent');
  const [newDpCode, setNewDpCode] = useState('OUJ');
  const [newTitle, setNewTitle] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newUsername || !newEmail) {
      Swal.fire({
        icon: 'warning',
        title: 'حقل ناقص',
        text: 'يرجى ملء جميع الحقول الإلزامية',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#059669',
      });
      return;
    }

    const selectedDp = ORIENTAL_DIRECTORATES.find(d => d.code === newDpCode);

    addUser({
      fullName: newFullName,
      username: newUsername.toLowerCase().trim(),
      email: newEmail.toLowerCase().trim(),
      role: newRole,
      dpCode: newRole === 'dp_agent' ? newDpCode : undefined,
      dpNameAr: newRole === 'dp_agent' ? selectedDp?.nameAr : undefined,
      title: newTitle || (
        newRole === 'dp_agent' ? `ممثل ${selectedDp?.nameAr}` :
        newRole === 'aref_validator' ? 'مسؤول التدقيق والافتحاص الجهوي (AREF)' :
        newRole === 'aref_director' ? 'مدير الأكاديمية الجهوية لجهة الشرق' :
        'مشرف تقني للنظام ومطور'
      ),
      isActive: true
    });

    // Reset
    setNewFullName('');
    setNewUsername('');
    setNewEmail('');
    setNewTitle('');
    setShowAddModal(false);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.dpNameAr && u.dpNameAr.includes(searchQuery));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleStyle = (role: UserRole) => {
    switch (role) {
      case 'dev':
        return {
          label: '4. المطور / المسؤول التقني',
          badge: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: Code,
          desc: 'المشرف التقني للنظام (Super Admin) - إدارة الحسابات وقاعدة البيانات والإعدادات'
        };
      case 'aref_director':
        return {
          label: '3. مدير الأكاديمية الجهوية',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Stamp,
          desc: 'صاحب القرار النهائي والتوقيعات الرسمية - المصادقة النهائية وتوليد عقود الإسناد'
        };
      case 'aref_validator':
        return {
          label: '2. مسؤول الأكاديمية الجهوية',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: FileCheck2,
          desc: 'المراقب والمدقق الجهوي - تدقيق ملفات المديريات الثماني والموافقة المبدئية أو إرجاع الملفات'
        };
      case 'dp_agent':
      default:
        return {
          label: '1. ممثل المديرية الإقليمية',
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: Building,
          desc: 'مُدخل ومعالج البيانات بإقليمه فقط - إدخال المعطيات وقفل الملفات وإرسالها للأكاديمية'
        };
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl border border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5" />
              لوحة تحكم المسؤول التقني (Dev Super Admin)
            </span>
            <span className="text-slate-400 text-xs">·</span>
            <span className="text-slate-300 text-xs font-mono">DB: aref_oriental</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            إدارة المستخدمين والأدوار والارتباطات الإقليمية
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            تحديد صلاحيات المستخدمين الأربعة (ممثل المديرية الإقليمية، مدقق الأكاديمية، مدير الأكاديمية، والمشرف التقني) وربط كل ممثل بمديريته الإقليمية من بين الأقاليم الثمانية لجهة الشرق.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>
      </div>

      {/* Role Summary Cards (The 4 Roles specified by User) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Role 1 */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <Building className="w-5 h-5" />
            </div>
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {users.filter(u => u.role === 'dp_agent').length} حسابات
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900">1. ممثل المديرية الإقليمية</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong>الدور:</strong> مُدخل ومعالج الملفات بإقليمه فقط.<br />
            <strong>الصلاحيات:</strong> تدبير ملفات الإقليم، قفل الملفات وإرسالها (Submit) إلى AREF.
          </p>
        </div>

        {/* Role 2 */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {users.filter(u => u.role === 'aref_validator').length} حساب
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900">2. مسؤول الأكاديمية الجهوية</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong>الدور:</strong> المراقب والمدقق الجهوي.<br />
            <strong>الصلاحيات:</strong> مراقبة ملفات الـ 8 مديريات، تدقيق النقط، الموافقة المبدئية أو الإرجاع للتصحيح.
          </p>
        </div>

        {/* Role 3 */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-lg">
              <Stamp className="w-5 h-5" />
            </div>
            <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {users.filter(u => u.role === 'aref_director').length} حساب
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900">3. مدير الأكاديمية الجهوية</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong>الدور:</strong> صاحب القرار النهائي والتوقيعات.<br />
            <strong>الصلاحيات:</strong> المصادقة النهائية على الإسناد وتوليد وطباعة وثائق وعقود الإسناد الرسمية (PDF).
          </p>
        </div>

        {/* Role 4 */}
        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 text-purple-800 rounded-lg">
              <Code className="w-5 h-5" />
            </div>
            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              {users.filter(u => u.role === 'dev').length} حساب
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900">4. المطور / المسؤول التقني</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong>الدور:</strong> المشرف التقني للنظام (Super Admin).<br />
            <strong>الصلاحيات:</strong> إنشاء الحسابات، ضبط الصلاحيات والارتباط الإقليمي، وإدارة قاعدة البيانات.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث بالاسم، اسم المستخدم، البريد، أو الإقليم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-bold">تصفية حسب الدور:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-bold outline-none cursor-pointer"
          >
            <option value="all">جميع الأدوار الأربعة ({users.length})</option>
            <option value="dp_agent">1. ممثل المديرية الإقليمية (dp_agent)</option>
            <option value="aref_validator">2. مسؤول الأكاديمية (aref_validator)</option>
            <option value="aref_director">3. مدير الأكاديمية (aref_director)</option>
            <option value="dev">4. المسؤول التقني (dev)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">المستخدم</th>
                <th className="py-3 px-4">اسم الدخول / البريد</th>
                <th className="py-3 px-4">الدور الوظيفي (Role)</th>
                <th className="py-3 px-4">الارتباط الجغرافي (DP)</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4">آخر نشاط</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const roleMeta = getRoleStyle(user.role);
                const RoleIcon = roleMeta.icon;
                const isCurrent = user.id === currentUser.id;

                return (
                  <tr 
                    key={user.id}
                    className={`hover:bg-slate-50/80 transition-colors ${isCurrent ? 'bg-blue-50/40' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{user.fullName}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                                أنت
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{user.title}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-700">{user.username}</div>
                      <div className="text-[10px] text-slate-400">{user.email}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[11px] border ${roleMeta.badge}`}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        <span>{roleMeta.label}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {user.dpNameAr ? (
                        <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{user.dpNameAr}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">جهة الشرق عامة (AREF)</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className="flex items-center gap-1 cursor-pointer"
                        title="تغيير حالة التفعيل"
                      >
                        {user.isActive ? (
                          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" />
                            مفعل
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            <XCircle className="w-3 h-3" />
                            معطل
                          </span>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {user.lastLogin || '—'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => switchUser(user.id)}
                          disabled={isCurrent}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          تسجيل كـ
                        </button>
                        
                        {users.length > 1 && (
                          <button
                            onClick={async () => {
                              const ok = await Swal.fire({
                                icon: 'warning',
                                title: 'حذف الحساب؟',
                                text: `سيتم حذف حساب "${user.fullName}" نهائياً.`,
                                showCancelButton: true,
                                confirmButtonText: 'نعم، احذف',
                                cancelButtonText: 'إلغاء',
                                confirmButtonColor: '#dc2626',
                                cancelButtonColor: '#64748b',
                              });
                              if (ok.isConfirmed) deleteUser(user.id);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
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
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden" dir="rtl">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">إضافة مستخدم جديد للنظام الإداري</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
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
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500"
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
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    البريد المهني الإلكتروني *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="agent@aref-oriental.ma"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نوع وصلاحيات المستخدم (Role) *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-blue-500"
                >
                  <option value="dp_agent">1. ممثل المديرية الإقليمية (dp_agent) - معالج ملفات الإقليم</option>
                  <option value="aref_validator">2. مسؤول الأكاديمية الجهوية (aref_validator) - مدقق الملفات</option>
                  <option value="aref_director">3. مدير الأكاديمية الجهوية (aref_director) - المصادقة والتوقيع</option>
                  <option value="dev">4. المسؤول التقني والمطور (dev) - Super Admin</option>
                </select>
              </div>

              {/* Geographical DP Binding for dp_agent */}
              {newRole === 'dp_agent' && (
                <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 space-y-2">
                  <label className="block text-xs font-bold text-blue-900">
                    الارتباط الجغرافي: تحديد المديرية الإقليمية من بين أقاليم الشرق الثمانية *
                  </label>
                  <select
                    value={newDpCode}
                    onChange={(e) => setNewDpCode(e.target.value)}
                    className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-900 outline-none"
                  >
                    {ORIENTAL_DIRECTORATES.map((dp) => (
                      <option key={dp.code} value={dp.code}>
                        {dp.nameAr} ({dp.nameFr}) - {dp.chiefTown}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-blue-700">
                    * سيكون هذا المستخدم مقيداً فقط بإدخال وتدبير وقفل ملفات السكنيات التابعة لهذه المديرية الإقليمية.
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
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500"
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد إنشاء المستخدم</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
