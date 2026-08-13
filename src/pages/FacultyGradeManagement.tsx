import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { CourseOffering, EnrolledStudent, GradeLetter } from '../types';
import { GradeBadge } from '../components/GradeBadge';
import {
  Award,
  Users,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Mail,
  Clock,
  BookOpen,
} from 'lucide-react';

const ALLOWED_GRADES: GradeLetter[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

export const FacultyGradeManagement: React.FC = () => {
  const [assignedOfferings, setAssignedOfferings] = useState<CourseOffering[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);

  // Local state for draft grades map: { registration_id -> letter_grade }
  const [gradeInputs, setGradeInputs] = useState<Record<string, GradeLetter>>({});
  const [savingRegId, setSavingRegId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [publishResult, setPublishResult] = useState<{
    published_count: number;
    emails_dispatched: number;
    timestamp: string;
  } | null>(null);

  // Load assigned course offerings
  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        setLoadingOfferings(true);
        const courses = await apiService.getFacultyAssignedCourses();
        setAssignedOfferings(courses);
        if (courses.length > 0) {
          setSelectedOfferingId(courses[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load faculty assigned courses:', err);
      } finally {
        setLoadingOfferings(false);
      }
    };
    fetchOfferings();
  }, []);

  // Load student roster when selectedOfferingId changes
  const loadRoster = async (offeringId: string) => {
    if (!offeringId) return;
    try {
      setLoadingRoster(true);
      setMessage(null);
      setPublishResult(null);
      const data = await apiService.getEnrolledStudents(offeringId);
      setOffering(data.offering);
      setStudents(data.students);

      // Pre-fill grade inputs with existing grades
      const initialMap: Record<string, GradeLetter> = {};
      data.students.forEach((s) => {
        if (s.grade?.grade) {
          initialMap[s.registration_id] = s.grade.grade;
        } else {
          initialMap[s.registration_id] = 'A'; // Default selection
        }
      });
      setGradeInputs(initialMap);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load enrolled students.' });
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (selectedOfferingId) {
      loadRoster(selectedOfferingId);
    }
  }, [selectedOfferingId]);

  const handleGradeChange = (registrationId: string, val: GradeLetter) => {
    setGradeInputs((prev) => ({ ...prev, [registrationId]: val }));
  };

  const handleSaveGrade = async (registrationId: string) => {
    const selectedGrade = gradeInputs[registrationId];
    if (!selectedGrade) return;

    try {
      setSavingRegId(registrationId);
      setMessage(null);
      await apiService.uploadGrade(selectedOfferingId, registrationId, selectedGrade);
      setMessage({
        type: 'success',
        text: 'Draft grade saved successfully in database.',
      });
      await loadRoster(selectedOfferingId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save grade.' });
    } finally {
      setSavingRegId(null);
    }
  };

  const handlePublishAllGrades = async () => {
    if (!confirm(`Publish grades for all enrolled students in ${offering?.course?.course_code}? This will record official publication timestamps, create student notifications, and trigger email alerts.`)) {
      return;
    }

    try {
      setIsPublishing(true);
      setMessage(null);
      // Ensure current inputs are saved first
      for (const s of students) {
        const val = gradeInputs[s.registration_id];
        if (val) {
          await apiService.uploadGrade(selectedOfferingId, s.registration_id, val);
        }
      }

      const res = await apiService.publishGrades(selectedOfferingId);
      setPublishResult(res);
      setMessage({
        type: 'success',
        text: `Grades successfully published! Dispatched ${res.emails_dispatched} student notifications & email notifications.`,
      });
      await loadRoster(selectedOfferingId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Grade publication failed.' });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Faculty Grade Management</h1>
          <p className="text-xs text-gray-500">
            Upload, update, and publish student letter grades for your assigned course offerings
          </p>
        </div>

        {/* Course Selector Dropdown */}
        <div className="w-full md:w-80">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            Select Course Offering:
          </label>
          <select
            value={selectedOfferingId}
            onChange={(e) => setSelectedOfferingId(e.target.value)}
            disabled={loadingOfferings}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-bold text-gray-900 bg-red-50/50 focus:ring-2 focus:ring-[#800000] outline-none"
          >
            {assignedOfferings.map((co) => (
              <option key={co.id} value={co.id}>
                {co.course?.course_code} - {co.course?.course_name} ({co.enrolled_count} Students)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Publish Result Modal / Banner */}
      {publishResult && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-emerald-300" />
            <h2 className="font-bold text-sm text-emerald-200 uppercase tracking-wider">
              Grade Publication Successful & Dispatched
            </h2>
          </div>
          <p className="text-xs text-emerald-100">
            Grades for <strong className="text-white">{offering?.course?.course_code}</strong> have been finalized in the database.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="bg-white/10 p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-emerald-200 uppercase block">Records Published</span>
              <span className="text-lg font-bold text-white">{publishResult.published_count} Students</span>
            </div>
            <div className="bg-white/10 p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-emerald-200 uppercase block">Email Notifications</span>
              <span className="text-lg font-bold text-white">{publishResult.emails_dispatched} Sent</span>
            </div>
            <div className="bg-white/10 p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-emerald-200 uppercase block">Timestamp</span>
              <span className="text-xs font-mono font-bold text-emerald-200">
                {new Date(publishResult.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Course Info Banner */}
      {offering && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-xs text-[#800000] px-2 py-0.5 bg-red-50 rounded-md border border-red-100">
                {offering.course?.course_code}
              </span>
              <h2 className="font-bold text-base text-gray-900">{offering.course?.course_name}</h2>
            </div>
            <p className="text-xs text-gray-500">
              Semester: {offering.semester?.name} • Credits: {offering.course?.credits} • Enrolled Roster: {students.length} Students
            </p>
          </div>

          <button
            onClick={handlePublishAllGrades}
            disabled={isPublishing || students.length === 0}
            className="px-4 py-2.5 bg-[#800000] text-white rounded-xl text-xs font-bold hover:bg-red-900 transition-colors shadow-sm flex items-center space-x-2 disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>{isPublishing ? 'Publishing Grades...' : 'Publish Grades for Offering'}</span>
          </button>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="font-bold text-sm text-gray-900">Enrolled Student Roster & Grade Input</h2>
          <span className="text-xs text-gray-500 font-medium">
            Allowed Grades: A+, A, A-, B+, B, B-, C+, C, C-, D, F
          </span>
        </div>

        {loadingRoster ? (
          <div className="text-center py-12 text-xs text-gray-500">Loading student roster...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">
            No students currently enrolled in this course offering.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-y border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Roll Number</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Program / Dept</th>
                  <th className="py-2.5 px-3">Current Status</th>
                  <th className="py-2.5 px-3">Select Letter Grade</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {students.map((s) => {
                  const studentInfo = s.student;
                  const userInfo = studentInfo.user;
                  const currentGrade = s.grade;
                  const isPublished = !!currentGrade?.published_at;

                  return (
                    <tr key={s.registration_id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-3 font-mono font-bold text-[#800000]">
                        {studentInfo.roll_number}
                      </td>
                      <td className="py-3 px-3 text-gray-900 font-semibold">{userInfo?.name}</td>
                      <td className="py-3 px-3 text-gray-600">
                        {studentInfo.program} • {studentInfo.department}
                      </td>
                      <td className="py-3 px-3">
                        {isPublished ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Published ({currentGrade.grade})</span>
                          </span>
                        ) : currentGrade ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Draft ({currentGrade.grade})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] text-gray-500 bg-gray-100">
                            <span>Not Uploaded</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={gradeInputs[s.registration_id] || 'A'}
                          onChange={(e) =>
                            handleGradeChange(s.registration_id, e.target.value as GradeLetter)
                          }
                          className="px-2.5 py-1.5 border border-gray-300 rounded-lg font-bold text-xs bg-white focus:ring-2 focus:ring-[#800000] outline-none"
                        >
                          {ALLOWED_GRADES.map((g) => (
                            <option key={g} value={g}>
                              Grade {g}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleSaveGrade(s.registration_id)}
                          disabled={savingRegId === s.registration_id}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs font-semibold border border-gray-300 transition-colors inline-flex items-center space-x-1 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5 text-[#800000]" />
                          <span>
                            {savingRegId === s.registration_id ? 'Saving...' : 'Save Draft'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
