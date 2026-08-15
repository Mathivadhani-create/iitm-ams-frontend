import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, ShieldCheck, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
    try {
      setLoading(true);
      await login(demoEmail, 'Password123!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-[#800000] text-white flex items-center justify-center font-serif font-black text-2xl mx-auto shadow-lg border-2 border-yellow-400">
            IITM
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            IIT Madras Academic Portal
          </h1>
          <p className="text-xs text-gray-600 font-medium">
            Academic Management System (IITM AMS)
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-bold text-gray-900">Sign in to your portal</h2>
            <p className="text-xs text-gray-500">Access student registration, grades, and faculty workflows</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                IITM Institutional Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student1@iitm.ac.in or faculty1@iitm.ac.in"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#800000] text-white rounded-lg font-semibold text-xs hover:bg-red-900 transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="pt-2 text-center text-xs text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#800000] hover:underline">
              Register Student/Faculty Account
            </Link>
          </div>
        </div>

        {/* Evaluation Quick Demo Selector */}
        {showTestAccounts && (
        <div className="relative bg-white/80 rounded-xl p-4 border border-gray-200 space-y-3">
          <button
            type="button"
            onClick={() => setShowTestAccounts(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 text-lg font-bold leading-none"
            aria-label="Close test accounts"
            title="Close"
          >
            ×
          </button>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700">
            <UserCheck className="w-4 h-4 text-[#800000]" />
            <span>Recruitment Evaluation Test Accounts</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Click any button below to immediately sign in as a pre-populated test user:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fillCredentials('student1@iitm.ac.in')}
              className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-left text-xs transition-colors"
            >
              <span className="font-bold text-[#800000] block">Student Aravind</span>
              <span className="text-[10px] text-gray-600 block">Roll: BE21B001</span>
            </button>
            <button
              onClick={() => fillCredentials('student2@iitm.ac.in')}
              className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-left text-xs transition-colors"
            >
              <span className="font-bold text-[#800000] block">Student Ananya</span>
              <span className="text-[10px] text-gray-600 block">Roll: CS22M005</span>
            </button>
            <button
              onClick={() => fillCredentials('faculty1@iitm.ac.in')}
              className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-left text-xs transition-colors"
            >
              <span className="font-bold text-amber-900 block">Prof. Ramesh C.</span>
              <span className="text-[10px] text-gray-600 block">Emp: FAC101</span>
            </button>
            <button
              onClick={() => fillCredentials('faculty2@iitm.ac.in')}
              className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-left text-xs transition-colors"
            >
              <span className="font-bold text-amber-900 block">Prof. Sunita K.</span>
              <span className="text-[10px] text-gray-600 block">Emp: FAC102</span>
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};







