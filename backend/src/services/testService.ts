import { TestModel } from '../models/testModel';
import { CalendarEventModel } from '../models/calendarEventModel';
import { Test, TestQuestion, TestSubmission } from '../types';
import ActivityLogService from './activityLogService';
import { NotificationService } from './notificationService';

export class TestService {
  // 테스트 생성
  static async createTest(testData: {
    title: string;
    description?: string;
    teacherId: number;
    timeLimit?: number;
    totalScore?: number;
    isPublished?: boolean;
    publishAt?: string | null;
    dueDate?: string | null;
    classId?: number | null;
  }): Promise<number> {
    const testId = await TestModel.create(testData);
    if (testData.isPublished) {
      const created = await this.getTestById(testId);
      if (created) {
        await this.syncCalendarEvent(created);
      }
    }
    return testId;
  }

  // 테스트 조회
  static async getTestById(id: number): Promise<Test | null> {
    return await TestModel.findById(id);
  }

  // 특정 교사의 테스트 목록 조회
  static async getTestsByTeacherId(teacherId: number): Promise<Test[]> {
    return await TestModel.findByTeacherId(teacherId);
  }

  static async getAllTests(): Promise<Test[]> {
    return await TestModel.findAll();
  }

  // 테스트 공개 설정
  static async publishTest(testId: number, isPublished: boolean): Promise<void> {
    await TestModel.publishTest(testId, isPublished);
    const updated = await this.getTestById(testId);
    if (updated) {
      await this.syncCalendarEvent(updated);
    }
  }

  static async updateTest(testId: number, updates: {
    title?: string;
    description?: string | null;
    timeLimit?: number | null;
    totalScore?: number | null;
    isPublished?: boolean;
    publishAt?: string | null;
    dueDate?: string | null;
    classId?: number | null;
  }): Promise<void> {
    const existing = await this.getTestById(testId);
    if (!existing) {
      throw createValidationError('Test not found', 404);
    }

    await TestModel.update(testId, updates);

    const after = await this.getTestById(testId);
    if (after) {
      await this.syncCalendarEvent(after);
    }
  }

  static async deleteTest(testId: number): Promise<void> {
    await TestModel.delete(testId);
  }

  // 테스트 문제 생성
  static async createQuestion(questionData: {
    testId: number;
    type: string;
    questionText: string;
    questionData: any;
    points?: number;
    orderIndex: number;
  }): Promise<number> {
    return await TestModel.createQuestion(questionData);
  }

  static async updateQuestion(questionId: number, updates: {
    questionText?: string;
    questionData?: any;
    points?: number;
    orderIndex?: number;
  }): Promise<void> {
    await TestModel.updateQuestion(questionId, updates);
  }

  static async getQuestionById(questionId: number): Promise<TestQuestion | null> {
    return await TestModel.findQuestionById(questionId);
  }

  static async deleteQuestion(questionId: number): Promise<void> {
    await TestModel.deleteQuestion(questionId);
  }

  static async reorderQuestions(testId: number, orderedIds: number[]): Promise<void> {
    await TestModel.reorderQuestions(testId, orderedIds);
  }

  // 테스트 문제 목록 조회
  static async getQuestions(testId: number): Promise<TestQuestion[]> {
    return await TestModel.getQuestions(testId);
  }

  // 테스트 제출 생성
  static async createSubmission(submissionData: {
    testId: number;
    studentId: number;
    answers: any;
    score?: number | null;
    isGraded?: boolean;
    gradedAt?: Date | null;
  }): Promise<number> {
    return await TestModel.createSubmission(submissionData);
  }

  // 테스트 제출 조회
  static async getSubmission(testId: number, studentId: number): Promise<TestSubmission | null> {
    return await TestModel.getSubmission(testId, studentId);
  }

  static async getSubmissionById(submissionId: number): Promise<TestSubmission | null> {
    return await TestModel.getSubmissionById(submissionId);
  }

  static async getSubmissionsByTest(testId: number): Promise<(TestSubmission & { studentName?: string })[]> {
    return await TestModel.getSubmissionsByTest(testId);
  }

  // 테스트 제출 채점
  static async gradeSubmission(submissionId: number, options: {
    score: number;
    gradedResults?: any;
    publish?: boolean;
    feedback?: string;
  }): Promise<void> {
    const submission = await TestModel.getSubmissionById(submissionId);
    if (!submission) {
      throw createValidationError('Submission not found', 404);
    }

    const baseAnswers = submission.answers || {};
    const mergedResults = Array.isArray(options.gradedResults)
      ? options.gradedResults
      : (baseAnswers as any)?.results ?? null;

    const updatedAnswers = {
      ...baseAnswers,
      results: mergedResults ?? (baseAnswers as any)?.results ?? null,
      feedback: options.feedback ?? (baseAnswers as any)?.feedback ?? null,
      gradedAt: new Date().toISOString()
    };

    await TestModel.updateSubmission(submissionId, {
      answers: updatedAnswers,
      score: options.score,
      isGraded: true,
      gradedAt: new Date()
    });

    if (options.publish !== undefined) {
      await TestModel.publishSubmission(submissionId, options.publish);
    }

    // Notify student when grading is published immediately
    if (options.publish === true) {
      const test = await this.getTestById(submission.testId);
      await NotificationService.createTestGradedNotification(
        submission.studentId,
        test?.title ?? '테스트',
        typeof options.score === 'number' ? options.score : null,
        submission.testId
      );
    }
  }

  // 테스트 제출 공개 설정
  static async publishSubmission(submissionId: number, isPublished: boolean): Promise<void> {
    await TestModel.publishSubmission(submissionId, isPublished);

    // Notify student when result publication is toggled ON
    if (isPublished) {
      const submission = await TestModel.getSubmissionById(submissionId);
      if (submission) {
        const test = await this.getTestById(submission.testId);
        await NotificationService.createTestResultPublishedNotification(
          submission.studentId,
          test?.title ?? '테스트',
          submission.testId
        );
      }
    }
  }

  // 테스트 및 문제 정보 함께 조회
  static async getTestWithQuestions(testId: number): Promise<{test: Test, questions: TestQuestion[]} | null> {
    const test = await this.getTestById(testId);
    if (!test) return null;

    const questions = await this.getQuestions(testId);
    return { test, questions: questions.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)) };
  }

  // 테스트 제출 및 관련 정보 조회
  static async getSubmissionWithDetails(testId: number, studentId: number): Promise<{test: Test, submission: TestSubmission, questions: TestQuestion[]} | null> {
    const test = await this.getTestById(testId);
    if (!test) return null;

    const submission = await this.getSubmission(testId, studentId);
    if (!submission) return null;

    const questions = await this.getQuestions(testId);
    return { test, submission, questions: questions.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)) };
  }

  static async getTestsForStudent(studentId: number) {
    const [courseLinked, classLinked, submissionMap] = await Promise.all([
      TestModel.findAvailableForStudent(studentId),
      TestModel.findClassBasedForStudent(studentId),
      TestModel.getStudentSubmissionMap(studentId)
    ]);
 
    type AggregatedTest = (typeof classLinked)[number] & {
      courseId: number | null;
      courseTitle: string | null;
      blockId: number | null;
    };
    const merged = new Map<number, AggregatedTest>();
    [...classLinked, ...courseLinked].forEach((rawTest) => {
      const test: AggregatedTest = {
        ...rawTest,
        courseId: rawTest.courseId ?? null,
        courseTitle: rawTest.courseTitle ?? null,
        blockId: rawTest.blockId ?? null
      };
      const existing = merged.get(test.id);
      if (!existing) {
        merged.set(test.id, test);
        return;
      }
 
      const shouldUpgradeBlock =
        (existing.blockId === null || existing.blockId === undefined) && test.blockId !== null;
      if (shouldUpgradeBlock) {
        merged.set(test.id, {
          ...existing,
          courseId: test.courseId,
          courseTitle: test.courseTitle,
          blockId: test.blockId
        });
        return;
      }
 
      const needsCourseInfo =
        (existing.courseId === null || existing.courseId === undefined) && test.courseId !== null;
      const needsCourseTitle =
        (!existing.courseTitle || existing.courseTitle === null) && !!test.courseTitle;
      if (needsCourseInfo || needsCourseTitle) {
        merged.set(test.id, {
          ...existing,
          courseId: needsCourseInfo ? test.courseId : existing.courseId,
          courseTitle: needsCourseTitle ? test.courseTitle : existing.courseTitle
        });
      }
    });
 
    return Array.from(merged.values()).map((test) => ({
      ...test,
      hasSubmitted: Boolean(submissionMap[test.id]),
      submissionStatus: submissionMap[test.id]
        ? {
            submissionId: submissionMap[test.id].id,
            isGraded: submissionMap[test.id].isGraded,
            isPublished: submissionMap[test.id].isPublished,
            score: submissionMap[test.id].score,
            submittedAt: submissionMap[test.id].submittedAt
          }
        : null
    }));
  }

  static async getTestsForTeacher(teacherId: number) {
    const tests = await this.getTestsByTeacherId(teacherId);
    const stats = await TestModel.getSubmissionStats(tests.map((test) => test.id));
    return tests.map((test) => ({
      ...test,
      submissionStats: stats[test.id] || { total: 0, published: 0, graded: 0 }
    }));
  }

  static async getTestsForAdmin() {
    const tests = await this.getAllTests();
    const stats = await TestModel.getSubmissionStats(tests.map((test) => test.id));
    return tests.map((test) => ({
      ...test,
      submissionStats: stats[test.id] || { total: 0, published: 0, graded: 0 }
    }));
  }

  static sanitizeQuestionForAttempt(question: TestQuestion) {
    const sanitizedData = { ...(question.questionData || {}) };
    if (question.type === 'ox') {
      delete sanitizedData.correctAnswer;
      delete sanitizedData.explanation;
    }
    if (question.type === 'multiple_choice') {
      delete sanitizedData.correctOption;
      delete sanitizedData.explanation;
    }
    if (question.type === 'short_answer') {
      delete sanitizedData.correctAnswer;
      delete sanitizedData.acceptableAnswers;
    }
    if (question.type === 'essay') {
      delete sanitizedData.modelAnswer;
    }

    return {
      id: question.id,
      type: question.type,
      questionText: question.questionText,
      points: question.points,
      orderIndex: question.orderIndex,
      questionData: sanitizedData
    };
  }

  static gradeQuestion(question: TestQuestion, response: any) {
    const points = question.points ?? 0;
    switch (question.type) {
      case 'ox': {
        const correct = String((question.questionData?.correctAnswer ?? '')).toUpperCase();
        const answer = String(response ?? '').toUpperCase();
        const isCorrect = correct && answer === correct;
        return {
          isCorrect,
          awardedScore: isCorrect ? points : 0,
          requiresManualGrading: false
        };
      }
      case 'multiple_choice': {
        const correctOption = Number(question.questionData?.correctOption);
        const answer = Number(response);
        const isCorrect = Number.isInteger(correctOption) && answer === correctOption;
        return {
          isCorrect,
          awardedScore: isCorrect ? points : 0,
          requiresManualGrading: false
        };
      }
      case 'short_answer': {
        const correctAnswer = (question.questionData?.correctAnswer ?? '').toString().trim();
        const acceptable = Array.isArray(question.questionData?.acceptableAnswers)
          ? question.questionData.acceptableAnswers.map((val: any) => val.toString().trim())
          : [];
        const answerStr = response ? response.toString().trim() : '';
        const isCorrect = !!answerStr && ([correctAnswer, ...acceptable].some((candidate) => candidate.localeCompare(answerStr, undefined, { sensitivity: 'accent' }) === 0));
        return {
          isCorrect,
          awardedScore: isCorrect ? points : 0,
          requiresManualGrading: false
        };
      }
      case 'essay':
      default:
        return {
          isCorrect: undefined,
          awardedScore: null,
          requiresManualGrading: true
        };
    }
  }

  static async prepareTestAttempt(testId: number, studentId: number) {
    const availableTests = await this.getTestsForStudent(studentId);
    const targetTest = availableTests.find((test) => test.id === testId);
    if (!targetTest) {
      throw createValidationError('Test not available for this student', 403);
    }

    if (!targetTest.isPublished) {
      throw createValidationError('Test is not yet published', 403);
    }

    const { questions } = await this.getTestWithQuestions(testId) ?? {};
    if (!questions) {
      throw createValidationError('Test not found', 404);
    }

    const sanitized = questions
      .map((question) => ({ ...question, questionData: typeof question.questionData === 'string' ? JSON.parse(question.questionData) : question.questionData }))
      .map(this.sanitizeQuestionForAttempt)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return {
      test: targetTest,
      questions: sanitized
    };
  }

  static async submitTest(options: {
    testId: number;
    studentId: number;
    answers: Record<string, any>;
  }) {
    const { testId, studentId, answers } = options;
    const testData = await this.getTestWithQuestions(testId);
    if (!testData) {
      throw createValidationError('Test not found', 404);
    }

    if (!testData.test.isPublished) {
      throw createValidationError('Test is not published yet', 403);
    }

    const availableTests = await this.getTestsForStudent(studentId);
    const isAccessible = availableTests.some((test) => test.id === testId);
    if (!isAccessible) {
      throw createValidationError('Test is not available for this student', 403);
    }

    // 마감일 초과 시 제출 차단 (KST 23:59:59 기준)
    if (testData.test.dueDate) {
      const due = new Date(testData.test.dueDate as any);
      const endUtc = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate(), 14, 59, 59, 999); // 23:59:59 KST
      if (Date.now() > endUtc) {
        throw createValidationError('Test deadline has passed', 403);
      }
    }

    const existingSubmission = await this.getSubmission(testId, studentId);
    if (existingSubmission) {
      throw createValidationError('Test already submitted', 409);
    }

    const questionResults = testData.questions.map((question) => {
      const parsedQuestion = {
        ...question,
        questionData: typeof question.questionData === 'string' ? JSON.parse(question.questionData) : question.questionData
      } as TestQuestion;
      const response = answers?.[question.id] ?? answers?.[String(question.id)];
      const { isCorrect, awardedScore, requiresManualGrading } = this.gradeQuestion(parsedQuestion, response);
      return {
        questionId: question.id,
        response,
        isCorrect,
        awardedScore,
        maxScore: parsedQuestion.points ?? 0,
        requiresManualGrading
      };
    });

    const autoScore = questionResults
      .filter((result) => !result.requiresManualGrading && typeof result.awardedScore === 'number')
      .reduce((sum, result) => sum + (result.awardedScore ?? 0), 0);

    const requiresManualGrading = questionResults.some((result) => result.requiresManualGrading);

    const submissionId = await this.createSubmission({
      testId,
      studentId,
      answers: {
        results: questionResults,
        submittedAt: new Date().toISOString()
      },
      score: requiresManualGrading ? null : autoScore,
      isGraded: !requiresManualGrading,
      gradedAt: requiresManualGrading ? null : new Date()
    });

    await ActivityLogService.log({
      userId: studentId,
      activityType: 'test_complete',
      relatedId: testId,
      metadata: {
        submissionId,
        score: requiresManualGrading ? null : autoScore,
        requiresManualGrading,
        totalQuestions: questionResults.length
      }
    });

    return {
      submissionId,
      score: requiresManualGrading ? null : autoScore,
      requiresManualGrading,
      autoResults: questionResults
    };
  }

  static async publishSubmissionResult(submissionId: number, isPublished: boolean) {
    await TestModel.publishSubmission(submissionId, isPublished);
  }

  private static formatDateOnly(value?: Date | string | null): string | null {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return value;
  }

  private static async syncCalendarEvent(test: Test) {
    const dueDate = this.formatDateOnly(test.dueDate);

    if (!dueDate || !test.classId || !test.isPublished) {
      await CalendarEventModel.deleteByTestId(test.id);
      return;
    }

    const existing = await CalendarEventModel.findByTestId(test.id);

    const payload = {
      title: test.title,
      description: test.description ? `${test.description}` : '테스트 마감일을 확인하세요.',
      startDate: dueDate,
      endDate: dueDate,
      classId: test.classId,
      testId: test.id,
      teacherId: test.teacherId
    };

    if (!existing) {
      await CalendarEventModel.create({
        eventType: 'test_deadline',
        title: payload.title,
        description: payload.description,
        startDate: payload.startDate,
        endDate: payload.endDate,
        classId: payload.classId,
        testId: payload.testId,
        teacherId: payload.teacherId,
        visibility: 'class',
        createdBy: test.teacherId
      });
    } else {
      await CalendarEventModel.update(existing.id, payload);
    }
  }
}

function createValidationError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}
