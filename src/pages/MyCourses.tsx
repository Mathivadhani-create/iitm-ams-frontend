import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Registration } from '../types';
import {  BookOpen, Trash2, Calendar, CheckCircle2, AlertTriangle , X } from 'lucide-react';

export const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [droppingId, setDroppingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadRegs = async () => {
    try {
      setLoading(true);
      const data = await apiService.getStudentRegistrations();
      setRegistrations(data.filter((r) => r.status === 'registered'));
    } catch (err: any) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegs();
  }, []);

  const handleDrop = async (id: string, courseCode: string) => {
    if (!confirm(`Are you sure you want to drop course registration for ${courseCode}?`)) {
      return;
    }

    try {
      setDroppingId(id);
      setMessage(null);
      await apiService.dropCourse(id);
      setMessage(`Successfully dropped course ${courseCode}.`);
      await loadRegs();
    } catch (err: any) {
      alert(err.message || 'Failed to drop course.');
    } finally {
      setDroppingId(null);
    }
  };

  const totalCredits = registrations.reduce(
    (acc, r) => acc + (r.course_offering?.course?.credits || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Registered Courses</h1>
          <p className="text-xs text-gray-500">
            Active course registrations for Monsoon Semester 2026
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          aria-label="Close registered courses"
          title="Close"
          className="p-2 rounded-lg text-gray-500 hover:text-[#800000] hover:bg-red-50 transition-colors border border-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="bg-red-50 text-[#800000] border border-red-200 px-4 py-2 rounded-xl text-xs font-bold shrink-0">
          Total Term Credits: {totalCredits} Credits
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-500">Loading registrations...</div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-500 space-y-2">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
          <p>You have no active course registrations for this semester.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => {
            const co = reg.course_offering;
            const course = co?.course;
            return (
              <div
                key={reg.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-gray-300 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-[#800000] px-2 py-0.5 bg-red-50 rounded-md border border-red-100">
                      {course?.course_code}
                    </span>
                    <h3 className="font-bold text-sm text-gray-900">{course?.course_name}</h3>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{course?.description}</p>
                  <div className="text-[11px] text-gray-500 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                    <span>Faculty: {co?.faculty?.user?.name || 'Assigned Instructor'}</span>
                    <span>Credits: {course?.credits}</span>
                    <span>Registered on: {new Date(reg.registered_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Enrolled</span>
                  </span>
                  <button
                    onClick={() => handleDrop(reg.id, course?.course_code || '')}
                    disabled={droppingId === reg.id}
                    className="px-3 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg font-medium transition-colors flex items-center space-x-1 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Drop Course</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

