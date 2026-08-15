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

      // /auth/me returns the authenticated user, while the
      // student profile endpoint contains roll number, department,
      // program and year required by the dashboard.
      if (res.user.role === 'student') {
        try {
          const studentProfile = await apiService.getStudentProfile();

          console.log('[AuthContext] Student profile loaded:', studentProfile);

          setStudent(studentProfile);
        } catch (profileError) {
          console.warn(
            '[AuthContext] Student profile loading failed:',
            profileError
          );

          setStudent(res.student || null);
        }

        setFaculty(null);
      } else if (res.user.role === 'faculty') {
        try {
          const facultyProfile = await apiService.getFacultyProfile();

          console.log('[AuthContext] Faculty profile loaded:', facultyProfile);
          console.log('[AuthContext] Faculty Employee ID:', facultyProfile?.employee_id);

          setFaculty(facultyProfile);
        } catch (profileError) {
          console.warn(
            '[AuthContext] Faculty profile loading failed:',
            profileError
          );

          setFaculty(res.faculty || null);
        }

        setStudent(null);
      } else {
        setStudent(null);
        setFaculty(null);
      }
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
    setLoading(true);

    try {
      const res = await apiService.login(email.trim(), pass);

      // Store the real JWT immediately.
      localStorage.setItem('iitm_ams_token', res.token);
      setToken(res.token);

      // Set authenticated user immediately.
      setUser(res.user);

      // Load the authenticated user and the complete role-specific profile.
      try {
        const currentUser = await apiService.getCurrentUser();

        setUser(currentUser.user);

        if (currentUser.user.role === 'student') {
          try {
            const studentProfile = await apiService.getStudentProfile();

            console.log(
              '[AuthContext] Student profile loaded after login:',
              studentProfile
            );
            console.log(
              '[AuthContext] Student Roll Number:',
              studentProfile?.roll_number
            );

            setStudent(studentProfile);
          } catch (studentError) {
            console.warn(
              '[AuthContext] Student profile loading failed after login:',
              studentError
            );

            setStudent(currentUser.student || null);
          }

          setFaculty(null);
        } else if (currentUser.user.role === 'faculty') {
          try {
            const facultyProfile = await apiService.getFacultyProfile();

            console.log(
              '[AuthContext] Faculty profile loaded after login:',
              facultyProfile
            );
            console.log(
              '[AuthContext] Faculty Employee ID:',
              facultyProfile?.employee_id
            );

            setFaculty(facultyProfile);
          } catch (facultyError) {
            console.warn(
              '[AuthContext] Faculty profile loading failed after login:',
              facultyError
            );

            setFaculty(currentUser.faculty || null);
          }

          setStudent(null);
        } else {
          setStudent(null);
          setFaculty(null);
        }
      } catch (profileError) {
        console.warn(
          '[AuthContext] Profile loading failed after successful login:',
          profileError
        );
      }

      return res.user;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
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







