import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  createQuiz,
  getLectureQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getQuizResult,
  getAllUsers,
} from '../controllers/quizController';

const router = Router();

// Teacher routes
router.post('/', authenticateToken, requireRole(['teacher', 'admin']), createQuiz);
router.get('/lecture/:lectureId', authenticateToken, requireRole(['teacher', 'admin', 'student']), getLectureQuizzes);
router.get('/:quizId', authenticateToken, requireRole(['teacher', 'admin', 'student']), getQuiz);
router.put('/:quizId', authenticateToken, requireRole(['teacher', 'admin']), updateQuiz);
router.delete('/:quizId', authenticateToken, requireRole(['teacher', 'admin']), deleteQuiz);

// Student routes
router.post('/:quizId/submit', authenticateToken, requireRole(['student']), submitQuiz);
router.get('/attempt/:attemptId/result', authenticateToken, requireRole(['student', 'teacher', 'admin']), getQuizResult);

// A new route for getting all users, should be moved to a more appropriate place later
router.get('/users/all', authenticateToken, requireRole(['admin']), getAllUsers);

export default router;
