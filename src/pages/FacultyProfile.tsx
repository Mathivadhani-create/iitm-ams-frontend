import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Building2, Award, Mail, Hash } from 'lucide-react';

export const FacultyProfile: React.FC = () => {
  const { user, faculty } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="w-20 h-20 rounded-full bg-[#800000] text-yellow-300 flex items-center justify-center font-bold text-2xl uppercase border-4 border-red-100 shadow-sm shrink-0">
          {user?.name.slice(0, 2)}
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
          <p className="text-xs text-[#800000] font-semibold tracking-wider uppercase">
            Faculty Profile • IIT Madras
          </p>
          <p className="text-xs text-gray-500 font-mono">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 flex items-center space-x-2">
            <Hash className="w-4 h-4 text-[#800000]" />
            <span>Faculty Credentials</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Employee ID</span>
              <span className="font-mono font-bold text-gray-900">{faculty?.employee_id}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Designation</span>
              <span className="font-semibold text-gray-900">{faculty?.designation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Department</span>
              <span className="font-semibold text-gray-900">{faculty?.department}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-[#800000]" />
            <span>Academic Duties</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Institution</span>
              <span className="font-semibold text-gray-900">IIT Madras</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">Active Term</span>
              <span className="font-semibold text-gray-900">Monsoon 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Privileges</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Grade Upload & Publication
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
