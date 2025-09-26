import { Response, NextFunction } from 'express';
import { TestService } from '../services/testService';
import { createError, asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../types';
import { UserModel } from '../models/userModel';
import ClassModel from '../models/classModel';
import { CourseModel } from '../models/courseModel';

export class TestController {
  private static ensureTestOwnership(user: { id: number; role: string }, test: { teacherId: number }) {
    if (user.role === 'admin') {
      return;
    }
    if (user.role === 'teacher' && test.teacherId === user.id) {
      return;
    }
    throw createError('Insufficient permissions for this test', 403);
  }

  private static normalizeDate(value: unknown, fieldName: string): string {
    if (typeof value !== 'string') {
      throw createError(`${fieldName} must be provided`, 400);
    }
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw createError(`${fieldName} must be in YYYY-MM-DD format`, 400);
    }
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      throw createError(`Invalid ${fieldName}`, 400);
    }
    return trimmed;
  }

  private static async ensureClassOwnership(classId: number, teacherId: number) {
    const classRecord = await ClassModel.findById(classId);
    if (!classRecord) {
      throw createError('Class not found', 404);
    }
    if (classRecord.teacherId !== teacherId) {
      throw createError('You are not assigned to this class', 403);
    }
  }

  private static parseBoolean(value: unknown): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (!normalized) {
        return undefined;
      }
      if (['true', '1', 'yes', 'on'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'off'].includes(normalized)) {
        return false;
      }
      return undefined;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    return undefined;
  }

  // 테스트 생성
  static createTest = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // 교사 또는 관리자만 테스트 생성 가능
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw createError('Insufficient permissions to create test', 403);
    }

    const { title, description, timeLimit, totalScore, isPublished, teacherId, dueDate, classId, publishAt, courseId } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      throw createError('Title is required', 400);
    }

    const normalizedDueDate = this.normalizeDate(dueDate, 'Due date');

    const parsedClassId = Number(classId);
    if (!parsedClassId || Number.isNaN(parsedClassId)) {
      throw createError('Class ID is required', 400);
    }

    let ownerId = req.user.id;
    if (req.user.role === 'admin') {
      const targetTeacherId = Number(teacherId);
      if (!targetTeacherId) {
        throw createError('teacherId is required for admin-created tests', 400);
      }
      const teacher = await UserModel.findById(targetTeacherId);
      if (!teacher || teacher.role !== 'teacher') {
        throw createError('Teacher not found', 404);
      }
      ownerId = teacher.id;

      const classRecord = await ClassModel.findById(parsedClassId);
      if (!classRecord) {
        throw createError('Class not found', 404);
      }
    } else {
      await this.ensureClassOwnership(parsedClassId, ownerId);
    }

    const publishRequested = this.parseBoolean(isPublished);

    const testId = await TestService.createTest({
      title: title.trim(),
      description,
      teacherId: ownerId,
      timeLimit,
      totalScore,
      // 교사도 즉시 공개 선택 시 생성 시점부터 공개되도록 허용
      isPublished: publishRequested === true,
      publishAt: publishAt || null,
      dueDate: normalizedDueDate,
      classId: parsedClassId
    });

    // 선택적으로 강의에 테스트 블록 자동 연결
    const parsedCourseId = courseId ? Number(courseId) : null;
    const linkTestToCourse = async (targetCourseId: number) => {
      const blocks = await CourseModel.getContentBlocks(targetCourseId);
      const exists = blocks.some((b) => {
        if (b.type !== 'test') return false;
        try {
          const content = typeof b.content === 'string' ? JSON.parse(b.content as any) : (b.content as any);
          return Number(content?.testId) === testId;
        } catch {
          return false;
        }
      });
      if (!exists) {
        const orderIndex = await CourseModel.getNextOrderIndex(targetCourseId);
        await CourseModel.createContentBlock({
          courseId: targetCourseId,
          type: 'test',
          title: `테스트 · ${title.trim()}`,
          content: { testId },
          orderIndex,
          isRequired: true
        });
      }
    };

    if (parsedCourseId) {
      const course = await CourseModel.findById(parsedCourseId, { onlyPublished: false });
      if (!course) {
        throw createError('Course not found', 404);
      }
      if (course.classId !== parsedClassId) {
        throw createError('Course does not belong to the selected class', 400);
      }
      await linkTestToCourse(parsedCourseId);
    } else {
      // 코스 ID가 제공되지 않은 경우: 해당 반 강의가 단 하나라면 자동 연결 (담당 교사 미지정 강의도 포함)
      const allClassCourses = await CourseModel.findByClassId(parsedClassId, { onlyPublished: false });
      const teacherCourses = allClassCourses.filter((c) => c.teacherId === ownerId);
      const candidateCourses = teacherCourses.length === 1
        ? teacherCourses
        : (allClassCourses.length === 1 ? allClassCourses : []);
      if (candidateCourses.length === 1) {
        await linkTestToCourse(candidateCourses[0].id);
      }
    }

    res.status(201).json({
      success: true,
      data: { testId },
      message: 'Test created successfully'
    });
  });

  // 테스트 조회
  static getTestById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const testId = parseInt(id, 10);

    if (isNaN(testId)) {
      throw createError('Invalid test ID', 400);
    }

    const testWithQuestions = await TestService.getTestWithQuestions(testId);

    if (!testWithQuestions) {
      throw createError('Test not found', 404);
    }

    if (req.user) {
      this.ensureTestOwnership(req.user, testWithQuestions.test);
    }

    res.status(200).json({
      success: true,
      data: testWithQuestions,
      message: 'Test retrieved successfully'
    });
  });

  // 현재 사용자의 테스트 목록 조회
  static getUserTests = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    let tests: any[] = [];

    switch (req.user.role) {
      case 'admin':
        tests = await TestService.getTestsForAdmin();
        break;
      case 'teacher':
        tests = await TestService.getTestsForTeacher(req.user.id);
        break;
      case 'student':
        tests = await TestService.getTestsForStudent(req.user.id);
        break;
      default:
        throw createError('Invalid user role', 403);
    }

    res.status(200).json({
      success: true,
      data: tests,
      message: 'Tests retrieved successfully'
    });
  });

  static updateTest = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const testId = parseInt(req.params.id, 10);
    if (isNaN(testId)) {
      throw createError('Invalid test ID', 400);
    }

    const test = await TestService.getTestById(testId);
    if (!test) {
      throw createError('Test not found', 404);
    }

    this.ensureTestOwnership(req.user, test);

    const { title, description, timeLimit, totalScore, isPublished, dueDate, classId, publishAt, courseId } = req.body;

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      throw createError('Title must be a non-empty string', 400);
    }

    let normalizedDueDate: string | null | undefined;
    if (dueDate !== undefined) {
      normalizedDueDate = dueDate === null || dueDate === '' ? null : this.normalizeDate(dueDate, 'Due date');
    }

    let parsedClassId: number | null | undefined;
    if (classId !== undefined) {
      if (classId === null || classId === '') {
        parsedClassId = null;
      } else {
        const numericClassId = Number(classId);
        if (!numericClassId || Number.isNaN(numericClassId)) {
          throw createError('Invalid class ID', 400);
        }
        parsedClassId = numericClassId;
      }
    }

    if (parsedClassId !== undefined && parsedClassId !== null && req.user.role === 'teacher') {
      await this.ensureClassOwnership(parsedClassId, req.user.id);
    }

    if (req.user.role === 'admin' && parsedClassId !== undefined && parsedClassId !== null) {
      const classRecord = await ClassModel.findById(parsedClassId);
      if (!classRecord) {
        throw createError('Class not found', 404);
      }
    }

    const publishRequested = this.parseBoolean(isPublished);

    await TestService.updateTest(testId, {
      title: title?.trim(),
      description,
      timeLimit,
      totalScore,
      isPublished: publishRequested,
      publishAt: publishAt,
      dueDate: normalizedDueDate,
      classId: parsedClassId
    });

    // 업데이트 시에도 선택적으로 강의에 연결(없으면 생성)
    const parsedCourseId = courseId === undefined ? undefined : (courseId === null || courseId === '' ? null : Number(courseId));

    const linkTestToCourse = async (targetCourseId: number, displayTitle: string) => {
      const blocks = await CourseModel.getContentBlocks(targetCourseId);
      const exists = blocks.some((b) => {
        if (b.type !== 'test') return false;
        try {
          const content = typeof b.content === 'string' ? JSON.parse(b.content as any) : (b.content as any);
          return Number(content?.testId) === testId;
        } catch {
          return false;
        }
      });
      if (!exists) {
        const orderIndex = await CourseModel.getNextOrderIndex(targetCourseId);
        await CourseModel.createContentBlock({
          courseId: targetCourseId,
          type: 'test',
          title: `테스트 · ${displayTitle}`,
          content: { testId },
          orderIndex,
          isRequired: true
        });
      }
    };

    if (parsedCourseId) {
      const course = await CourseModel.findById(parsedCourseId, { onlyPublished: false });
      if (!course) {
        throw createError('Course not found', 404);
      }
      const courseClassId = parsedClassId ?? course.classId;
      if (course.classId !== courseClassId) {
        throw createError('Course does not belong to the selected class', 400);
      }
      await linkTestToCourse(parsedCourseId, (title ?? test.title)?.toString().trim() || '테스트');
    } else {
      // 코스 ID가 제공되지 않은 경우: 해당 반 강의가 단 하나라면 자동 연결
      const ownerId = test.teacherId;
      const effectiveClassId = parsedClassId ?? test.classId!;
      const allClassCourses = await CourseModel.findByClassId(effectiveClassId, { onlyPublished: false });
      const teacherCourses = allClassCourses.filter((c) => c.teacherId === ownerId);
      const candidateCourses = teacherCourses.length === 1
        ? teacherCourses
        : (allClassCourses.length === 1 ? allClassCourses : []);
      if (candidateCourses.length === 1) {
        await linkTestToCourse(candidateCourses[0].id, (title ?? test.title)?.toString().trim() || '테스트');
      }
    }

    res.status(200).json({
      success: true,
      message: 'Test updated successfully'
    });
  });

  static deleteTest = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const testId = parseInt(req.params.id, 10);
    if (isNaN(testId)) {
      throw createError('Invalid test ID', 400);
    }

    const test = await TestService.getTestById(testId);
    if (!test) {
      throw createError('Test not found', 404);
    }

    this.ensureTestOwnership(req.user, test);

    await TestService.deleteTest(testId);

    res.status(200).json({
      success: true,
      message: 'Test deleted successfully'
    });
  });

  // 테스트 문제 생성
  static createQuestion = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // 교사 또는 관리자만 문제 생성 가능
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw createError('Insufficient permissions to create question', 403);
    }

    const { testId, type, questionText, questionData, points, orderIndex } = req.body;

    const test = await TestService.getTestById(testId);
    if (!test) {
      throw createError('Test not found', 404);
    }

    this.ensureTestOwnership(req.user, test);

    const questionId = await TestService.createQuestion({
      testId,
      type,
      questionText,
      questionData,
      points,
      orderIndex: orderIndex || 0
    });

    res.status(201).json({
      success: true,
      data: { questionId },
      message: 'Question created successfully'
    });
  });

  static updateQuestion = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const questionId = parseInt(req.params.questionId, 10);
    if (isNaN(questionId)) {
      throw createError('Invalid question ID', 400);
    }

    const question = await TestService.getQuestionById(questionId);
    if (!question) {
      throw createError('Question not found', 404);
    }

    const test = await TestService.getTestById(question.testId);
    if (!test) {
      throw createError('Test not found', 404);
    }

    this.ensureTestOwnership(req.user, test);

    await TestService.updateQuestion(questionId, {
      questionText: req.body.questionText,
      questionData: req.body.questionData,
      points: req.body.points,
      orderIndex: req.body.orderIndex
    });

    res.status(200).json({
      success: true,
      message: 'Question updated successfully'
    });
  });

  static deleteQuestion = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const questionId = parseInt(req.params.questionId, 10);
    if (isNaN(questionId)) {
      throw createError('Invalid question ID', 400);
    }

    const question = await TestService.getQuestionById(questionId);
    if (!question) {
      throw createError('Question not found', 404);
    }

    const test = await TestService.getTestById(question.testId);
    if (!test) {
      throw createError('Test not found', 404);
    }

    this.ensureTestOwnership(req.user, test);

    await TestService.deleteQuestion(questionId);

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  });

  static reorderQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const testId = parseInt(req.params.id, 10);
    if (isNaN(testId)) {
      throw createError('Invalid test ID', 400);
    }

    const test = await TestService.getTestById(testId);
    if (!test) {
      throw createError('Test not found', 404);
    }

    this.ensureTestOwnership(req.user, test);

    const { orderedIds } = req.body as { orderedIds: Array<number | string> };
    if (!Array.isArray(orderedIds) || !orderedIds.length) {
      throw createError('orderedIds must be a non-empty array', 400);
    }

    const normalized = orderedIds.map((id) => Number(id));
    if (normalized.some((id) => Number.isNaN(id))) {
      throw createError('orderedIds must contain numeric IDs', 400);
    }

    await TestService.reorderQuestions(testId, normalized);

    res.status(200).json({
      success: true,
      message: 'Questions reordered successfully'
    });
  });

  // 테스트 제출
  static submitTest = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    if (req.user.role !== 'student') {
      throw createError('Only students can submit tests', 403);
    }

    const { testId, answers } = req.body;
    const numericTestId = Number(testId);

    if (!numericTestId || Number.isNaN(numericTestId)) {
      throw createError('Valid test ID is required', 400);
    }

    const result = await TestService.submitTest({
      testId: numericTestId,
      studentId: req.user.id,
      answers
    });

    res.status(201).json({
      success: true,
      data: result,
      message: result.requiresManualGrading
        ? 'Test submitted successfully. Await manual grading.'
        : 'Test submitted and graded automatically.'
    });
  });

  // 테스트 제출 결과 조회
  static getSubmissionResult = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { testId } = req.params;
    const testIdNum = parseInt(testId, 10);

    if (isNaN(testIdNum)) {
      throw createError('Invalid test ID', 400);
    }

    let targetStudentId = req.user.id;
    if ((req.user.role === 'teacher' || req.user.role === 'admin') && req.query.studentId) {
      const parsed = parseInt(req.query.studentId as string, 10);
      if (!isNaN(parsed)) {
        targetStudentId = parsed;
      }
    }

    const submissionWithDetails = await TestService.getSubmissionWithDetails(testIdNum, targetStudentId);

    if (!submissionWithDetails) {
      throw createError('Submission not found', 404);
    }

    // 학생은 자신의 제출 결과만 조회 가능
    if (req.user.role === 'student' && submissionWithDetails.submission.studentId !== req.user.id) {
      throw createError('Insufficient permissions to view this submission', 403);
    }

    if (req.user.role === 'student' && !submissionWithDetails.submission.isPublished) {
      throw createError('Results are not yet published', 403);
    }

    // 교사는 제출이 공개되었거나 자신의 테스트에 대한 제출만 조회 가능
    if (req.user.role === 'teacher' && 
        !submissionWithDetails.submission.isPublished && 
        submissionWithDetails.test.teacherId !== req.user.id) {
      throw createError('Insufficient permissions to view this submission', 403);
    }

    res.status(200).json({
      success: true,
      data: submissionWithDetails,
      message: 'Submission retrieved successfully'
    });
  });

  // 테스트 제출 채점
  static gradeSubmission = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // 교사 또는 관리자만 채점 가능
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw createError('Insufficient permissions to grade submission', 403);
    }

    const { submissionId } = req.params;
    const { score, gradedResults, publish, feedback } = req.body;
    const submissionIdNum = parseInt(submissionId, 10);

    if (isNaN(submissionIdNum)) {
      throw createError('Invalid submission ID', 400);
    }

    const submission = await TestService.getSubmissionById(submissionIdNum);
    if (!submission) {
      throw createError('Submission not found', 404);
    }

    const test = await TestService.getTestById(submission.testId);
    if (!test) {
      throw createError('Test not found', 404);
    }

    this.ensureTestOwnership(req.user, test);

    await TestService.gradeSubmission(submissionIdNum, {
      score,
      gradedResults,
      publish,
      feedback
    });

    res.status(200).json({
      success: true,
      message: publish ? 'Submission graded and published successfully' : 'Submission graded successfully'
    });
  });

  static publishSubmission = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const submissionId = parseInt(req.params.submissionId, 10);
    if (isNaN(submissionId)) {
      throw createError('Invalid submission ID', 400);
    }

    const submission = await TestService.getSubmissionById(submissionId);
    if (!submission) {
      throw createError('Submission not found', 404);
    }

    const test = await TestService.getTestById(submission.testId);
    if (!test) {
      throw createError('Test not found', 404);
    }

    this.ensureTestOwnership(req.user, test);

    await TestService.publishSubmission(submissionId, true);

    res.status(200).json({
      success: true,
      message: 'Submission published successfully'
    });
  });

  static unpublishSubmission = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const submissionId = parseInt(req.params.submissionId, 10);
    if (isNaN(submissionId)) {
      throw createError('Invalid submission ID', 400);
    }

    const submission = await TestService.getSubmissionById(submissionId);
    if (!submission) {
      throw createError('Submission not found', 404);
    }

    const test = await TestService.getTestById(submission.testId);
    if (!test) {
      throw createError('Test not found', 404);
    }

    this.ensureTestOwnership(req.user, test);

    await TestService.publishSubmission(submissionId, false);

    res.status(200).json({
      success: true,
      message: 'Submission unpublished successfully'
    });
  });

  static getTestAttempt = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    if (req.user.role !== 'student') {
      throw createError('Only students can attempt tests', 403);
    }

    const testId = parseInt(req.params.id, 10);
    if (isNaN(testId)) {
      throw createError('Invalid test ID', 400);
    }

    const attempt = await TestService.prepareTestAttempt(testId, req.user.id);

    res.status(200).json({
      success: true,
      data: attempt,
      message: 'Test attempt prepared'
    });
  });

  static getTestSubmissions = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const testId = parseInt(req.params.id, 10);
    if (isNaN(testId)) {
      throw createError('Invalid test ID', 400);
    }

    const test = await TestService.getTestById(testId);
    if (!test) {
      throw createError('Test not found', 404);
    }

    this.ensureTestOwnership(req.user, test);

    const submissions = await TestService.getSubmissionsByTest(testId);

    res.status(200).json({
      success: true,
      data: submissions,
      message: 'Submissions retrieved successfully'
    });
  });
}
