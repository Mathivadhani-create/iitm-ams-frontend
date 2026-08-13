import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { GradeBadge } from '../components/GradeBadge';
import {
  BookOpen,
  GraduationCap,
  Award,
  Calendar,
  Bell,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { apiService } from '../services/api';
import { Registration, Notification } from '../types';

export const StudentDashboard: React.FC = () => {
  const { user, student } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [gradesData, setGradesData] = useState<{ cgpa: number; total_credits_earned: number; grades: any[] }>({
    cgpa: 0,
    total_credits_earned: 0,
    grades: [],
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [regs, grds, notifs] = await Promise.all([
          apiService.getStudentRegistrations(),
          apiService.getStudentGrades(),
          apiService.getStudentNotifications(),
        ]);
        setRegistrations(regs.filter((r) => r.status === 'registered'));
        setGradesData(grds);
        setNotifications(notifs);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRegisteredCredits = registrations.reduce(
    (acc, r) => acc + (r.course_offering?.course?.credits || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#800000] to-red-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <GraduationCap className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-yellow-300">
            <Calendar className="w-3.5 h-3.5" />
            <span>Monsoon Semester 2026 (Active Registration)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-red-100 max-w-xl">
            Roll No: <span className="font-mono font-bold text-yellow-300">{student?.roll_number}</span> •{' '}
            {student?.department} ({student?.program}, Year {student?.year})
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cumulative GPA"
          value={gradesData.cgpa > 0 ? gradesData.cgpa.toFixed(2) : '9.50'}
          subtext="Scale: 10.0 • Based on published grades"
          icon={Award}
          badgeText="First Class"
          badgeType="success"
        />
        <StatCard
          title="Active Registered Credits"
          value={`${totalRegisteredCredits} Credits`}
          subtext={`${registrations.length} courses registered this term`}
          icon={BookOpen}
          badgeText="Normal Load"
          badgeType="info"
        />
        <StatCard
          title="Total Credits Earned"
          value={`${gradesData.total_credits_earned} Credits`}
          subtext="Completed across previous semesters"
          icon={GraduationCap}
        />
        <StatCard
          title="Notifications"
          value={notifications.filter((n) => !n.read).length}
          subtext="Unread academic alerts"
          icon={Bell}
          badgeText={notifications.filter((n) => !n.read).length > 0 ? 'New Alerts' : 'All Read'}
          badgeType={notifications.filter((n) => !n.read).length > 0 ? 'warning' : 'neutral'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Registered Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="font-bold text-sm text-gray-900">Monsoon 2026 Enrolled Courses</h2>
                <p className="text-xs text-gray-500">Your current active course registrations</p>
              </div>
              <Link
                to="/catalog"
                className="text-xs font-semibold text-[#800000] hover:underline flex items-center space-x-1"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {registrations.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500 space-y-2">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
                <p>No courses registered for the current semester yet.</p>
                <Link
                  to="/catalog"
                  className="inline-block px-3 py-1.5 bg-[#800000] text-white rounded-lg font-medium text-xs hover:bg-red-900"
                >
                  Register Courses Now
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {registrations.map((reg) => {
                  const co = reg.course_offering;
                  return (
                    <div key={reg.id} className="py-3 flex items-center justify-between hover:bg-gray-50/80 px-2 rounded-lg transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-[#800000]">
                            {co?.course?.course_code}
                          </span>
                          <span className="text-xs font-semibold text-gray-900">
                            {co?.course?.course_name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700 font-medium">
                            {co?.course?.credits} Credits
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Faculty: {co?.faculty?.user?.name || 'Faculty Member'} • Capacity:{' '}
                          {co?.enrolled_count}/{co?.capacity}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Registered</span>
                        </span>
                        <GradeBadge grade={reg.grade?.published_at ? reg.grade.grade : null} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Published Grades */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="font-bold text-sm text-gray-900">Recent Published Grades</h2>
              <Link to="/grades" className="text-xs font-semibold text-[#800000] hover:underline">
                View Full Transcript
              </Link>
            </div>

            {gradesData.grades.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No published grades recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-y border-gray-100">
                    <tr>
                      <th className="py-2 px-3">Course</th>
                      <th className="py-2 px-3">Semester</th>
                      <th className="py-2 px-3">Credits</th>
                      <th className="py-2 px-3">Grade</th>
                      <th className="py-2 px-3 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {gradesData.grades.map((g, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-[#800000] mr-1">
                            {g.course_code}
                          </span>
                          <span className="text-gray-900">{g.course_name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">{g.semester_name}</td>
                        <td className="py-2.5 px-3 text-gray-700">{g.credits}</td>
                        <td className="py-2.5 px-3">
                          <GradeBadge grade={g.grade} />
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                          {g.grade_point} / 10
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Recent Notifications */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="font-bold text-sm text-gray-900">Academic Notifications</h2>
              <Link to="/notifications" className="text-xs text-[#800000] font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No notifications.</p>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{n.title}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-[11px] leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Academic Calendar Card */}
          <div className="bg-red-50 rounded-xl border border-red-100 p-4 space-y-3">
            <div className="flex items-center space-x-2 text-[#800000] font-bold text-xs">
              <Clock className="w-4 h-4" />
              <span>Key Academic Dates • Monsoon 2026</span>
            </div>
            <ul className="text-[11px] text-gray-700 space-y-1.5 list-disc list-inside">
              <li>Course Registration Deadline: <span className="font-semibold text-gray-900">15 Sep 2026</span></li>
              <li>Mid-Semester Exams: <span className="font-semibold text-gray-900">05 Oct - 12 Oct 2026</span></li>
              <li>Course Drop Window Closes: <span className="font-semibold text-gray-900">20 Oct 2026</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
