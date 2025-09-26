import { Router } from 'express';
import { body } from 'express-validator';
import { CourseController } from '../controllers/courseController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';

export const courseRoutes = Router();

// 모든 강의 목록 조회 (공개 강의)
courseRoutes.get('/', CourseController.getAllCourses);

// 현재 사용자의 강의 목록 조회
courseRoutes.get('/user/courses', authenticateToken, CourseController.getUserCourses);

// 강의 배정 가능 학생 조회
courseRoutes.get('/assignable-students', [
  authenticateToken,
  authorizeRoles('teacher', 'admin')
], CourseController.getAssignableStudents);

// 특정 반의 학생 목록 조회 (강의 배정용)
courseRoutes.get('/classes/:classId/students', [
  authenticateToken,
  authorizeRoles('teacher', 'admin')
], CourseController.getClassStudents);

// 강의 상세 (관리용)
courseRoutes.get('/:id/manage', authenticateToken, authorizeRoles('teacher', 'admin'), CourseController.getManageCourse);

// 특정 강의 상세 조회
courseRoutes.get('/:id', CourseController.getCourseById);

// 강의 생성
courseRoutes.post('/', [
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('classId').isInt({ min: 1 }).withMessage('Valid class ID is required'),
  body('teacherId').optional().isInt({ min: 1 }).withMessage('Teacher ID must be a positive integer'),
  body('description').optional().trim(),
  body('initialVideoUrl').trim().notEmpty().withMessage('Initial video URL is required'),
  body('initialVideoTitle').optional().isString().trim(),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be boolean').toBoolean()
], CourseController.createCourse);

// 강의 수정
courseRoutes.put('/:id', [
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  body('title').optional().trim().notEmpty().withMessage('Title is required'),
  body('description').optional({ nullable: true }).isString().withMessage('Description must be a string'),
  body('classId').optional().isInt({ min: 1 }).withMessage('Valid class ID is required'),
  body('teacherId').optional().isInt({ min: 1 }).withMessage('Teacher ID must be a positive integer'),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be boolean')
], CourseController.updateCourse);

// 강의 삭제
courseRoutes.delete('/:id', [
  authenticateToken,
  authorizeRoles('teacher', 'admin')
], CourseController.deleteCourse);

// 강의 공개 상태 변경 (관리자)
courseRoutes.patch('/:id/publish', [
  authenticateToken,
  authorizeRoles('admin'),
  body('isPublished').isBoolean().withMessage('isPublished must be boolean')
], CourseController.publishCourse);

// 강의 콘텐츠 블록 생성
courseRoutes.post('/:id/blocks', [
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  body('type').isIn(['video', 'test', 'mindmap', 'text']).withMessage('Invalid content type'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').isObject().withMessage('Content must be an object'),
  body('isRequired').optional().isBoolean().withMessage('isRequired must be boolean').toBoolean()
], CourseController.createContentBlock);

// 강의 콘텐츠 블록 수정
courseRoutes.put('/:id/blocks/:blockId', [
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  body('title').optional().trim().notEmpty().withMessage('Title is required'),
  body('type').optional().isIn(['video', 'test', 'mindmap', 'text']).withMessage('Invalid content type'),
  body('content').optional().isObject().withMessage('Content must be an object'),
  body('isRequired').optional().isBoolean().withMessage('isRequired must be boolean').toBoolean()
], CourseController.updateContentBlock);

// 강의 콘텐츠 블록 삭제
courseRoutes.delete('/:id/blocks/:blockId', [
  authenticateToken,
  authorizeRoles('teacher', 'admin')
], CourseController.deleteContentBlock);

// 강의 콘텐츠 블록 순서 재정렬
courseRoutes.put('/:id/blocks/reorder', [
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  body('orderedIds').isArray({ min: 1 }).withMessage('orderedIds must be an array of block IDs'),
  body('orderedIds.*').isInt({ min: 1 }).withMessage('orderedIds must contain block IDs')
], CourseController.reorderContentBlocks);
