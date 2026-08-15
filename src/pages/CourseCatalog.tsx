import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { CourseOffering, Registration } from '../types';
import {
  Search,
  BookOpen,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Lock,
} from 'lucide-react';

export const CourseCatalog: React.FC = () => {
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [activeSemester, setActiveSemester] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const [resCatalog, resRegs] = await Promise.all([
        apiService.getAvailableCourses(),
        apiService.getStudentRegistrations(),
      ]);
      setOfferings(Array.isArray(resCatalog) ? resCatalog : (Array.isArray(resCatalog?.offerings) ? resCatalog.offerings : []));
      setActiveSemester(resCatalog?.activeSemester ?? (Array.isArray(resCatalog) && resCatalog.length > 0 ? resCatalog[0]?.semester : null));
      setMyRegistrations(Array.isArray(resRegs) ? resRegs.filter((r) => r.status === 'registered') : []);
    } catch (err: any) {
      console.error('Failed to load course catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const registeredOfferingIds = new Set(myRegistrations.map((r) => r.course_offering_id));

  const handleRegister = async (offeringId: string) => {
    try {
      setRegisteringId(offeringId);
      setFeedback(null);
      await apiService.registerCourse(offeringId);
      setFeedback({
        type: 'success',
        message: 'Course registration successful! Added to your enrolled courses.',
      });
      await loadCatalog();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Registration failed.',
      });
    } finally {
      setRegisteringId(null);
    }
  };

  const filteredOfferings = offerings.filter((co) => {
    const course = co.course;
    const matchesSearch =
      course?.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course?.course_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      departmentFilter === 'All' || course?.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Monsoon 2026 Course Catalog</h1>
          <p className="text-xs text-gray-500">
            Browse and register for available course offerings in the current semester
          </p>
        </div>
        {activeSemester && (
          <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Registration Open until {new Date(activeSemester.registration_close).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Course Code or Course Title (e.g. CS3100, Data Structures)..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] outline-none"
          />
        </div>
        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] outline-none bg-white font-medium text-gray-700"
          >
            <option value="All">All Academic Departments</option>
            <option value="Computer Science & Engineering">Computer Science & Engineering</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Mathematics">Mathematics</option>
          </select>
        </div>
      </div>

      {/* Offerings Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-gray-500">Loading available courses...</div>
      ) : filteredOfferings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-500">
          No course offerings matched your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOfferings.map((co) => {
            const course = co.course;
            const isRegistered = registeredOfferingIds.has(co.id);
            const enrolled = co.enrolled_count || 0;
            const capacity = co.capacity;
            const isFull = enrolled >= capacity;
            const fillPercent = Math.min(100, Math.round((enrolled / capacity) * 100));

            return (
              <div
                key={co.id}
                className={`bg-white rounded-xl border p-5 shadow-xs space-y-4 transition-all flex flex-col justify-between ${
                  isRegistered ? 'border-emerald-300 bg-emerald-50/20' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#800000] px-2 py-0.5 bg-red-50 rounded-md border border-red-100">
                        {course?.course_code}
                      </span>
                      <h3 className="font-bold text-sm text-gray-900 mt-1">{course?.course_name}</h3>
                    </div>
                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                      {course?.credits} Credits
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                    {course?.description}
                  </p>

                  <div className="pt-2 text-xs text-gray-500 space-y-1">
                    <p className="flex items-center space-x-1 font-medium text-gray-700">
                      <UserCheck className="w-3.5 h-3.5 text-[#800000]" />
                      <span>Instructor: {co.faculty?.user?.name || 'Prof. Assigned'}</span>
                    </p>
                    <p className="text-[11px] text-gray-500">{course?.department}</p>
                  </div>
                </div>

                {/* Capacity & Register Action */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span>Seats Enrolled</span>
                      </span>
                      <span className={isFull ? 'text-red-600 font-bold' : 'text-gray-900'}>
                        {enrolled} / {capacity}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isFull ? 'bg-red-500' : fillPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${fillPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {isRegistered ? (
                    <button
                      disabled
                      className="w-full py-2 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 cursor-not-allowed border border-emerald-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Already Registered</span>
                    </button>
                  ) : isFull ? (
                    <button
                      disabled
                      className="w-full py-2 bg-gray-100 text-gray-500 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-not-allowed border border-gray-200"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Course Capacity Reached</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(co.id)}
                      disabled={registeringId === co.id}
                      className="w-full py-2 bg-[#800000] text-white rounded-lg text-xs font-bold hover:bg-red-900 transition-colors shadow-xs disabled:opacity-50"
                    >
                      {registeringId === co.id ? 'Registering...' : 'Register for Course'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


