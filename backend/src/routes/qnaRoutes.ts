import { Router } from 'express';
import { body } from 'express-validator';
import QnaController from '../controllers/qnaController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';

export const qnaRoutes = Router();

qnaRoutes.post('/', [
  authenticateToken,
  authorizeRoles('student'),
  body('courseId').isInt({ min: 1 }).withMessage('Valid courseId is required'),
  body('question').isString().isLength({ min: 3 }).withMessage('Question must be at least 3 characters'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean').toBoolean()
], QnaController.createQuestion);

qnaRoutes.get('/course/:courseId', authenticateToken, QnaController.getQuestionsByCourse);
qnaRoutes.get('/me', authenticateToken, authorizeRoles('student'), QnaController.getMyQuestions);
qnaRoutes.get('/teacher', authenticateToken, authorizeRoles('teacher', 'admin'), QnaController.getTeacherQuestions);

qnaRoutes.put('/:id/answer', [
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  body('answer').isString().isLength({ min: 1 }).withMessage('Answer is required')
], QnaController.answerQuestion);

qnaRoutes.delete('/:id', authenticateToken, authorizeRoles('admin'), QnaController.deleteQuestion);

export default qnaRoutes;
