import express from 'express';
import { authenticateToken, requireParent } from '../middleware/auth';
import {
  getMyChildren,
  getChildDashboard,
  getChildClasses,
  getChildLectureProgress,
  getChildQuestionsAndFeedback,
  getChildAssignments,
  getChildGrades,
  getChildLearningAnalytics
} from '../controllers/parentController';

const router = express.Router();

// 모든 라우트에 학부모 권한 필요
router.use(authenticateToken, requireParent);

// 자녀 목록
router.get('/children', getMyChildren);

// 자녀별 상세 정보
router.get('/children/:childId/dashboard', getChildDashboard);
router.get('/children/:childId/classes', getChildClasses);
router.get('/children/:childId/lectures', getChildLectureProgress);
router.get('/children/:childId/questions', getChildQuestionsAndFeedback);
router.get('/children/:childId/assignments', getChildAssignments);
router.get('/children/:childId/grades', getChildGrades);
router.get('/children/:childId/analytics', getChildLearningAnalytics);

export default router;