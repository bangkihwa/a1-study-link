import { Router } from 'express';
import { body } from 'express-validator';
import {
  login,
  registerStudent,
  registerParent,
  registerTeacher,
  validateStudentNumber,
  refreshToken,
  logout
} from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';

export const authRoutes = Router();

// Login
authRoutes.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

// Student registration
authRoutes.post('/register/student', [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone('ko-KR').withMessage('Invalid phone number')
], registerStudent);

// Parent registration
authRoutes.post('/register/parent', [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone('ko-KR').withMessage('Invalid phone number'),
  body('studentNumber').trim().isLength({ min: 8, max: 8 }).withMessage('Student number must be 8 characters'),
  body('relationship').optional().isIn(['father', 'mother', 'guardian']).withMessage('Invalid relationship')
], registerParent);

// Teacher registration
authRoutes.post('/register/teacher', [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone('ko-KR').withMessage('Invalid phone number')
], registerTeacher);

// Validate student number
authRoutes.get('/student/:studentNumber', validateStudentNumber);

// Refresh token
authRoutes.post('/refresh', authenticateToken as any, refreshToken);

// Logout
authRoutes.post('/logout', authenticateToken as any, logout);
