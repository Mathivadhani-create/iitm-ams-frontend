import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Student, Faculty } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  student: Student | null;
  faculty: Faculty | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<User>;
  registerUser: (payload: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  resetSeed: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('iitm_ams_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('iitm_ams_token');
    if (!storedToken) {
      setUser(null);
      setStudent(null);
      setFaculty(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getCurrentUser();
      setUser(res.user);
      setStudent(res.student || null);
      setFaculty(res.faculty || null);
    } catch (err: any) {
      console.error('[AuthContext] Session verification failed:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    setError(null);
    try {
      const res = await apiService.login(email, pass);
      localStorage.setItem('iitm_ams_token', res.token);
      setToken(res.token);
      await refreshUser();
      return res.user;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const registerUser = async (payload: any): Promise<User> => {
    setError(null);
    try {
      const res = await apiService.register(payload);
      localStorage.setItem('iitm_ams_token', res.token);
      setToken(res.token);
      await refreshUser();
      return res.user;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('iitm_ams_token');
    setToken(null);
    setUser(null);
    setStudent(null);
    setFaculty(null);
  };

  const resetSeed = async () => {
    await apiService.resetSeedData();
    await refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        student,
        faculty,
        token,
        loading,
        error,
        login,
        registerUser,
        logout,
        refreshUser,
        resetSeed,
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
