import { Response } from 'express';
import { db } from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth';

export const getStudentProfile = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const student = db.getStudentByUserId(userId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found.' });
  }

  const user = db.getUserById(userId);

  return res.status(200).json({
    success: true,
    data: {
      ...student,
      user,
    },
  });
};

export const getAvailableCourses = async (req: AuthenticatedRequest, res: Response) => {
  const activeSemester = db.getActiveSemester();
  const offerings = db.getCourseOfferings(activeSemester?.id);

  return res.status(200).json({
    success: true,
    data: {
      activeSemester,
      offerings,
    },
  });
};

export const getRegistrations = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const student = db.getStudentByUserId(userId!);

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student record not found.' });
  }

  const registrations = db.getRegistrationsByStudent(student.id);

  return res.status(200).json({
    success: true,
    data: registrations,
  });
};

export const registerCourse = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const student = db.getStudentByUserId(userId!);

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student record not found.' });
  }

  const { course_offering_id } = req.body;
  if (!course_offering_id) {
    return res.status(400).json({ success: false, message: 'course_offering_id is required.' });
  }

  const offering = db.getCourseOfferingById(course_offering_id);
  if (!offering) {
    return res.status(404).json({ success: false, message: 'Course offering not found.' });
  }

  // BUSINESS RULE 6: Registration window open check
  if (!offering.semester?.registration_open) {
    return res.status(400).json({
      success: false,
      message: 'Registration is currently closed for this semester.',
    });
  }

  if (offering.semester?.registration_close) {
    const closeDate = new Date(offering.semester.registration_close);
    if (new Date() > closeDate) {
      return res.status(400).json({
        success: false,
        message: 'Registration period for this semester has passed.',
      });
    }
  }

  // BUSINESS RULE 5: Check duplicate registration
  const existingReg = db.getRegistration(student.id, course_offering_id);
  if (existingReg) {
    return res.status(409).json({
      success: false,
      message: 'Student is already registered for this course offering.',
    });
  }

  // BUSINESS RULE 7: Course capacity check
  const enrolledCount = offering.enrolled_count || 0;
  if (enrolledCount >= offering.capacity) {
    return res.status(409).json({
      success: false,
      message: `Course offering is full. Capacity limit of ${offering.capacity} students reached.`,
    });
  }

  // Create Registration
  const registration = db.createRegistration(student.id, course_offering_id);

  // Create Notification
  db.createNotification(
    userId!,
    'Course Registration Successful',
    `You have successfully registered for ${offering.course?.course_code} - ${offering.course?.course_name}.`,
    'registration_success'
  );

  return res.status(201).json({
    success: true,
    message: 'Registered for course successfully.',
    data: registration,
  });
};

export const dropCourse = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const student = db.getStudentByUserId(userId!);

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student record not found.' });
  }

  const { id } = req.params;

  const success = db.dropRegistration(id, student.id);
  if (!success) {
    return res.status(404).json({
      success: false,
      message: 'Registration not found or already dropped.',
    });
  }

  db.createNotification(
    userId!,
    'Course Dropped',
    'Course registration has been successfully cancelled.',
    'info'
  );

  return res.status(200).json({
    success: true,
    message: 'Course registration dropped successfully.',
  });
};

export const getGrades = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const student = db.getStudentByUserId(userId!);

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student record not found.' });
  }

  const allRegs = db.getRegistrationsByStudent(student.id);

  // Filter registrations that have published grades
  const publishedGrades = allRegs
    .filter((r) => r.grade && r.grade.published_at)
    .map((r) => ({
      registration_id: r.id,
      course_code: r.course_offering?.course?.course_code,
      course_name: r.course_offering?.course?.course_name,
      credits: r.course_offering?.course?.credits || 0,
      semester_name: r.course_offering?.semester?.name,
      academic_year: r.course_offering?.semester?.academic_year,
      grade: r.grade!.grade,
      grade_point: r.grade!.grade_point,
      published_at: r.grade!.published_at,
    }));

  // Calculate SGPA/CGPA
  let totalGradePoints = 0;
  let totalCredits = 0;

  publishedGrades.forEach((g) => {
    totalGradePoints += g.grade_point * g.credits;
    totalCredits += g.credits;
  });

  const cgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

  return res.status(200).json({
    success: true,
    data: {
      cgpa: parseFloat(cgpa),
      total_credits_earned: totalCredits,
      grades: publishedGrades,
    },
  });
};

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const notifications = db.getNotificationsByUser(userId!);

  return res.status(200).json({
    success: true,
    data: notifications,
  });
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  const success = db.markNotificationRead(id, userId!);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Notification not found.' });
  }

  return res.status(200).json({
    success: true,
    message: 'Notification marked as read.',
  });
};
