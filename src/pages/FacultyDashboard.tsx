import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { apiService } from '../services/api';
import { CourseOffering } from '../types';
import { BookOpen, Users, Award, Bell, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { user, faculty } = useAuth();
  const [assignedCourses, setAssignedCourses] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await apiService.getFacultyAssignedCourses();
        setAssignedCourses(data);
      } catch (err) {
        console.error('Failed to load faculty courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const totalEnrolledStudents = assignedCourses.reduce(
    (acc, c) => acc + (c.enrolled_count || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#800000] to-red-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-yellow-300">
            <span>Faculty Portal â€¢ Monsoon Semester 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-red-100 max-w-xl">
  Employee ID:{' '}
  <span className="font-mono font-bold text-yellow-300">
    {faculty?.employee_id || 'Loading...'}
  </span>
  {' • '}
  {faculty?.designation || 'N/A'}, {faculty?.department || 'N/A'}
</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Course Offerings"
          value={`${assignedCourses.length} Courses`}
          subtext="Courses assigned in current term"
          icon={BookOpen}
          badgeText="Active Instructor"
          badgeType="info"
        />
        <StatCard
          title="Total Enrolled Students"
          value={`${totalEnrolledStudents} Students`}
          subtext="Across all your assigned offerings"
          icon={Users}
          badgeText="Normal Capacity"
          badgeType="success"
        />
        <StatCard
          title="Grade Submissions"
          value="Active Portal"
          subtext="Upload draft or publish final grades"
          icon={Award}
          badgeText="Publication Ready"
          badgeType="warning"
        />
      </div>

      {/* Assigned Courses Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="font-bold text-sm text-gray-900">Your Assigned Courses (Monsoon 2026)</h2>
            <p className="text-xs text-gray-500">Manage student rosters and grade publication</p>
          </div>
          <Link
            to="/faculty/grade-management"
            className="px-3 py-1.5 bg-[#800000] text-white rounded-lg text-xs font-bold hover:bg-red-900 transition-colors flex items-center space-x-1"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Grade Management</span>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-gray-500">Loading assigned courses...</div>
        ) : assignedCourses.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-6">No courses assigned for this semester.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {assignedCourses.map((co) => {
              const course = co.course;
              return (
                <div
                  key={co.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/80 px-3 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-[#800000] px-2 py-0.5 bg-red-50 rounded-md border border-red-100">
                        {course?.course_code}
                      </span>
                      <h3 className="font-bold text-sm text-gray-900">{course?.course_name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700 font-medium">
                        {course?.credits} Credits
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{course?.description}</p>
                    <p className="text-[11px] text-gray-500">
                      Semester: {co.semester?.name} â€¢ Enrolled: {co.enrolled_count}/{co.capacity} students
                    </p>
                  </div>

                  <div className="shrink-0">
                    <Link
                      to="/faculty/grade-management"
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors border border-gray-300"
                    >
                      <span>Manage Grades</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


