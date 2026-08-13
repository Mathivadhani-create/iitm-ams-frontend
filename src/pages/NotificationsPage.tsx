import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';
import { Bell, CheckCircle2, Check } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      if (user?.role === 'student') {
        const notifs = await apiService.getStudentNotifications();
        setNotifications(notifs);
      } else if (user?.role === 'faculty') {
        const notifs = await apiService.getFacultyNotifications();
        setNotifications(notifs);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications Inbox</h1>
          <p className="text-xs text-gray-500">Official academic announcements and alerts</p>
        </div>
        <Bell className="w-6 h-6 text-[#800000]" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-500">
          No notifications recorded in your inbox.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between transition-colors ${
                !n.read ? 'bg-red-50/40' : 'bg-white'
              }`}
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-gray-900">{n.title}</span>
                  {!n.read && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-[#800000]">
                      New Alert
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                <span className="text-[11px] text-gray-400 block font-mono">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>

              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center space-x-1 shrink-0"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark Read</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
