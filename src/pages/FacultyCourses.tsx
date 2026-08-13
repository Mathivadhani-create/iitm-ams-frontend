import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { CourseOffering } from '../types';
import { BookOpen, Users, Award, ArrowRight } from 'lucide-react';

export const FacultyCourses: React.FC = () => {
  const [courses, setCourses] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await apiService.getFacultyAssignedCourses();
        setCourses(data);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
        <h1 className="text-xl font-bold text-gray-900">Assigned Courses</h1>
        <p className="text-xs text-gray-500">
          Course offerings assigned to you for teaching and grade management
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-500">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-500">
          No courses assigned for the current semester.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((co) => {
            const course = co.course;
            return (
              <div
                key={co.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-gray-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-mono font-bold text-xs text-[#800000] px-2 py-0.5 bg-red-50 rounded-md border border-red-100">
                      {course?.course_code}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200">
                      {course?.credits} Credits
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">{course?.course_name}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                    {course?.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>Enrolled: {co.enrolled_count}/{co.capacity}</span>
                  </span>
                  <Link
                    to="/faculty/grade-management"
                    className="px-3 py-1.5 bg-[#800000] text-white rounded-lg font-bold hover:bg-red-900 transition-colors flex items-center space-x-1"
                  >
                    <span>Upload & Publish Grades</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
