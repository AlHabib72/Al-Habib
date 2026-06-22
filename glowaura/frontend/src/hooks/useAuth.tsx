'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { fetchApi, getToken, setToken, removeToken } from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    try {
      const data = await fetchApi<{ user: User }>('/auth/profile', { token });
      setUser(data.user);
    } catch {
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const login = async (email: string, password: string) => {
    const data = await fetchApi<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.name}!`);
    router.push('/');
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const data = await fetchApi<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    });
    setToken(data.token);
    setUser(data.user);
    toast.success('Account created successfully!');
    router.push('/');
  };

  const logout = () => {
    removeToken();
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
