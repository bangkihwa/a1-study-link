import express from 'express';
import { authenticateToken, requireAdmin, requireTeacher } from '../middleware/auth';
import {
  generateStudentReport,
  generateClassReport,
  getAdminStatistics
} from '../controllers/reportsController';

const router = express.Router();

// 학생 리포트 (본인, 학부모, 교사, 관리자 접근 가능)
router.get('/student/:studentId', authenticateToken, generateStudentReport);

// 반별 리포트 (교사, 관리자만)
router.get('/class/:classId', authenticateToken, requireTeacher, generateClassReport);

// 전체 통계 (관리자만)
router.get('/admin/statistics', authenticateToken, requireAdmin, getAdminStatistics);

export default router;