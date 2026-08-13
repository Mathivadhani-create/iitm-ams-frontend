import { Router } from 'express';
import { login, register, me } from '../controllers/authController';
import {
  getStudentProfile,
  getAvailableCourses,
  getRegistrations,
  registerCourse,
  dropCourse,
  getGrades,
  getNotifications as getStudentNotifs,
  markNotificationRead as markStudentNotifRead,
} from '../controllers/studentController';
import {
  getFacultyProfile,
  getAssignedCourses,
  getEnrolledStudents,
  uploadGrade,
  updateGrade,
  publishGrades,
  getFacultyNotifications,
} from '../controllers/facultyController';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { db } from '../db/database';

const router = Router();

// --- PUBLIC AUTH ROUTES ---
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/auth/me', authenticateJWT, me);

// --- SEED RESET UTILITY ---
router.post('/admin/reset-seed', (req, res) => {
  const data = db.resetToSeedData();
  return res.status(200).json({
    success: true,
    message: 'Database reset to initial seed data successfully.',
  });
});

// --- STUDENT PROTECTED ROUTES ---
router.get('/student/profile', authenticateJWT, requireRole('student'), getStudentProfile);
router.get('/student/courses', authenticateJWT, requireRole('student'), getAvailableCourses);
router.get('/student/registrations', authenticateJWT, requireRole('student'), getRegistrations);
router.post('/student/registrations', authenticateJWT, requireRole('student'), registerCourse);
router.delete('/student/registrations/:id', authenticateJWT, requireRole('student'), dropCourse);
router.get('/student/grades', authenticateJWT, requireRole('student'), getGrades);
router.get('/student/notifications', authenticateJWT, requireRole('student'), getStudentNotifs);
router.patch('/student/notifications/:id/read', authenticateJWT, requireRole('student'), markStudentNotifRead);

// --- FACULTY PROTECTED ROUTES ---
router.get('/faculty/profile', authenticateJWT, requireRole('faculty'), getFacultyProfile);
router.get('/faculty/courses', authenticateJWT, requireRole('faculty'), getAssignedCourses);
router.get('/faculty/courses/:id/students', authenticateJWT, requireRole('faculty'), getEnrolledStudents);
router.post('/faculty/courses/:id/grades', authenticateJWT, requireRole('faculty'), uploadGrade);
router.put('/faculty/grades/:id', authenticateJWT, requireRole('faculty'), updateGrade);
router.post('/faculty/courses/:id/publish-grades', authenticateJWT, requireRole('faculty'), publishGrades);
router.get('/faculty/notifications', authenticateJWT, requireRole('faculty'), getFacultyNotifications);

export default router;
