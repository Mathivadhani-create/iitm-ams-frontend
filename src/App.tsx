import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StudentDashboard } from './pages/StudentDashboard';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { StudentProfile } from './pages/StudentProfile';
import { FacultyProfile } from './pages/FacultyProfile';
import { CourseCatalog } from './pages/CourseCatalog';
import { MyCourses } from './pages/MyCourses';
import { StudentGrades } from './pages/StudentGrades';
import { FacultyCourses } from './pages/FacultyCourses';
import { FacultyGradeManagement } from './pages/FacultyGradeManagement';
import { NotificationsPage } from './pages/NotificationsPage';
import { Unauthorized } from './pages/Unauthorized';
import { NotFound } from './pages/NotFound';

const ProtectedRoute: React.FC<{
  allowedRoles?: ('student' | 'faculty')[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-xs text-gray-500 font-medium">
        Verifying IITM AMS Session...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'student') {
    return <StudentDashboard />;
  } else if (user?.role === 'faculty') {
    return <FacultyDashboard />;
  }
  return <Navigate to="/login" replace />;
};

const ProfileRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'student') {
    return <StudentProfile />;
  } else if (user?.role === 'faculty') {
    return <FacultyProfile />;
  }
  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardRedirect />} />
            <Route path="profile" element={<ProfileRedirect />} />
            <Route path="notifications" element={<NotificationsPage />} />

            {/* Student Only Routes */}
            <Route
              path="catalog"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CourseCatalog />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-courses"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MyCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="grades"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentGrades />
                </ProtectedRoute>
              }
            />

            {/* Faculty Only Routes */}
            <Route
              path="faculty/courses"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="faculty/grade-management"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyGradeManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch All 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
