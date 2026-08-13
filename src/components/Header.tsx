import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, User as UserIcon, RefreshCw, Check, BookOpen } from 'lucide-react';
import { Notification } from '../types';
import { apiService } from '../services/api';

export const Header: React.FC = () => {
  const { user, student, faculty, logout, login, resetSeed } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPopover, setShowNotifPopover] = useState<boolean>(false);
  const [showDemoMenu, setShowDemoMenu] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      if (user.role === 'student') {
        const notifs = await apiService.getStudentNotifications();
        setNotifications(notifs);
      } else if (user.role === 'faculty') {
        const notifs = await apiService.getFacultyNotifications();
        setNotifications(notifs);
      }
    } catch (err) {
      console.error('[Header] Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000); // Auto poll notifications
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleQuickLogin = async (email: string) => {
    try {
      await login(email, 'Password123!');
      setShowDemoMenu(false);
    } catch (err) {
      console.error('Quick login failed:', err);
    }
  };

  const handleResetSeed = async () => {
    if (confirm('Reset database to initial seed data?')) {
      setIsResetting(true);
      await resetSeed();
      setIsResetting(false);
      setShowDemoMenu(false);
    }
  };

  return (
    <header className="bg-[#800000] text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-white text-[#800000] flex items-center justify-center font-serif font-black text-xl shadow-inner border-2 border-yellow-400">
            IITM
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg leading-tight tracking-wide text-white">
              IIT Madras Academic Management System
            </h1>
            <p className="text-[11px] text-red-200 tracking-wider uppercase font-medium">
              Academic Section • Official Portal
            </p>
          </div>
        </div>

        {/* Right Section Controls */}
        <div className="flex items-center space-x-3">
          {/* Quick Demo Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="px-2.5 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-900 text-xs font-medium border border-red-700 flex items-center space-x-1.5 text-red-100 transition-colors"
              title="Quick Switch Accounts for Recruitment Evaluation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Demo Switcher</span>
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 text-gray-800 text-xs z-50">
                <div className="px-3 py-1.5 border-b border-gray-100 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                  Recruitment Challenge Test Accounts
                </div>
                <button
                  onClick={() => handleQuickLogin('student1@iitm.ac.in')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex flex-col border-b border-gray-100"
                >
                  <span className="font-semibold text-gray-900">Aravind S. (Student)</span>
                  <span className="text-gray-500 text-[11px]">Roll: BE21B001 • student1@iitm.ac.in</span>
                </button>
                <button
                  onClick={() => handleQuickLogin('student2@iitm.ac.in')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex flex-col border-b border-gray-100"
                >
                  <span className="font-semibold text-gray-900">Ananya Sharma (Student 2)</span>
                  <span className="text-gray-500 text-[11px]">Roll: CS22M005 • student2@iitm.ac.in</span>
                </button>
                <button
                  onClick={() => handleQuickLogin('faculty1@iitm.ac.in')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex flex-col border-b border-gray-100"
                >
                  <span className="font-semibold text-gray-900">Prof. Ramesh C. (Faculty)</span>
                  <span className="text-gray-500 text-[11px]">Emp: FAC101 • CS3100 / AI5001</span>
                </button>
                <button
                  onClick={() => handleQuickLogin('faculty2@iitm.ac.in')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex flex-col border-b border-gray-100"
                >
                  <span className="font-semibold text-gray-900">Prof. Sunita K. (Faculty 2)</span>
                  <span className="text-gray-500 text-[11px]">Emp: FAC102 • CS4200 / MA1101</span>
                </button>
                <div className="p-2 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={handleResetSeed}
                    className="w-full py-1.5 bg-red-50 text-[#800000] border border-red-200 rounded-lg font-medium text-center hover:bg-red-100 transition-colors"
                  >
                    Reset Seed Database
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifPopover(!showNotifPopover)}
              className="p-2 rounded-lg bg-red-900/60 hover:bg-red-900 text-red-100 relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifPopover && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 text-gray-800 z-50">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">
                    Notifications ({notifications.length})
                  </h3>
                  <span className="text-[11px] text-gray-500">{unreadCount} unread</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">No notifications yet.</div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs flex items-start justify-between ${
                          !n.read ? 'bg-red-50/50' : 'bg-white'
                        }`}
                      >
                        <div className="space-y-1 pr-2">
                          <p className="font-semibold text-gray-900">{n.title}</p>
                          <p className="text-gray-600 leading-relaxed text-[11px]">{n.message}</p>
                          <span className="text-[10px] text-gray-400 block">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="text-xs text-[#800000] hover:underline whitespace-nowrap font-medium flex items-center space-x-0.5"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          {user && (
            <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-red-800">
              <div className="text-right">
                <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                <p className="text-[10px] text-red-200 font-mono">
                  {user.role === 'student' ? student?.roll_number : faculty?.employee_id}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-900 flex items-center justify-center text-xs font-bold text-yellow-300 uppercase border border-red-700">
                {user.role === 'student' ? 'ST' : 'FC'}
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 rounded-lg bg-red-900/60 hover:bg-red-900 text-red-200 hover:text-white transition-colors flex items-center space-x-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
