import express from 'express';
import { authenticateToken, requireStudent } from '../middleware/auth';
import {
  getMyClasses,
  getClassLectures,
  getLectureDetail,
  completeLecture,
  completeContent,
  askQuestion,
  getMyQuestions,
  getMyAssignments,
  submitAssignment,
  getMyDashboard,
  askQuestionValidation
} from '../controllers/studentController';

const router = express.Router();

// 모든 라우트에 학생 권한 필요
router.use(authenticateToken, requireStudent);

// 대시보드
router.get('/dashboard', getMyDashboard);

// 반 및 강의
router.get('/classes', getMyClasses);
router.get('/classes/:classId/lectures', getClassLectures);
router.get('/lectures/:lectureId', getLectureDetail);
router.post('/lectures/:lectureId/complete', completeLecture);
router.post('/contents/:contentId/complete', completeContent);

// 질문
router.post('/questions', askQuestionValidation, askQuestion);
router.get('/questions', getMyQuestions);

// 과제
router.get('/assignments', getMyAssignments);
router.post('/assignments/:assignmentId/submit', submitAssignment);

export default router;