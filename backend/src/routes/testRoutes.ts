import { Router } from 'express';
import { body } from 'express-validator';
import { TestController } from '../controllers/testController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';

export const testRoutes = Router();

// 테스트 생성
testRoutes.post('/', [
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('timeLimit').optional().isInt({ min: 1 }).withMessage('Time limit must be a positive integer'),
  body('totalScore').optional().isInt({ min: 1 }).withMessage('Total score must be a positive integer'),
  body('publishAt').optional({ nullable: true }).isISO8601().withMessage('Publish date must be a valid date'),
  body('dueDate').isISO8601({ strict: true, strictSeparator: true }).withMessage('Due date must be a valid date'),
  body('classId').isInt({ min: 1 }).withMessage('Class ID is required'),
  body('courseId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Course ID must be a positive integer')
], TestController.createTest);

// 테스트 수정
testRoutes.put('/:id', [
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  body('title').optional().trim().notEmpty(),
  body('description').optional({ nullable: true }).isString(),
  body('timeLimit').optional({ nullable: true }).isInt({ min: 1 }),
  body('totalScore').optional({ nullable: true }).isInt({ min: 1 }),
  body('isPublished').optional().isBoolean(),
  body('publishAt').optional({ nullable: true }).isISO8601().withMessage('Publish date must be a valid date'),
  body('dueDate').optional({ nullable: true }).custom((value) => {
    if (value === null || value === '') return true;
    if (typeof value !== 'string') {
      throw new Error('Due date must be a string');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      throw new Error('Due date must be in YYYY-MM-DD format');
    }
    return true;
  }),
  body('classId').optional({ nullable: true }).custom((value) => {
    if (value === null || value === '') return true;
    if (Number.isNaN(Number(value))) {
      throw new Error('Class ID must be numeric');
    }
    return true;
  }),
  body('courseId').optional({ nullable: true }).custom((value) => {
    if (value === null || value === '') return true;
    if (Number.isNaN(Number(value))) {
      throw new Error('Course ID must be numeric');
    }
    return true;
  })
], TestController.updateTest);

// 테스트 삭제
testRoutes.delete('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), TestController.deleteTest);

// 현재 사용자의 테스트 목록 조회
testRoutes.get('/user/tests', authenticateToken, TestController.getUserTests);

// 테스트 문제 정렬
testRoutes.put('/:id/questions/reorder', [
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  body('orderedIds').isArray({ min: 1 }).withMessage('orderedIds must be an array of question IDs')
], TestController.reorderQuestions);

// 테스트 문제 생성
testRoutes.post('/question', [
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  body('testId').isInt().withMessage('Valid test ID is required'),
  body('type').isIn(['ox', 'short_answer', 'multiple_choice', 'essay']).withMessage('Invalid question type'),
  body('questionText').trim().notEmpty().withMessage('Question text is required'),
  body('questionData').isObject().withMessage('Question data must be an object'),
  body('points').optional().isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('orderIndex').optional().isInt().withMessage('Order index must be an integer')
], TestController.createQuestion);

// 테스트 문제 수정
testRoutes.put('/question/:questionId', [
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  body('questionText').optional().trim().notEmpty(),
  body('questionData').optional().isObject(),
  body('points').optional().isInt({ min: 1 }),
  body('orderIndex').optional().isInt()
], TestController.updateQuestion);

// 테스트 문제 삭제
testRoutes.delete('/question/:questionId', authenticateToken, authorizeRoles('teacher', 'admin'), TestController.deleteQuestion);

// 테스트 제출
testRoutes.post('/submit', [
  authenticateToken,
  authorizeRoles('student'),
  body('testId').isInt().withMessage('Valid test ID is required'),
  body('answers').isObject().withMessage('Answers must be an object')
], TestController.submitTest);

// 테스트 제출 결과 조회
testRoutes.get('/submission/:testId', authenticateToken, TestController.getSubmissionResult);

// 테스트 제출 채점
testRoutes.put('/grade/:submissionId', [
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  body('score').isFloat({ min: 0 }).withMessage('Score must be a non-negative number'),
  body('gradedResults').optional(),
  body('publish').optional().isBoolean(),
  body('feedback').optional().isString()
], TestController.gradeSubmission);

// 제출 공개/비공개 처리
testRoutes.put('/submission/:submissionId/publish', authenticateToken, authorizeRoles('teacher', 'admin'), TestController.publishSubmission);
testRoutes.put('/submission/:submissionId/unpublish', authenticateToken, authorizeRoles('teacher', 'admin'), TestController.unpublishSubmission);

// 테스트 제출 목록 (교사용)
testRoutes.get('/:id/submissions', authenticateToken, authorizeRoles('teacher', 'admin'), TestController.getTestSubmissions);

// 테스트 응시 준비
testRoutes.get('/:id/attempt', authenticateToken, authorizeRoles('student'), TestController.getTestAttempt);

// 테스트 조회 (교사/관리자)
testRoutes.get('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), TestController.getTestById);
