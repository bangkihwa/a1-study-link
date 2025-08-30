import express from 'express';
import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  createSubjectValidation
} from '../controllers/subjectController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', getAllSubjects); // 모든 사용자가 조회 가능
router.post('/', authenticateToken, createSubjectValidation, createSubject); // 관리자만
router.put('/:subjectId', authenticateToken, createSubjectValidation, updateSubject); // 관리자만  
router.delete('/:subjectId', authenticateToken, deleteSubject); // 관리자만

export default router;