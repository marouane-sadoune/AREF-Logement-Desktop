import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserAccount, UserRole, RolePermissions, INITIAL_USERS, getRolePermissions } from '../types/auth';
import Swal from 'sweetalert2';

interface AuthContextType {
  currentUser: UserAccount;
  users: UserAccount[];
  permissions: RolePermissions;
  isAuthenticated: boolean;
  signIn: (username: string, password: string) => boolean;
  signOut: () => void;
  switchUser: (userId: string) => void;
  addUser: (user: Omit<UserAccount, 'id'>) => void;
  updateUser: (user: UserAccount) => void;
  deleteUser: (userId: string) => void;
  toggleUserStatus: (userId: string) => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const USERS_STORAGE_KEY = 'aref_oriental_users';
const AUTH_SESSION_KEY = 'aref_oriental_auth_user_id';
const PROTOTYPE_PASSWORD = 'aref2026';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load users from storage or fallback to INITIAL_USERS
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load users from localStorage', e);
    }
    return INITIAL_USERS;
  });

  // A persisted prototype session keeps the user signed in across refreshes.
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(AUTH_SESSION_KEY);
      if (stored && users.some(u => u.id === stored && u.isActive)) {
        return stored;
      }
    } catch (e) {
      console.error('Failed to load prototype auth session', e);
    }
    return '';
  });

  // Persist users
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to persist users', e);
    }
  }, [users]);

  // Persist current user ID
  useEffect(() => {
    try {
      if (currentUserId) {
        localStorage.setItem(AUTH_SESSION_KEY, currentUserId);
      } else {
        localStorage.removeItem(AUTH_SESSION_KEY);
      }
    } catch (e) {
      console.error('Failed to persist prototype auth session', e);
    }
  }, [currentUserId]);

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || INITIAL_USERS[0];
  const permissions = getRolePermissions(currentUser.role);
  const isAuthenticated = Boolean(currentUserId && users.some(u => u.id === currentUserId && u.isActive));

  const signIn = (username: string, password: string): boolean => {
    const normalizedUsername = username.trim().toLowerCase();
    const target = users.find(user => user.username.toLowerCase() === normalizedUsername);

    if (!target || !target.isActive || password !== PROTOTYPE_PASSWORD) {
      return false;
    }

    setCurrentUserId(target.id);
    setUsers(prev => prev.map(user => user.id === target.id
      ? { ...user, lastLogin: new Date().toLocaleString('ar-MA', { dateStyle: 'short', timeStyle: 'short' }) }
      : user
    ));
    return true;
  };

  const signOut = () => setCurrentUserId('');

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target?.isActive) {
      setCurrentUserId(userId);
      // update last login
      const updated = users.map(u => 
        u.id === userId 
          ? { ...u, lastLogin: new Date().toLocaleString('ar-MA', { dateStyle: 'short', timeStyle: 'short' }) }
          : u
      );
      setUsers(updated);
    }
  };

  const addUser = (newUser: Omit<UserAccount, 'id'>) => {
    const id = `user-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    const created: UserAccount = {
      ...newUser,
      id,
      isActive: true,
      lastLogin: new Date().toLocaleString('ar-MA', { dateStyle: 'short', timeStyle: 'short' })
    };
    setUsers(prev => [created, ...prev]);
  };

  const updateUser = (updated: UserAccount) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const deleteUser = (userId: string) => {
    if (users.length <= 1) {
      Swal.fire({
        icon: 'warning',
        title: 'عملية غير ممكنة',
        text: 'لا يمكن حذف المستخدم الأخير بالنظام',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#059669',
      });
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUserId === userId) {
      const remaining = users.filter(u => u.id !== userId);
      if (remaining.length > 0) {
        setCurrentUserId(remaining[0].id);
      }
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
  };

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (Array.isArray(roles)) {
      return roles.includes(currentUser.role);
    }
    return currentUser.role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        permissions,
        isAuthenticated,
        signIn,
        signOut,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        hasRole
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
