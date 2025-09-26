import { Router } from 'express';
import { body } from 'express-validator';
import { VideoController } from '../controllers/videoController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';

export const videoRoutes = Router();

// 동영상 진행 상황 업데이트
videoRoutes.post('/', [
  authenticateToken,
  authorizeRoles('student'),
  body('videoBlockId').isInt().withMessage('Valid video block ID is required'),
  body('watchedDuration').isInt({ min: 0 }).withMessage('Watched duration must be a non-negative integer'),
  body('totalDuration').isInt({ min: 1 }).withMessage('Total duration must be a positive integer')
], VideoController.updateProgress);

// 현재 로그인한 학생의 모든 동영상 진행 상황 조회
videoRoutes.get('/', authenticateToken, VideoController.getStudentProgress);

// 현재 로그인한 사용자의 특정 블록 진행 상황 조회
videoRoutes.get('/block/:blockId', authenticateToken, VideoController.getCurrentBlockProgress);

// 교사/관리자가 특정 학생의 진행 상황 조회
videoRoutes.get('/student/:studentId', authenticateToken, authorizeRoles('teacher', 'admin'), VideoController.getStudentProgress);

// 특정 강의 영상 진행 요약 조회 (교사용)
videoRoutes.get('/course/:courseId/summary', authenticateToken, authorizeRoles('teacher', 'admin'), VideoController.getCourseVideoSummary);

// 특정 강의의 모든 동영상 진행 상황 조회 (교사용)
videoRoutes.get('/course/:courseId', authenticateToken, authorizeRoles('teacher', 'admin'), VideoController.getCourseVideoProgress);

// 교사의 모든 강의 동영상 진행 상황 일괄 조회
videoRoutes.get('/teacher/courses', authenticateToken, authorizeRoles('teacher', 'admin'), VideoController.getTeacherCourseProgress);

// 특정 학생의 특정 강의 동영상 진행 상황 조회
videoRoutes.get('/student/:studentId/course/:courseId', authenticateToken, VideoController.getStudentCourseProgress);
