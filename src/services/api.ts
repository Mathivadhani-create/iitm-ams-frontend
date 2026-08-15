import {
  User,
  Student,
  Faculty,
  CourseOffering,
  Registration,
  Notification,
  EnrolledStudent,
  GradeLetter,
} from '../types';

const DEFAULT_PRODUCTION_BACKEND = 'https://iitm-ams-backend.onrender.com';

const rawBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? DEFAULT_PRODUCTION_BACKEND : '')
).trim();

const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');

const originUrl = cleanBaseUrl.replace(/\/api$/, '');

const API_BASE = originUrl ? `${originUrl}/api` : '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('iitm_ams_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();

    if (
      text.trimStart().startsWith('<!DOCTYPE') ||
      text.trimStart().startsWith('<html')
    ) {
      throw new Error(
        `Server returned HTML instead of JSON. API target: ${API_BASE}`
      );
    }

    throw new Error(
      text.slice(0, 200) || `HTTP Error ${response.status}`
    );
  }

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorMsg =
      data.message ||
      data.error ||
      `HTTP Error ${response.status}`;

    throw new Error(errorMsg);
  }

  return data.data;
}

export const apiService = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await handleResponse<{
      token: string;
      user: User;
    }>(res);

    return data;
  },

  register: async (payload: any) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return handleResponse<{
      token: string;
      user: User;
    }>(res);
  },

  getCurrentUser: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });

    // Go backend returns the authenticated user directly
    // inside data, not inside data.user.
    const data = await handleResponse<User & {
      studentId?: string;
      facultyId?: string;
      student?: Student;
      faculty?: Faculty;
    }>(res);

    return {
      user: data,
      student: data.student,
      faculty: data.faculty,
    };
  },

  resetSeedData: async () => {
    const res = await fetch(`${API_BASE}/admin/reset-seed`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return handleResponse<{ message: string }>(res);
  },

  // Student Endpoints
  getStudentProfile: async () => {
    const res = await fetch(`${API_BASE}/student/profile`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<Student>(res);
  },

  getAvailableCourses: async () => {
    const res = await fetch(`${API_BASE}/student/courses`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<{
      activeSemester: any;
      offerings: CourseOffering[];
    }>(res);
  },

  getStudentRegistrations: async () => {
    const res = await fetch(`${API_BASE}/student/registrations`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<Registration[]>(res);
  },

  registerCourse: async (course_offering_id: string) => {
    const res = await fetch(`${API_BASE}/student/registrations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ course_offering_id }),
    });

    return handleResponse<Registration>(res);
  },

  dropCourse: async (registration_id: string) => {
    const res = await fetch(
      `${API_BASE}/student/registrations/${registration_id}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    return handleResponse<void>(res);
  },

  getStudentGrades: async () => {
    const res = await fetch(`${API_BASE}/student/grades`, {
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<any>(res);

    return {
      cgpa: Number(data?.cgpa ?? 0),
      total_credits_earned: Number(
        data?.total_credits_earned ?? data?.total_credits ?? 0
      ),
      grades: Array.isArray(data?.grades)
        ? data.grades.map((r: any) => ({
            registration_id: r?.id ?? r?.registration_id ?? '',
            course_code: r?.course_offering?.course?.course_code ?? '-',
            course_name: r?.course_offering?.course?.course_name ?? '-',
            credits: Number(r?.course_offering?.course?.credits ?? 0),
            semester_name: r?.course_offering?.semester?.name ?? '-',
            academic_year:
              r?.course_offering?.semester?.academic_year ?? '',
            grade:
              typeof r?.grade === 'object'
                ? r.grade?.grade ?? ''
                : r?.grade ?? '',
            grade_point: Number(
              typeof r?.grade === 'object'
                ? r.grade?.grade_point ?? 0
                : r?.grade_point ?? 0
            ),
            published_at:
              typeof r?.grade === 'object'
                ? r.grade?.published_at ?? null
                : r?.published_at ?? null,
          }))
        : [],
    };
  },

  getStudentNotifications: async () => {
    const res = await fetch(`${API_BASE}/student/notifications`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<Notification[]>(res);
  },

  markNotificationRead: async (notifId: string) => {
    const res = await fetch(
      `${API_BASE}/student/notifications/${notifId}/read`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
      }
    );

    return handleResponse<void>(res);
  },

  // Faculty Endpoints
  getFacultyProfile: async () => {
    const res = await fetch(`${API_BASE}/faculty/profile`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<Faculty>(res);
  },

  getFacultyAssignedCourses: async () => {
    const res = await fetch(`${API_BASE}/faculty/courses`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<CourseOffering[]>(res);
  },

  getEnrolledStudents: async (offeringId: string) => {
    const res = await fetch(
      `${API_BASE}/faculty/courses/${offeringId}/students`,
      {
        headers: getAuthHeaders(),
      }
    );

    return handleResponse<({ offering?: CourseOffering; students?: EnrolledStudent[] } | EnrolledStudent[])>(res);
  },

  uploadGrade: async (
    offeringId: string,
    registrationId: string,
    grade: GradeLetter
  ) => {
    const res = await fetch(
      `${API_BASE}/faculty/courses/${offeringId}/grades`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          registration_id: registrationId,
          grade,
        }),
      }
    );

    return handleResponse<any>(res);
  },

  publishGrades: async (offeringId: string) => {
    const res = await fetch(
      `${API_BASE}/faculty/courses/${offeringId}/publish-grades`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    return handleResponse<{
      published_count: number;
      emails_dispatched: number;
      timestamp: string;
    }>(res);
  },

  getFacultyNotifications: async () => {
    const res = await fetch(`${API_BASE}/faculty/notifications`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<Notification[]>(res);
  },
};




