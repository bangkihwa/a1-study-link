import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middlewares/auth';

export const userRoutes = Router();

// 현재 사용자 정보 조회
userRoutes.get('/me', authenticateToken, UserController.getCurrentUser);

// 사용자 정보 조회 (ID로)
userRoutes.get('/:id', authenticateToken, UserController.getUserById);

// 학생 등록
userRoutes.post('/register/student', [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone('ko-KR').withMessage('Invalid phone number')
], UserController.registerStudent);

// 학부모 등록
userRoutes.post('/register/parent', [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone('ko-KR').withMessage('Invalid phone number'),
  body('studentNumber').trim().isLength({ min: 8, max: 8 }).withMessage('Student number must be 8 characters'),
  body('relationship').optional().isIn(['father', 'mother', 'guardian']).withMessage('Invalid relationship')
], UserController.registerParent);

// 교사 등록
userRoutes.post('/register/teacher', [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone('ko-KR').withMessage('Invalid phone number')
], UserController.registerTeacher);

// 학생 번호 유효성 검사
userRoutes.get('/student/:studentNumber', UserController.validateStudentNumber);
