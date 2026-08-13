export type UserRole = 'student' | 'faculty' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
  studentId?: string;
  facultyId?: string;
}

export interface Student {
  id: string;
  user_id: string;
  roll_number: string;
  department: string;
  program: string;
  year: number;
  created_at?: string;
  user?: User;
}

export interface Faculty {
  id: string;
  user_id: string;
  employee_id: string;
  department: string;
  designation: string;
  created_at?: string;
  user?: User;
}

export interface Course {
  id: string;
  course_code: string;
  course_name: string;
  description: string;
  credits: number;
  department: string;
}

export interface Semester {
  id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  registration_open: boolean;
  registration_close: string;
}

export interface CourseOffering {
  id: string;
  course_id: string;
  faculty_id: string;
  semester_id: string;
  capacity: number;
  course?: Course;
  faculty?: Faculty;
  semester?: Semester;
  enrolled_count?: number;
}

export type GradeLetter = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

export interface Grade {
  id: string;
  registration_id: string;
  grade: GradeLetter;
  grade_point: number;
  uploaded_by: string;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Registration {
  id: string;
  student_id: string;
  course_offering_id: string;
  registered_at: string;
  status: 'registered' | 'dropped';
  course_offering?: CourseOffering;
  grade?: Grade;
}

export interface EnrolledStudent {
  registration_id: string;
  student: Student;
  registered_at: string;
  grade?: Grade;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'grade_published' | 'registration_success' | 'course_update' | 'info';
  read: boolean;
  created_at: string;
}
