export type UserRole = 
  | 'dp_agent'        // 1. ممثل المديرية الإقليمية
  | 'aref_validator'  // 2. مسؤول الأكاديمية الجهوية
  | 'aref_director'   // 3. مدير الأكاديمية الجهوية
  | 'dev';            // 4. مسؤول النظام (Super Admin)

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  dpCode?: string; // e.g. 'OUJ', 'BRK', 'NAD', 'DRI', 'TAO', 'GUE', 'JER', 'FIG' or undefined for AREF/dev
  dpNameAr?: string;
  title: string;
  lastLogin?: string;
  isActive: boolean;
  hasPassword: boolean;
}

export const ROLE_LABELS_AR: Record<UserRole, string> = {
  dp_agent: 'ممثل المديرية الإقليمية',
  aref_validator: 'مدقق الأكاديمية الجهوية',
  aref_director: 'مدير الأكاديمية الجهوية',
  dev: 'مسؤول النظام',
};

// الأدوار المرخّص لها في إدارة الحسابات واطّلاع سجلّ الدخول.
export const USER_MANAGER_ROLES: UserRole[] = ['dev'];
export const AUTH_LOG_ROLES: UserRole[] = ['dev', 'aref_director'];

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
  canViewAuthLog: boolean;
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
        canPrintOfficialContracts: false, // وثائق الإيداع والتدقيق الأولي فقط، لا وثائق الأكاديمية
        canManageUsers: false,
        canAccessDatabaseSettings: false,
        canViewAuthLog: false,
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
        canViewAuthLog: false,
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
        canViewAuthLog: true,
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
        canViewAuthLog: true,
        filterByOwnDPOnly: false
      };
  }
}
