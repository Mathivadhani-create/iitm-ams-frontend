import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Student,
  Faculty,
  Course,
  Semester,
  CourseOffering,
  Registration,
  Grade,
  Notification,
  GradeLetter,
} from '../types';

interface DatabaseSchema {
  users: User[];
  students: Student[];
  faculty: Faculty[];
  courses: Course[];
  semesters: Semester[];
  course_offerings: CourseOffering[];
  registrations: Registration[];
  grades: Grade[];
  notifications: Notification[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

export function calculateGradePoint(grade: GradeLetter): number {
  switch (grade) {
    case 'A+':
    case 'A':
      return 10;
    case 'A-':
      return 9;
    case 'B+':
      return 8;
    case 'B':
      return 7;
    case 'B-':
      return 6;
    case 'C+':
      return 5;
    case 'C':
      return 5;
    case 'C-':
      return 4;
    case 'D':
      return 4;
    case 'F':
      return 0;
    default:
      return 0;
  }
}

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.error('[DatabaseStore] Error loading DB file, re-initializing seed data:', err);
    }
    const seed = this.generateSeedData();
    this.saveDataDirect(seed);
    return seed;
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DatabaseStore] Error writing DB file:', err);
    }
  }

  private persist() {
    this.saveDataDirect(this.data);
  }

  public resetToSeedData(): DatabaseSchema {
    this.data = this.generateSeedData();
    this.persist();
    return this.data;
  }

  private generateSeedData(): DatabaseSchema {
    const salt = bcrypt.genSaltSync(10);
    const commonPasswordHash = bcrypt.hashSync('Password123!', salt);
    const now = new Date().toISOString();

    // 1. Users
    const users: User[] = [
      {
        id: 'u-std-1',
        name: 'Aravind Swaminathan',
        email: 'student1@iitm.ac.in',
        password_hash: commonPasswordHash,
        role: 'student',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'u-std-2',
        name: 'Ananya Sharma',
        email: 'student2@iitm.ac.in',
        password_hash: commonPasswordHash,
        role: 'student',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'u-std-3',
        name: 'Rohan Deshmukh',
        email: 'rohan.d@student.iitm.ac.in',
        password_hash: commonPasswordHash,
        role: 'student',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'u-std-4',
        name: 'Kavya Subramanian',
        email: 'kavya.s@student.iitm.ac.in',
        password_hash: commonPasswordHash,
        role: 'student',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'u-std-5',
        name: 'Vikramaditya Roy',
        email: 'vikram.roy@student.iitm.ac.in',
        password_hash: commonPasswordHash,
        role: 'student',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'u-fac-1',
        name: 'Prof. Ramesh Chandra',
        email: 'faculty1@iitm.ac.in',
        password_hash: commonPasswordHash,
        role: 'faculty',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'u-fac-2',
        name: 'Prof. Sunita Krishnan',
        email: 'faculty2@iitm.ac.in',
        password_hash: commonPasswordHash,
        role: 'faculty',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'u-fac-3',
        name: 'Prof. Arvind Kumar',
        email: 'arvind.k@iitm.ac.in',
        password_hash: commonPasswordHash,
        role: 'faculty',
        created_at: now,
        updated_at: now,
      },
    ];

    // 2. Students
    const students: Student[] = [
      {
        id: 'std-1',
        user_id: 'u-std-1',
        roll_number: 'BE21B001',
        department: 'Computer Science & Engineering',
        program: 'B.Tech',
        year: 3,
        created_at: now,
      },
      {
        id: 'std-2',
        user_id: 'u-std-2',
        roll_number: 'CS22M005',
        department: 'Computer Science & Engineering',
        program: 'M.Tech',
        year: 2,
        created_at: now,
      },
      {
        id: 'std-3',
        user_id: 'std-3-uid',
        roll_number: 'EE20B042',
        department: 'Electrical Engineering',
        program: 'B.Tech',
        year: 4,
        created_at: now,
      },
      {
        id: 'std-4',
        user_id: 'std-4-uid',
        roll_number: 'ME23B015',
        department: 'Mechanical Engineering',
        program: 'Dual Degree',
        year: 2,
        created_at: now,
      },
      {
        id: 'std-5',
        user_id: 'std-5-uid',
        roll_number: 'CH21B088',
        department: 'Chemical Engineering',
        program: 'B.Tech',
        year: 3,
        created_at: now,
      },
    ];

    // 3. Faculty
    const faculty: Faculty[] = [
      {
        id: 'fac-1',
        user_id: 'u-fac-1',
        employee_id: 'FAC101',
        department: 'Computer Science & Engineering',
        designation: 'Professor & HOD',
        created_at: now,
      },
      {
        id: 'fac-2',
        user_id: 'u-fac-2',
        employee_id: 'FAC102',
        department: 'Computer Science & Engineering',
        designation: 'Associate Professor',
        created_at: now,
      },
      {
        id: 'fac-3',
        user_id: 'u-fac-3',
        employee_id: 'FAC103',
        department: 'Electrical Engineering',
        designation: 'Professor',
        created_at: now,
      },
    ];

    // 4. Courses
    const courses: Course[] = [
      {
        id: 'c-1',
        course_code: 'CS1010',
        course_name: 'Introduction to Programming',
        description: 'Fundamental principles of structured programming, algorithmic problem solving, recursion, and memory management in C/C++.',
        credits: 4,
        department: 'Computer Science & Engineering',
        created_at: now,
      },
      {
        id: 'c-2',
        course_code: 'CS3100',
        course_name: 'Data Structures and Algorithms',
        description: 'Arrays, trees, graphs, dynamic programming, divide-and-conquer, greedy strategies, and asymptotic runtime analysis.',
        credits: 4,
        department: 'Computer Science & Engineering',
        created_at: now,
      },
      {
        id: 'c-3',
        course_code: 'CS4200',
        course_name: 'Database Systems',
        description: 'Relational algebra, SQL, normalization, B-Trees, transaction concurrency control, ACID properties, and query optimization.',
        credits: 4,
        department: 'Computer Science & Engineering',
        created_at: now,
      },
      {
        id: 'c-4',
        course_code: 'EE2001',
        course_name: 'Circuit Theory and Networks',
        description: 'Kirchhoff laws, nodal and mesh analysis, Laplace transforms, two-port networks, and transient circuit response.',
        credits: 3,
        department: 'Electrical Engineering',
        created_at: now,
      },
      {
        id: 'c-5',
        course_code: 'ME3010',
        course_name: 'Fluid Mechanics',
        description: 'Fluid statics, Navier-Stokes equations, boundary layer theory, Bernoulli principle, and viscous internal flow.',
        credits: 4,
        department: 'Mechanical Engineering',
        created_at: now,
      },
      {
        id: 'c-6',
        course_code: 'MA1101',
        course_name: 'Calculus and Linear Algebra',
        description: 'Vectors, eigenvalues, power series, multivariable differentiation, line integrals, and Stokes theorem.',
        credits: 4,
        department: 'Mathematics',
        created_at: now,
      },
      {
        id: 'c-7',
        course_code: 'AI5001',
        course_name: 'Deep Learning Foundations',
        description: 'Backpropagation, Convolutional Neural Networks, Transformers, attention mechanisms, and optimization techniques.',
        credits: 4,
        department: 'Computer Science & Engineering',
        created_at: now,
      },
      {
        id: 'c-8',
        course_code: 'CH2010',
        course_name: 'Chemical Kinetics',
        description: 'Reaction rates, catalysis, reactor dynamics, activation energy, and thermodynamic equilibrium.',
        credits: 3,
        department: 'Chemical Engineering',
        created_at: now,
      },
    ];

    // 5. Semesters
    const semesters: Semester[] = [
      {
        id: 'sem-2026-jul',
        name: 'July - November 2026 (Monsoon)',
        academic_year: '2026-2027',
        start_date: '2026-07-25',
        end_date: '2026-11-30',
        registration_open: true,
        registration_close: '2026-09-15T23:59:59Z',
      },
      {
        id: 'sem-2026-jan',
        name: 'January - May 2026 (Winter)',
        academic_year: '2025-2026',
        start_date: '2026-01-10',
        end_date: '2026-05-15',
        registration_open: false,
        registration_close: '2026-02-01T23:59:59Z',
      },
    ];

    // 6. Course Offerings (Connecting Courses, Faculty, Semesters)
    const course_offerings: CourseOffering[] = [
      {
        id: 'co-cs3100-2026jul',
        course_id: 'c-2', // CS3100
        faculty_id: 'fac-1', // Prof. Ramesh Chandra
        semester_id: 'sem-2026-jul',
        capacity: 60,
        created_at: now,
      },
      {
        id: 'co-cs4200-2026jul',
        course_id: 'c-3', // CS4200
        faculty_id: 'fac-2', // Prof. Sunita Krishnan
        semester_id: 'sem-2026-jul',
        capacity: 50,
        created_at: now,
      },
      {
        id: 'co-ai5001-2026jul',
        course_id: 'c-7', // AI5001
        faculty_id: 'fac-1', // Prof. Ramesh Chandra
        semester_id: 'sem-2026-jul',
        capacity: 45,
        created_at: now,
      },
      {
        id: 'co-ee2001-2026jul',
        course_id: 'c-4', // EE2001
        faculty_id: 'fac-3', // Prof. Arvind Kumar
        semester_id: 'sem-2026-jul',
        capacity: 55,
        created_at: now,
      },
      {
        id: 'co-ma1101-2026jul',
        course_id: 'c-6', // MA1101
        faculty_id: 'fac-2', // Prof. Sunita Krishnan
        semester_id: 'sem-2026-jul',
        capacity: 80,
        created_at: now,
      },
      // Previous completed semester offering
      {
        id: 'co-cs1010-2026jan',
        course_id: 'c-1', // CS1010
        faculty_id: 'fac-1', // Prof. Ramesh Chandra
        semester_id: 'sem-2026-jan',
        capacity: 100,
        created_at: now,
      },
    ];

    // 7. Registrations
    const registrations: Registration[] = [
      {
        id: 'reg-1',
        student_id: 'std-1',
        course_offering_id: 'co-cs3100-2026jul',
        registered_at: '2026-08-01T10:00:00Z',
        status: 'registered',
      },
      {
        id: 'reg-2',
        student_id: 'std-1',
        course_offering_id: 'co-cs4200-2026jul',
        registered_at: '2026-08-01T10:05:00Z',
        status: 'registered',
      },
      {
        id: 'reg-3',
        student_id: 'std-2',
        course_offering_id: 'co-cs3100-2026jul',
        registered_at: '2026-08-02T11:20:00Z',
        status: 'registered',
      },
      {
        id: 'reg-4',
        student_id: 'std-2',
        course_offering_id: 'co-ai5001-2026jul',
        registered_at: '2026-08-02T11:22:00Z',
        status: 'registered',
      },
      {
        id: 'reg-5',
        student_id: 'std-1',
        course_offering_id: 'co-cs1010-2026jan',
        registered_at: '2026-01-12T09:00:00Z',
        status: 'registered',
      },
      {
        id: 'reg-6',
        student_id: 'std-2',
        course_offering_id: 'co-cs1010-2026jan',
        registered_at: '2026-01-12T09:15:00Z',
        status: 'registered',
      },
    ];

    // 8. Grades
    const grades: Grade[] = [
      {
        id: 'grd-1',
        registration_id: 'reg-5', // std-1 in CS1010
        grade: 'A',
        grade_point: 10,
        uploaded_by: 'fac-1',
        published_at: '2026-05-20T14:30:00Z',
        created_at: '2026-05-18T10:00:00Z',
        updated_at: '2026-05-20T14:30:00Z',
      },
      {
        id: 'grd-2',
        registration_id: 'reg-6', // std-2 in CS1010
        grade: 'A-',
        grade_point: 9,
        uploaded_by: 'fac-1',
        published_at: '2026-05-20T14:30:00Z',
        created_at: '2026-05-18T10:00:00Z',
        updated_at: '2026-05-20T14:30:00Z',
      },
      {
        id: 'grd-3',
        registration_id: 'reg-1', // std-1 in CS3100
        grade: 'A+',
        grade_point: 10,
        uploaded_by: 'fac-1',
        published_at: null, // Draft / pending publication
        created_at: now,
        updated_at: now,
      },
    ];

    // 9. Notifications
    const notifications: Notification[] = [
      {
        id: 'notif-1',
        user_id: 'u-std-1',
        title: 'Grade Published',
        message: 'Your grade for CS1010 - Introduction to Programming has been published: Grade A.',
        type: 'grade_published',
        read: true,
        created_at: '2026-05-20T14:30:00Z',
      },
      {
        id: 'notif-2',
        user_id: 'u-std-1',
        title: 'Course Registration Successful',
        message: 'You have successfully enrolled in CS3100 - Data Structures and Algorithms for Monsoon 2026.',
        type: 'registration_success',
        read: false,
        created_at: '2026-08-01T10:00:00Z',
      },
      {
        id: 'notif-3',
        user_id: 'u-fac-1',
        title: 'Semester Registration Open',
        message: 'July - November 2026 semester registration is now active for students.',
        type: 'info',
        read: false,
        created_at: '2026-07-25T08:00:00Z',
      },
    ];

    return {
      users,
      students,
      faculty,
      courses,
      semesters,
      course_offerings,
      registrations,
      grades,
      notifications,
    };
  }

  // --- QUERY & MUTATION HELPERS ---

  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public getStudentByUserId(userId: string): Student | undefined {
    return this.data.students.find((s) => s.user_id === userId);
  }

  public getStudentById(studentId: string): Student | undefined {
    return this.data.students.find((s) => s.id === studentId);
  }

  public createStudent(student: Student): Student {
    this.data.students.push(student);
    this.persist();
    return student;
  }

  public getFacultyByUserId(userId: string): Faculty | undefined {
    return this.data.faculty.find((f) => f.user_id === userId);
  }

  public getFacultyById(facultyId: string): Faculty | undefined {
    return this.data.faculty.find((f) => f.id === facultyId);
  }

  public createFaculty(faculty: Faculty): Faculty {
    this.data.faculty.push(faculty);
    this.persist();
    return faculty;
  }

  public getCourses(): Course[] {
    return this.data.courses;
  }

  public getSemesters(): Semester[] {
    return this.data.semesters;
  }

  public getActiveSemester(): Semester | undefined {
    return this.data.semesters.find((s) => s.registration_open);
  }

  public getCourseOfferings(semesterId?: string): CourseOffering[] {
    let offerings = this.data.course_offerings;
    if (semesterId) {
      offerings = offerings.filter((co) => co.semester_id === semesterId);
    }
    return offerings.map((co) => this.enrichCourseOffering(co));
  }

  public getCourseOfferingById(id: string): CourseOffering | undefined {
    const co = this.data.course_offerings.find((item) => item.id === id);
    if (!co) return undefined;
    return this.enrichCourseOffering(co);
  }

  private enrichCourseOffering(co: CourseOffering): CourseOffering {
    const course = this.data.courses.find((c) => c.id === co.course_id);
    const fac = this.data.faculty.find((f) => f.id === co.faculty_id);
    const user = fac ? this.data.users.find((u) => u.id === fac.user_id) : undefined;
    const facultyWithUser = fac ? { ...fac, user } : undefined;
    const semester = this.data.semesters.find((s) => s.id === co.semester_id);
    const enrolled_count = this.data.registrations.filter(
      (r) => r.course_offering_id === co.id && r.status === 'registered'
    ).length;

    return {
      ...co,
      course,
      faculty: facultyWithUser,
      semester,
      enrolled_count,
    };
  }

  public getRegistrationsByStudent(studentId: string): Registration[] {
    const studentRegs = this.data.registrations.filter((r) => r.student_id === studentId);
    return studentRegs.map((r) => {
      const co = this.getCourseOfferingById(r.course_offering_id);
      const grade = this.data.grades.find((g) => g.registration_id === r.id);
      return {
        ...r,
        course_offering: co,
        grade,
      };
    });
  }

  public getRegistration(studentId: string, courseOfferingId: string): Registration | undefined {
    return this.data.registrations.find(
      (r) => r.student_id === studentId && r.course_offering_id === courseOfferingId && r.status === 'registered'
    );
  }

  public createRegistration(studentId: string, courseOfferingId: string): Registration {
    const newReg: Registration = {
      id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      student_id: studentId,
      course_offering_id: courseOfferingId,
      registered_at: new Date().toISOString(),
      status: 'registered',
    };
    this.data.registrations.push(newReg);
    this.persist();
    return this.getRegistrationsByStudent(studentId).find((r) => r.id === newReg.id) || newReg;
  }

  public dropRegistration(registrationId: string, studentId: string): boolean {
    const reg = this.data.registrations.find((r) => r.id === registrationId && r.student_id === studentId);
    if (!reg) return false;
    reg.status = 'dropped';
    this.persist();
    return true;
  }

  public getStudentsInOffering(courseOfferingId: string): Array<{
    registration_id: string;
    student: Student;
    registered_at: string;
    grade?: Grade;
  }> {
    const activeRegs = this.data.registrations.filter(
      (r) => r.course_offering_id === courseOfferingId && r.status === 'registered'
    );

    return activeRegs.map((r) => {
      const student = this.data.students.find((s) => s.id === r.student_id)!;
      const user = this.data.users.find((u) => u.id === student.user_id);
      const grade = this.data.grades.find((g) => g.registration_id === r.id);

      return {
        registration_id: r.id,
        student: { ...student, user },
        registered_at: r.registered_at,
        grade,
      };
    });
  }

  public upsertGrade(
    registrationId: string,
    gradeLetter: GradeLetter,
    uploadedByFacultyId: string
  ): Grade {
    const now = new Date().toISOString();
    const gradePoint = calculateGradePoint(gradeLetter);
    let existingGrade = this.data.grades.find((g) => g.registration_id === registrationId);

    if (existingGrade) {
      existingGrade.grade = gradeLetter;
      existingGrade.grade_point = gradePoint;
      existingGrade.uploaded_by = uploadedByFacultyId;
      existingGrade.updated_at = now;
      this.persist();
      return existingGrade;
    } else {
      const newGrade: Grade = {
        id: `grd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        registration_id: registrationId,
        grade: gradeLetter,
        grade_point: gradePoint,
        uploaded_by: uploadedByFacultyId,
        published_at: null,
        created_at: now,
        updated_at: now,
      };
      this.data.grades.push(newGrade);
      this.persist();
      return newGrade;
    }
  }

  public publishGradesForOffering(courseOfferingId: string, facultyId: string): Grade[] {
    const now = new Date().toISOString();
    const activeRegs = this.data.registrations.filter(
      (r) => r.course_offering_id === courseOfferingId && r.status === 'registered'
    );

    const publishedGrades: Grade[] = [];

    for (const reg of activeRegs) {
      const grade = this.data.grades.find((g) => g.registration_id === reg.id);
      if (grade && !grade.published_at) {
        grade.published_at = now;
        grade.updated_at = now;
        publishedGrades.push(grade);
      }
    }

    this.persist();
    return publishedGrades;
  }

  public createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'grade_published' | 'registration_success' | 'course_update' | 'info'
  ): Notification {
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString(),
    };
    this.data.notifications.push(newNotif);
    this.persist();
    return newNotif;
  }

  public getNotificationsByUser(userId: string): Notification[] {
    return this.data.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public markNotificationRead(notifId: string, userId: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === notifId && n.user_id === userId);
    if (!notif) return false;
    notif.read = true;
    this.persist();
    return true;
  }
}

export const db = new DatabaseStore();
