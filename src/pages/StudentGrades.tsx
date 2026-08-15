import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { GradeBadge } from '../components/GradeBadge';
import { GraduationCap, Award, Printer, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StudentGrades: React.FC = () => {
  const { student, user } = useAuth();
  const [gradesData, setGradesData] = useState<{
    cgpa: number;
    total_credits_earned: number;
    grades: any[];
  }>({
    cgpa: 0,
    total_credits_earned: 0,
    grades: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        const res = await apiService.getStudentGrades();
        setGradesData(res);
      } catch (err) {
        console.error('Failed to load grades:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Official Grade Transcript</h1>
          <p className="text-xs text-gray-500">
            Published course grades, credit breakdown, and CGPA calculation
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-gray-300 shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Transcript</span>
        </button>
      </div>

      {/* CGPA Summary Banner */}
      <div className="bg-gradient-to-r from-red-900 to-[#800000] text-white rounded-2xl p-6 shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-200">
            Cumulative GPA (CGPA)
          </span>
          <div className="text-3xl font-black text-yellow-300">
            {gradesData.cgpa.toFixed(2)} / 10.0
          </div>
          <p className="text-[11px] text-red-100">10-point Academic Scale</p>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-200">
            Total Credits Earned
          </span>
          <div className="text-3xl font-bold text-white">
            {gradesData.total_credits_earned} Credits
          </div>
          <p className="text-[11px] text-red-100">Across all completed courses</p>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-200">
            Academic Status
          </span>
          <div className="text-lg font-bold text-emerald-300 flex items-center space-x-1.5 mt-1">
            <CheckCircle2 className="w-5 h-5" />
            <span>Good Standing (First Class)</span>
          </div>
          <p className="text-[11px] text-red-100">Roll No: {student?.roll_number}</p>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
        <h2 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-3">
          Semester Grade Sheet
        </h2>

        {loading ? (
          <div className="text-center py-8 text-xs text-gray-500">Loading grade record...</div>
        ) : (gradesData.grades ?? []).length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">
            No published grades available yet for your account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-y border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Course Code</th>
                  <th className="py-2.5 px-3">Course Title</th>
                  <th className="py-2.5 px-3">Semester</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Letter Grade</th>
                  <th className="py-2.5 px-3 text-right">Grade Point</th>
                  <th className="py-2.5 px-3 text-right">Publication Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {gradesData.grades.map((g, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80">
                    <td className="py-3 px-3 font-mono font-bold text-[#800000]">
                      {g.course_code ?? "-"}
                    </td>
                    <td className="py-3 px-3 text-gray-900 font-semibold">{g.course_name ?? "-"}</td>
                    <td className="py-3 px-3 text-gray-600">{g.semester_name ?? "-"}</td>
                    <td className="py-3 px-3 text-gray-700">{g.credits ?? 0}</td>
                    <td className="py-3 px-3">
                      <GradeBadge grade={typeof g.grade === "object" ? g.grade.grade : g.grade} />
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">
                      {g.grade_point ?? 0} / 10
                    </td>
                    <td className="py-3 px-3 text-right text-gray-500 font-mono text-[11px]">
                      {g.published_at ? new Date(g.published_at).toLocaleDateString() : 'Published'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grading Scale Legend */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2 text-xs text-gray-600">
        <h3 className="font-bold text-gray-800 text-xs">IIT Madras Academic Grading System:</h3>
        <p className="text-[11px] leading-relaxed">
          <strong className="text-gray-900">A+ / A</strong> (10.0 points) &bull;{' '}
          <strong className="text-gray-900">A-</strong> (9.0 points) &bull;{' '}
          <strong className="text-gray-900">B+</strong> (8.0 points) &bull;{' '}
          <strong className="text-gray-900">B</strong> (7.0 points) &bull;{' '}
          <strong className="text-gray-900">B-</strong> (6.0 points) &bull;{' '}
          <strong className="text-gray-900">C+ / C</strong> (5.0 points) &bull;{' '}
          <strong className="text-gray-900">D</strong> (4.0 points) &bull;{' '}
          <strong className="text-rose-700">F</strong> (0 points)
        </p>
      </div>
    </div>
  );
};





