import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-[#800000] rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">403 - Access Forbidden</h1>
        <p className="text-xs text-gray-600 leading-relaxed">
          You do not have the required role-based permissions to view this administrative resource.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#800000] text-white rounded-lg text-xs font-bold hover:bg-red-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
