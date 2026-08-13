import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Bell,
  CheckSquare,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';

  const studentLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile', label: 'Student Profile', icon: User },
    { to: '/catalog', label: 'Course Catalog', icon: BookOpen },
    { to: '/my-courses', label: 'My Registrations', icon: ClipboardList },
    { to: '/grades', label: 'Grades & Transcript', icon: GraduationCap },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ];

  const facultyLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile', label: 'Faculty Profile', icon: User },
    { to: '/faculty/courses', label: 'Assigned Courses', icon: BookOpen },
    { to: '/faculty/grade-management', label: 'Grade Management', icon: Award },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ];

  const links = isStudent ? studentLinks : isFaculty ? facultyLinks : [];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Role Tag */}
        <div className="px-3 py-2 bg-red-50 rounded-lg border border-red-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#800000] uppercase tracking-wider">
            {isStudent ? 'Student Portal' : 'Faculty Portal'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#800000] text-white font-semibold shadow-xs'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700">Indian Institute of Technology Madras</p>
        <p>Monsoon Semester 2026</p>
        <p className="text-[10px] text-gray-400">System Version 2.4.0</p>
      </div>
    </aside>
  );
};
