import React, { useEffect, useRef, useState } from 'react';
import { 
  FolderKanban, 
  FilePlus, 
  FileText, 
  GitFork, 
  BookOpen, 
  Database,
  Building2,
  Users,
  Archive,
  Scale,
  DoorOpen,
  ChevronDown,
  ChevronUp,
  Globe2,
  LifeBuoy,
  LogOut,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { HousingDossier } from '../types/housing';
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 'dossiers' | 'new_dossier' | 'documents' | 'audit' | 'regulations' | 'database' | 'users' | 'authlog' | 'archive' | 'compare' | 'eviction' | 'registre';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  dossiers: HousingDossier[];
  archivedCount?: number;
  onOpenNewDossier: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  dossiers,
  archivedCount = 0,
  onOpenNewDossier
}) => {
  const { currentUser, permissions, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const avatarLabel = currentUser.role === 'dev'
    ? 'Dev'
    : currentUser.role === 'aref_director'
      ? 'DA'
      : currentUser.role === 'aref_validator'
        ? 'VA'
        : `DP${currentUser.dpCode?.charAt(0).toUpperCase() || ''}`;

  const totalCount = dossiers.length;
  const underReviewCount = dossiers.filter(d => d.status === 'under_review_dp' || d.status === 'submitted_dp').length;

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const navItems = [
    {
      id: 'dossiers' as ActiveTab,
      label: 'سجل ملفات الترشيح',
      sublabel: currentUser.role === 'dp_agent' && currentUser.dpNameAr ? `ملفات ${currentUser.dpNameAr}` : 'Dossiers de Candidature',
      icon: FolderKanban,
      badge: totalCount
    },
    ...(permissions.canCreateDossier ? [{
      id: 'new_dossier' as ActiveTab,
      label: 'تكوين ملف طلب جديد',
      sublabel: 'Nouveau Dossier (Note 40)',
      icon: FilePlus,
      highlight: true
    }] : []),
    {
      id: 'documents' as ActiveTab,
      label: 'مولد الوثائق والطباعة',
      sublabel: currentUser.role === 'aref_director' ? 'عقود الإسناد الرسمية' : 'Documents & Déclarations',
      icon: FileText
    },
    {
      id: 'audit' as ActiveTab,
      label: 'مسار التدقيق (DP ➔ AREF)',
      sublabel: currentUser.role === 'aref_validator' ? 'التدقيق الجهوي (AREF)' : 'Circuit & Décisions',
      icon: GitFork,
      badge: underReviewCount > 0 ? underReviewCount : undefined
    },
    {
      id: 'eviction' as ActiveTab,
      label: 'إفراغ المساكن (المحور 4)',
      sublabel: 'Procédures d\'évacuation',
      icon: DoorOpen
    },
    {
      id: 'registre' as ActiveTab,
      label: 'المسجل المركزي للمساكن',
      sublabel: 'Registre des Logements (Note 40)',
      icon: Building2
    },
    ...(permissions.canManageUsers ? [{
      id: 'users' as ActiveTab,
      label: 'المستخدمون والأدوار الأربعة',
      sublabel: 'حسابات المديرية والأكاديمية',
      icon: Users
    }] : []),
    ...(permissions.canViewAuthLog ? [{
      id: 'authlog' as ActiveTab,
      label: 'سجلّ الدخول والأمن',
      sublabel: 'Journal des connexions',
      icon: ShieldCheck
    }] : []),
    {
      id: 'regulations' as ActiveTab,
      label: 'دليل المذكرة الوزارية 40',
      sublabel: 'Cadre Juridique & Barème',
      icon: BookOpen
    },
    {
      id: 'compare' as ActiveTab,
      label: 'مقارنة المترشحين',
      sublabel: 'Comparaison (même établissement)',
      icon: Scale,
      badge: undefined
    },
    {
      id: 'archive' as ActiveTab,
      label: 'أرشيف الملفات المغلقة',
      sublabel: 'Archive (clôturés > 1 an)',
      icon: Archive,
      badge: archivedCount > 0 ? archivedCount : undefined
    },
    ...(permissions.canAccessDatabaseSettings ? [{
      id: 'database' as ActiveTab,
      label: 'قاعدة البيانات والنسخ الاحتياطي',
      sublabel: 'SQLite — تصدير واسترجاع',
      icon: Database
    }] : []),
  ];

  return (
    <aside className="w-64 bg-[#f5f7f5] text-slate-700 flex flex-col h-full border-l border-[#e2e6e2] shrink-0 desktop-sidebar select-none">
      {/* Institutional Moroccan Header - Oriental Region */}
      <div className="p-4 border-b border-[#e2e6e2] bg-[#edf0ed]">
        <div className="text-center space-y-1">
          <div className="flex justify-center mb-1">
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-xs font-bold text-slate-800 leading-tight">المملكة المغربية</h2>
          <p className="text-[11px] text-emerald-700 font-semibold leading-tight">
            الأكاديمية الجهوية للتربية والتكوين
          </p>
          <div className="text-xs text-slate-800 font-bold">
            جـهـة الـشـرق (AREF Oriental)
          </div>
          <div className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-200 mt-1">
            8 مديريات إقليمية (DP) · قسم السكنيات
          </div>
        </div>
      </div>

      {/* Primary Action Button - Accessible for roles with creation rights */}
      {permissions.canCreateDossier && (
        <div className="p-3">
          <button
            onClick={onOpenNewDossier}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>إيداع ملف سكن جديد</span>
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-right transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-bold border-r-2 border-emerald-600'
                  : 'text-slate-600 hover:bg-[#eaecea] hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs leading-none">{item.label}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{item.sublabel}</div>
                </div>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Current account menu opens upward from the sidebar footer */}
      <div ref={userMenuRef} className="relative mx-3 my-2">
        {isUserMenuOpen && (
          <div
            id="sidebar-user-menu"
            className="absolute bottom-full right-0 z-50 mb-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xl"
            dir="rtl"
          >
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="truncate text-xs font-bold text-slate-900">{currentUser.fullName}</div>
              <div className="mt-0.5 truncate text-[11px] text-slate-500" dir="ltr">{currentUser.username}</div>
            </div>
            <div className="p-1.5">
              {permissions.canManageUsers && (
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setActiveTab('users');
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>إدارة المستخدمين</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setActiveTab('regulations');
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                <LifeBuoy className="h-4 w-4 text-slate-500" />
                <span>الدليل والمساعدة</span>
              </button>
              <div className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs text-slate-600">
                <span className="flex items-center gap-3">
                  <Globe2 className="h-4 w-4 text-slate-500" />
                  <span>اللغة</span>
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold">العربية</span>
              </div>
            </div>
            <div className="border-t border-slate-200 p-1.5">
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsUserMenuOpen((open) => !open)}
          title="قائمة الحساب"
          aria-label={`الحساب الحالي ${currentUser.fullName}`}
          aria-haspopup="menu"
          aria-expanded={isUserMenuOpen}
          aria-controls="sidebar-user-menu"
          className="flex w-full items-center gap-2.5 rounded-xl border border-[#e2e6e2] bg-[#edf0ed] p-2.5 text-right transition-colors hover:border-[#d0d6d0] hover:bg-[#e4e8e4] cursor-pointer"
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white ring-1 ring-emerald-200">
            <span className="text-[10px]">{avatarLabel}</span>
            <span className="absolute bottom-0 left-0 h-2.5 w-2.5 rounded-full border-2 border-[#edf0ed] bg-emerald-400" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] text-slate-500">الحساب المتصل</span>
            <span className="block truncate text-[11px] font-bold text-slate-800">{currentUser.fullName}</span>
            <span className="block truncate text-[10px] text-slate-500">
              {currentUser.role === 'dp_agent'
                ? `${currentUser.dpCode || 'DP'} · ${currentUser.dpNameAr || currentUser.title}`
                : currentUser.title}
            </span>
          </span>
          {isUserMenuOpen
            ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            : <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />}
        </button>
      </div>
    </aside>
  );
};

