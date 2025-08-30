import express from 'express';
import {
  register,
  login,
  getUserStats,
  getUsers,
  createUser,
  toggleUserApproval,
  changeUserRole,
  registerValidation,
  loginValidation
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/stats', authenticateToken, getUserStats);
router.get('/users', authenticateToken, getUsers);

// 관리자 전용 API
router.post('/users', authenticateToken, createUser);
router.put('/users/:userId/approval', authenticateToken, toggleUserApproval);
router.put('/users/:userId/role', authenticateToken, changeUserRole);

export default router;