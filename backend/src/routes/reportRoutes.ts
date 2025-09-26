import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';

export const reportRoutes = Router();

// 학생의 학습 리포트 조회
reportRoutes.get('/student', authenticateToken, ReportController.getStudentReport);
reportRoutes.get('/student/:studentId', authenticateToken, authorizeRoles('teacher', 'admin'), ReportController.getStudentReport);

// 반별 학습 리포트 조회 (교사용)
reportRoutes.get('/class/:classId', authenticateToken, ReportController.getClassReport);

// 전체 학습 활동 로그 조회 (관리자용)
reportRoutes.get('/admin/activity', authenticateToken, ReportController.getAdminActivityReport);
