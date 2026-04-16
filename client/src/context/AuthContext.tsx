import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiGet, apiPost } from '../lib/api';

interface User {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ user: User }>('/api/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { user } = await apiPost<{ user: User }>('/api/auth/login', { email, password });
    setUser(user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const { user } = await apiPost<{ user: User }>('/api/auth/register', { email, password, name });
    setUser(user);
  };

  const logout = async () => {
    await apiPost('/api/auth/logout', {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
