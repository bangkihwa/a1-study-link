import express from 'express';
import { authenticateToken, requireAdmin, requireRole } from '../middleware/auth';
import {
  getPendingUsers,
  approveUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  createClass,
  assignStudentsToClass,
  getAllClasses,
  updateClass,
  createUserValidation,
  createClassValidation,
  deleteClass,
  removeStudentFromClass
} from '../controllers/adminController';

const router = express.Router();

// 모든 라우트에 관리자 권한 필요
router.use(authenticateToken, requireAdmin);

// 사용자 관리
router.get('/users/pending', getPendingUsers);
router.post('/users/:userId/approve', approveUser);
router.get('/users', getAllUsers);
router.post('/users', createUserValidation, createUser);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);

// 반(클래스) 관리
router.get('/classes', getAllClasses);
router.post('/classes', createClassValidation, createClass);
router.put('/classes/:class_id', authenticateToken, requireRole(['admin']), updateClass);
router.delete('/classes/:class_id', authenticateToken, requireRole(['admin']), deleteClass);

router.post('/classes/:class_id/students', authenticateToken, requireRole(['admin']), assignStudentsToClass);
router.delete('/classes/:class_id/students', authenticateToken, requireRole(['admin']), removeStudentFromClass);

export default router;