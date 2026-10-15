import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { UserAccount, UserRole, RolePermissions, getRolePermissions } from '../types/auth';
import {
  apiSignIn,
  apiSignOut,
  changeOwnPassword,
  fetchAuthStatus,
  fetchCurrentUser,
  getAuthToken,
  setAuthToken,
  setupAdministrator,
} from '../api/client';
import type { ApiUser } from '../api/client';

interface AuthContextType {
  currentUser: UserAccount;
  permissions: RolePermissions;
  isAuthenticated: boolean;
  // authChecked: لم تُعرف حالة الخادم بعد — شاشة تحميل قصيرة تمنع قفزة تسجيل الدخول.
  authChecked: boolean;
  needsSetup: boolean;
  signIn: (username: string, password: string) => Promise<string | null>;
  completeSetup: (input: { username: string; full_name: string; password: string }) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateOwnPassword: (currentPassword: string, password: string) => Promise<string | null>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

// حساب فارغ لا يُعرض أبداً: الواجهة كلها خلف isAuthenticated.
const SIGNED_OUT: UserAccount = {
  id: '',
  username: '',
  fullName: '',
  role: 'dp_agent',
  title: '',
  isActive: false,
  hasPassword: false,
};

function toAccount(user: ApiUser): UserAccount {
  return {
    id: String(user.id),
    username: user.username,
    fullName: user.full_name,
    role: user.role as UserRole,
    dpCode: user.dp_code ?? undefined,
    dpNameAr: user.dp_name_ar ?? undefined,
    title: user.title ?? '',
    isActive: user.is_active,
    hasPassword: user.has_password,
    lastLogin: user.last_login_at ? new Date(user.last_login_at).toLocaleString('fr-MA') : undefined,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const status = await fetchAuthStatus();
        if (cancelled) return;
        setNeedsSetup(status.needs_setup);

        if (!status.needs_setup && getAuthToken()) {
          try {
            const me = await fetchCurrentUser();
            if (!cancelled) setUser(toAccount(me));
          } catch {
            setAuthToken('');
          }
        }
      } catch {
        if (!cancelled) setNeedsSetup(false);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // أي استدعاء يُرجع 401 (انتهت الجلسة أو عُطّل الحساب) يُخرج التطبيق من الدخول.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('aref:unauthorized', onUnauthorized);
    return () => window.removeEventListener('aref:unauthorized', onUnauthorized);
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const session = await apiSignIn(username, password);
      setAuthToken(session.token);
      setUser(toAccount(session.user));
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'تعذّر تسجيل الدخول.';
    }
  }, []);

  const completeSetup = useCallback(
    async (input: { username: string; full_name: string; password: string }) => {
      try {
        const session = await setupAdministrator(input);
        setAuthToken(session.token);
        setUser(toAccount(session.user));
        setNeedsSetup(false);
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : 'تعذّر ضبط حساب مسؤول النظام.';
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await apiSignOut();
    } catch {
      // الخروج ينجح محلياً حتى لو تعذّر إعلام الخادم.
    }
    setAuthToken('');
    setUser(null);
  }, []);

  const updateOwnPassword = useCallback(async (currentPassword: string, password: string) => {
    try {
      await changeOwnPassword(currentPassword, password);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'تعذّر تغيير كلمة السر.';
    }
  }, []);

  const currentUser = user ?? SIGNED_OUT;
  const permissions = getRolePermissions(currentUser.role);

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]) =>
      Array.isArray(roles) ? roles.includes(currentUser.role) : currentUser.role === roles,
    [currentUser.role]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        permissions,
        isAuthenticated: Boolean(user),
        authChecked,
        needsSetup,
        signIn,
        completeSetup,
        signOut,
        updateOwnPassword,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
