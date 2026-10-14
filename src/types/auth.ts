import { ORIENTAL_DIRECTORATES } from './housing';

export type UserRole = 
  | 'dp_agent'        // 1. ممثل المديرية الإقليمية
  | 'aref_validator'  // 2. مسؤول الأكاديمية الجهوية
  | 'aref_director'   // 3. مدير الأكاديمية الجهوية
  | 'dev';            // 4. المطور / المسؤول التقني (Super Admin)

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  dpCode?: string; // e.g. 'OUJ', 'BRK', 'NAD', 'DRI', 'TAO', 'GUE', 'JER', 'FIG' or undefined for AREF/dev
  dpNameAr?: string;
  title: string;
  lastLogin?: string;
  isActive: boolean;
}

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-dev-01',
    username: 'dev_admin',
    fullName: 'المشرف التقني للنظام',
    email: 'dev@aref-oriental.ma',
    role: 'dev',
    title: 'المسؤول التقني والمطور العام (Super Admin)',
    isActive: true,
    lastLogin: '2026-09-28 11:30'
  },
  {
    id: 'user-dir-01',
    username: 'directeur_aref',
    fullName: 'السيد مدير الأكاديمية الجهوية لجهة الشرق',
    email: 'directeur@aref-oriental.ma',
    role: 'aref_director',
    title: 'مدير الأكاديمية الجهوية (صاحب القرار النهائي والتوقيع)',
    isActive: true,
    lastLogin: '2026-09-28 10:15'
  },
  {
    id: 'user-val-01',
    username: 'validateur_aref',
    fullName: 'رئيس مصلحة الممتلكات والسكنيات بالأكاديمية',
    email: 'logements@aref-oriental.ma',
    role: 'aref_validator',
    title: 'مسؤول التدقيق والافتحاص الجهوي (AREF)',
    isActive: true,
    lastLogin: '2026-09-28 09:45'
  },
  {
    id: 'user-dp-ouj',
    username: 'agent_oujda',
    fullName: 'مصلحة تدبير السكنيات - DP وجدة أنكاد',
    email: 'dp.oujda@aref-oriental.ma',
    role: 'dp_agent',
    dpCode: 'OUJ',
    dpNameAr: 'المديرية الإقليمية بوجدة أنكاد',
    title: 'ممثل المديرية الإقليمية بوجدة أنكاد',
    isActive: true,
    lastLogin: '2026-09-28 08:30'
  },
  {
    id: 'user-dp-brk',
    username: 'agent_berkane',
    fullName: 'مصلحة تدبير السكنيات - DP بركان',
    email: 'dp.berkane@aref-oriental.ma',
    role: 'dp_agent',
    dpCode: 'BRK',
    dpNameAr: 'المديرية الإقليمية ببركان',
    title: 'ممثل المديرية الإقليمية ببركان',
    isActive: true,
    lastLogin: '2026-09-27 16:10'
  },
  {
    id: 'user-dp-nad',
    username: 'agent_nador',
    fullName: 'مصلحة تدبير السكنيات - DP الناظور',
    email: 'dp.nador@aref-oriental.ma',
    role: 'dp_agent',
    dpCode: 'NAD',
    dpNameAr: 'المديرية الإقليمية بالناظور',
    title: 'ممثل المديرية الإقليمية بالناظور',
    isActive: true,
    lastLogin: '2026-09-27 15:40'
  },
  {
    id: 'user-dp-dri',
    username: 'agent_driouch',
    fullName: 'مصلحة تدبير السكنيات - DP الدريوش',
    email: 'dp.driouch@aref-oriental.ma',
    role: 'dp_agent',
    dpCode: 'DRI',
    dpNameAr: 'المديرية الإقليمية بالدريوش',
    title: 'ممثل المديرية الإقليمية بالدريوش',
    isActive: true
  },
  {
    id: 'user-dp-tao',
    username: 'agent_taourirt',
    fullName: 'مصلحة تدبير السكنيات - DP تاوريرت',
    email: 'dp.taourirt@aref-oriental.ma',
    role: 'dp_agent',
    dpCode: 'TAO',
    dpNameAr: 'المديرية الإقليمية بتاوريرت',
    title: 'ممثل المديرية الإقليمية بتاوريرت',
    isActive: true
  },
  {
    id: 'user-dp-gue',
    username: 'agent_guercif',
    fullName: 'مصلحة تدبير السكنيات - DP جرسيف',
    email: 'dp.guercif@aref-oriental.ma',
    role: 'dp_agent',
    dpCode: 'GUE',
    dpNameAr: 'المديرية الإقليمية بجرسيف',
    title: 'ممثل المديرية الإقليمية بجرسيف',
    isActive: true
  },
  {
    id: 'user-dp-jer',
    username: 'agent_jerada',
    fullName: 'مصلحة تدبير السكنيات - DP جرادة',
    email: 'dp.jerada@aref-oriental.ma',
    role: 'dp_agent',
    dpCode: 'JER',
    dpNameAr: 'المديرية الإقليمية بجرادة',
    title: 'ممثل المديرية الإقليمية بجرادة',
    isActive: true
  },
  {
    id: 'user-dp-fig',
    username: 'agent_figuig',
    fullName: 'مصلحة تدبير السكنيات - DP فكيك (بوعرفة)',
    email: 'dp.figuig@aref-oriental.ma',
    role: 'dp_agent',
    dpCode: 'FIG',
    dpNameAr: 'المديرية الإقليمية بفكيك (بوعرفة)',
    title: 'ممثل المديرية الإقليمية بفكيك',
    isActive: true
  }
];

export interface RolePermissions {
  canCreateDossier: boolean;
  canEditDossier: boolean;
  canDeleteDossier: boolean;
  canSubmitToAREF: boolean;
  canAuditAREF: boolean;
  canApproveFinal: boolean;
  canPrintOfficialContracts: boolean;
  canManageUsers: boolean;
  canAccessDatabaseSettings: boolean;
  filterByOwnDPOnly: boolean;
}

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'dp_agent':
      return {
        canCreateDossier: true,
        canEditDossier: true,
        canDeleteDossier: true,
        canSubmitToAREF: true,
        canAuditAREF: false,
        canApproveFinal: false,
        canPrintOfficialContracts: false, // يمكنه طباعة الطلب والوصل فقط، ليس عقد الإسناد النهائي
        canManageUsers: false,
        canAccessDatabaseSettings: false,
        filterByOwnDPOnly: true
      };

    case 'aref_validator':
      return {
        canCreateDossier: false,
        canEditDossier: false,
        canDeleteDossier: false,
        canSubmitToAREF: false,
        canAuditAREF: true,
        canApproveFinal: false,
        canPrintOfficialContracts: false,
        canManageUsers: false,
        canAccessDatabaseSettings: true,
        filterByOwnDPOnly: false
      };

    case 'aref_director':
      return {
        canCreateDossier: false,
        canEditDossier: false,
        canDeleteDossier: false,
        canSubmitToAREF: false,
        canAuditAREF: true,
        canApproveFinal: true,
        canPrintOfficialContracts: true,
        canManageUsers: false,
        canAccessDatabaseSettings: true,
        filterByOwnDPOnly: false
      };

    case 'dev':
    default:
      return {
        canCreateDossier: true,
        canEditDossier: true,
        canDeleteDossier: true,
        canSubmitToAREF: true,
        canAuditAREF: true,
        canApproveFinal: true,
        canPrintOfficialContracts: true,
        canManageUsers: true,
        canAccessDatabaseSettings: true,
        filterByOwnDPOnly: false
      };
  }
}
