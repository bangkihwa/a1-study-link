import express from 'express';
import { authenticateToken, requireTeacher } from '../middleware/auth';
import {
  getMyClasses,
  getClassStudents,
  createLecture,
  getMyLectures,
  updateLecture,
  addLectureContent,
  getStudentQuestions,
  provideFeedback,
  createAssignment,
  getAssignmentSubmissions,
  gradeAssignment,
  createLectureValidation,
  createAssignmentValidation
} from '../controllers/teacherController';

const router = express.Router();

// 모든 라우트에 교사 권한 필요
router.use(authenticateToken, requireTeacher);

// 반 관리
router.get('/classes', getMyClasses);
router.get('/classes/:classId/students', getClassStudents);

// 강의 관리
router.get('/lectures', getMyLectures);
router.post('/lectures', createLectureValidation, createLecture);
router.put('/lectures/:lectureId', updateLecture);
router.post('/lectures/:lectureId/contents', addLectureContent);

// 질문 및 피드백
router.get('/questions', getStudentQuestions);
router.post('/questions/:questionId/feedback', provideFeedback);

// 과제 관리
router.post('/assignments', createAssignmentValidation, createAssignment);
router.get('/assignments/:assignmentId/submissions', getAssignmentSubmissions);
router.put('/submissions/:submissionId/grade', gradeAssignment);

export default router;