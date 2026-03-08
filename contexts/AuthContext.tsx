import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { safeStringify } from '../src/utils/safeJson';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
  isLoading: boolean;
  loginOrRegisterUser: (nationalId: string, phone: string) => Promise<User>;
  loginWithEmail: (email: string, password: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const normalizeSaudiPhone = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length > 10) cleaned = cleaned.slice(-10);
  return cleaned;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('token');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        if (savedToken) setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (data: AuthResponse) => {
    setUser(data.user);
    if (data.token) {
      setToken(data.token);
      localStorage.setItem('token', data.token);
    }
    localStorage.setItem('currentUser', safeStringify(data.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  };

  const loginOrRegisterUser = async (nationalId: string, phone: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/direct-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeStringify({ nationalId, mobile: phone }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'فشل تسجيل الدخول');
      }

      login(data);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeStringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'فشل تسجيل الدخول');
      }

      login(data);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, loginOrRegisterUser, loginWithEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
