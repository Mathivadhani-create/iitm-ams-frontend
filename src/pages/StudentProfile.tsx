import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, GraduationCap, Building2, Calendar, Mail, Hash, BookOpen } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user, student } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="w-20 h-20 rounded-full bg-[#800000] text-yellow-300 flex items-center justify-center font-bold text-2xl uppercase border-4 border-red-100 shadow-sm shrink-0">
          {user?.name.slice(0, 2)}
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
          <p className="text-xs text-[#800000] font-semibold tracking-wider uppercase">
            Official Student Profile • IIT Madras
          </p>
          <p className="text-xs text-gray-500 font-mono">{user?.email}</p>
        </div>
      </div>

      {/* Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 flex items-center space-x-2">
            <Hash className="w-4 h-4 text-[#800000]" />
            <span>Academic Identification</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Roll Number</span>
              <span className="font-mono font-bold text-gray-900">{student?.roll_number}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Academic Program</span>
              <span className="font-semibold text-gray-900">{student?.program}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Current Year</span>
              <span className="font-semibold text-gray-900">Year {student?.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Department</span>
              <span className="font-semibold text-gray-900">{student?.department}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-[#800000]" />
            <span>Institutional Details</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Institution</span>
              <span className="font-semibold text-gray-900">IIT Madras (Chennai)</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Current Semester</span>
              <span className="font-semibold text-gray-900">Monsoon 2026</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Account Role</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Active Student
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Registration Date</span>
              <span className="font-mono text-gray-700">
                {student?.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
