// KOMPONEN : AuthContext
// PERAN    : Manajemen autentikasi (login, logout, token, role) untuk seluruh aplikasi
// API      : Menggunakan src/api/auth.ts (login, register, getCurrentUser)
// Tipe     : Menggunakan src/types/index.ts (Role, User)

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login, register, getCurrentUser, type AuthResponse } from '../api/auth';
import { Role, User } from '../types/index';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<Role>;
  register: (name: string, emailOrPhone: string, password: string, role?: Role) => Promise<void>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  checkAuth: () => Promise<boolean>;
}

const TOKEN_KEY = 'etacafe_token';
const USER_KEY = 'etacafe_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = useCallback(async (usernameOrEmail: string, password: string): Promise<Role> => {
    const data: AuthResponse = await login(usernameOrEmail, password);
    const authToken = data.access_token;
    const userData: User = {
      id: String(data.user.id),
      name: data.user.name,
      emailOrPhone: data.user.email_or_phone,
      role: data.user.role as Role,
      createdAt: data.user.created_at || new Date().toISOString(),
    };
    setToken(authToken);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    return userData.role;
  }, []);

  const handleRegister = useCallback(
    async (name: string, emailOrPhone: string, password: string, role: Role = 'pelanggan') => {
      await register(name, emailOrPhone, password, role);
      // Auto-login setelah registrasi
      const data: AuthResponse = await login(emailOrPhone, password);
      const authToken = data.access_token;
      const userData: User = {
        id: String(data.user.id),
        name: data.user.name,
        emailOrPhone: data.user.email_or_phone,
        role: data.user.role as Role,
        createdAt: data.user.created_at || new Date().toISOString(),
      };
      setToken(authToken);
      setUser(userData);
      localStorage.setItem(TOKEN_KEY, authToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    },
    []
  );

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  // Cek apakah token masih valid dengan memanggil endpoint /auth/me
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setToken(null);
      setUser(null);
      return false;
    }
    try {
      const data: AuthResponse = await getCurrentUser();
      const userData: User = {
        id: String(data.user.id),
        name: data.user.name,
        emailOrPhone: data.user.email_or_phone,
        role: data.user.role as Role,
        createdAt: data.user.created_at || new Date().toISOString(),
      };
      setToken(token);
      setUser(userData);
      return true;
    } catch {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return false;
    }
  }, []);

  const hasRole = useCallback((role: Role) => user?.role === role, [user]);
  const hasAnyRole = useCallback((roles: Role[]) => (user ? roles.includes(user.role) : false), [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading: isLoading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        hasRole,
        hasAnyRole,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}

export default AuthProvider;
