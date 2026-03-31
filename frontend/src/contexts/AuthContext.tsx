import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchApi } from '../api/fetchApi';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await fetchApi<User>('/api/auth/me');
        setUser(userData);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (credentials: any) => {
    const result = await fetchApi<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setUser({
      id: (result as any).userId || result.id,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
      role: result.role,
      createdAt: result.createdAt,
    });
  };

  const register = async (userData: any) => {
    const result = await fetchApi<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    setUser({
      id: (result as any).userId || result.id,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
      role: result.role,
      createdAt: result.createdAt,
    });
  };

  const logout = async () => {
    await fetchApi('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
