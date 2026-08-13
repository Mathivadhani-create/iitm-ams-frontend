import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import { generateToken, AuthenticatedRequest } from '../middleware/auth';
import { User, Student, Faculty } from '../types';

export const login = async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. No user found with this email.',
    });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Password incorrect.',
    });
  }

  let studentId: string | undefined;
  let facultyId: string | undefined;

  if (user.role === 'student') {
    const student = db.getStudentByUserId(user.id);
    studentId = student?.id;
  } else if (user.role === 'faculty') {
    const faculty = db.getFacultyByUserId(user.id);
    facultyId = faculty?.id;
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    studentId,
    facultyId,
  });

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId,
        facultyId,
      },
    },
  });
};

export const register = async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, role, department, program, year, designation } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, password, and role (student/faculty) are required.',
    });
  }

  if (role !== 'student' && role !== 'faculty') {
    return res.status(400).json({
      success: false,
      message: 'Role must be either student or faculty.',
    });
  }

  const existingUser = db.getUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'A user with this email address already exists.',
    });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();

  const newUser: User = {
    id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    email,
    password_hash,
    role,
    created_at: now,
    updated_at: now,
  };

  db.createUser(newUser);

  let studentId: string | undefined;
  let facultyId: string | undefined;

  if (role === 'student') {
    const roll_number = `CS${new Date().getFullYear().toString().substring(2)}B${Math.floor(100 + Math.random() * 900)}`;
    const newStudent: Student = {
      id: `std-${Date.now()}`,
      user_id: newUser.id,
      roll_number,
      department: department || 'Computer Science & Engineering',
      program: program || 'B.Tech',
      year: Number(year) || 1,
      created_at: now,
    };
    db.createStudent(newStudent);
    studentId = newStudent.id;
  } else if (role === 'faculty') {
    const employee_id = `FAC${Math.floor(100 + Math.random() * 900)}`;
    const newFaculty: Faculty = {
      id: `fac-${Date.now()}`,
      user_id: newUser.id,
      employee_id,
      department: department || 'Computer Science & Engineering',
      designation: designation || 'Assistant Professor',
      created_at: now,
    };
    db.createFaculty(newFaculty);
    facultyId = newFaculty.id;
  }

  const token = generateToken({
    userId: newUser.id,
    role: newUser.role,
    email: newUser.email,
    name: newUser.name,
    studentId,
    facultyId,
  });

  return res.status(201).json({
    success: true,
    message: 'User registered successfully.',
    data: {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        studentId,
        facultyId,
      },
    },
  });
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  const user = db.getUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User record not found.' });
  }

  let studentDetails: Student | undefined;
  let facultyDetails: Faculty | undefined;

  if (user.role === 'student') {
    studentDetails = db.getStudentByUserId(user.id);
  } else if (user.role === 'faculty') {
    facultyDetails = db.getFacultyByUserId(user.id);
  }

  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
      student: studentDetails,
      faculty: facultyDetails,
    },
  });
};
