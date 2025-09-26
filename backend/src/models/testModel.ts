import { query } from '../config/database';
import { Test, TestQuestion, TestSubmission } from '../types';

export class TestModel {
  static async findAll(): Promise<Test[]> {
    const rows = await query(
      `SELECT t.id,
              t.title,
              t.description,
              t.teacher_id as teacherId,
              t.time_limit as timeLimit,
              t.total_score as totalScore,
              t.is_published as isPublished,
              t.publish_at as publishAt,
              t.due_date as dueDate,
              t.class_id as classId,
              c.name as className,
              subj.name as subjectName,
              t.created_at as createdAt
       FROM tests t
       LEFT JOIN classes c ON t.class_id = c.id
       LEFT JOIN subjects subj ON c.subject_id = subj.id
       ORDER BY t.created_at DESC`
    ) as Test[];
    return rows;
  }

  // 테스트 생성
  static async create(testData: {
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
    const result = await query(
      'INSERT INTO tests (title, description, teacher_id, time_limit, total_score, publish_at, due_date, class_id, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        testData.title,
        testData.description || null,
        testData.teacherId,
        testData.timeLimit || null,
        testData.totalScore || 100,
        testData.publishAt || null,
        testData.dueDate || null,
        testData.classId || null,
        testData.isPublished ?? false,
      ]
    ) as any;

    return result.insertId;
  }

  // 테스트 조회
  static async findById(id: number): Promise<Test | null> {
    const tests = await query(
      `SELECT t.id,
              t.title,
              t.description,
              t.teacher_id as teacherId,
              t.time_limit as timeLimit,
              t.total_score as totalScore,
              t.is_published as isPublished,
              t.publish_at as publishAt,
              t.due_date as dueDate,
              t.class_id as classId,
              c.name as className,
              subj.name as subjectName,
              t.created_at as createdAt
       FROM tests t
       LEFT JOIN classes c ON t.class_id = c.id
       LEFT JOIN subjects subj ON c.subject_id = subj.id
       WHERE t.id = ?`,
      [id]
    ) as Test[];
    
    return tests.length > 0 ? tests[0] : null;
  }

  // 특정 교사의 테스트 목록 조회
  static async findByTeacherId(teacherId: number): Promise<Test[]> {
    const tests = await query(
      `SELECT t.id,
              t.title,
              t.description,
              t.teacher_id as teacherId,
              t.time_limit as timeLimit,
              t.total_score as totalScore,
              t.is_published as isPublished,
              t.publish_at as publishAt,
              t.due_date as dueDate,
              t.class_id as classId,
              c.name as className,
              subj.name as subjectName,
              t.created_at as createdAt
       FROM tests t
       LEFT JOIN classes c ON t.class_id = c.id
       LEFT JOIN subjects subj ON c.subject_id = subj.id
       WHERE t.teacher_id = ?
       ORDER BY t.created_at DESC`,
      [teacherId]
    ) as Test[];
    
    return tests;
  }

  static async update(testId: number, updates: {
    title?: string;
    description?: string | null;
    timeLimit?: number | null;
    totalScore?: number | null;
    isPublished?: boolean;
    publishAt?: string | null;
    dueDate?: string | null;
    classId?: number | null;
  }): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      params.push(updates.title);
    }

    if (updates.description !== undefined) {
      fields.push('description = ?');
      params.push(updates.description);
    }

    if (updates.timeLimit !== undefined) {
      fields.push('time_limit = ?');
      params.push(updates.timeLimit);
    }

    if (updates.totalScore !== undefined) {
      fields.push('total_score = ?');
      params.push(updates.totalScore);
    }

    if (updates.dueDate !== undefined) {
      fields.push('due_date = ?');
      params.push(updates.dueDate);
    }

    if (updates.classId !== undefined) {
      fields.push('class_id = ?');
      params.push(updates.classId);
    }

    if (updates.isPublished !== undefined) {
      fields.push('is_published = ?');
      params.push(updates.isPublished);
    }
    
    if (updates.publishAt !== undefined) {
      fields.push('publish_at = ?');
      params.push(updates.publishAt);
    }

    if (!fields.length) {
      return;
    }

    params.push(testId);
    await query(`UPDATE tests SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, params);
  }

  static async delete(testId: number): Promise<void> {
    await query('DELETE FROM tests WHERE id = ?', [testId]);
  }

  static async deleteQuestionsByTestIds(testIds: number[]): Promise<void> {
    if (!testIds.length) return;
    const placeholders = testIds.map(() => '?').join(', ');
    await query(`DELETE FROM test_questions WHERE test_id IN (${placeholders})`, testIds);
  }

  static async deleteSubmissionsByTestIds(testIds: number[]): Promise<void> {
    if (!testIds.length) return;
    const placeholders = testIds.map(() => '?').join(', ');
    await query(`DELETE FROM test_submissions WHERE test_id IN (${placeholders})`, testIds);
  }

  static async deleteByIds(testIds: number[]): Promise<void> {
    if (!testIds.length) return;
    const placeholders = testIds.map(() => '?').join(', ');
    await query(`DELETE FROM tests WHERE id IN (${placeholders})`, testIds);
  }

  static async deleteDeepByIds(testIds: number[]): Promise<void> {
    if (!testIds.length) return;
    await this.deleteSubmissionsByTestIds(testIds);
    await this.deleteQuestionsByTestIds(testIds);
    await this.deleteByIds(testIds);
  }

  // 테스트 공개 설정
  static async publishTest(testId: number, isPublished: boolean): Promise<void> {
    await query(
      'UPDATE tests SET is_published = ?, updated_at = NOW() WHERE id = ?',
      [isPublished, testId]
    );
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
    const result = await query(
      'INSERT INTO test_questions (test_id, type, question_text, question_data, points, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      [
        questionData.testId,
        questionData.type,
        questionData.questionText,
        JSON.stringify(questionData.questionData),
        questionData.points || 10,
        questionData.orderIndex
      ]
    ) as any;
    
    return result.insertId;
  }

  static async findQuestionById(questionId: number): Promise<TestQuestion | null> {
    const rows = await query(
      `SELECT id, test_id as testId, type, question_text as questionText,
              question_data as questionData, points, order_index as orderIndex, created_at as createdAt
       FROM test_questions
       WHERE id = ?
       LIMIT 1`,
      [questionId]
    ) as TestQuestion[];

    if (!rows.length) {
      return null;
    }

    const question = rows[0];
    return {
      ...question,
      questionData: typeof question.questionData === 'string' ? JSON.parse(question.questionData) : question.questionData
    };
  }

  static async updateQuestion(questionId: number, updates: {
    questionText?: string;
    questionData?: any;
    points?: number;
    orderIndex?: number;
  }): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.questionText !== undefined) {
      fields.push('question_text = ?');
      params.push(updates.questionText);
    }

    if (updates.questionData !== undefined) {
      fields.push('question_data = ?');
      params.push(JSON.stringify(updates.questionData));
    }

    if (updates.points !== undefined) {
      fields.push('points = ?');
      params.push(updates.points);
    }

    if (updates.orderIndex !== undefined) {
      fields.push('order_index = ?');
      params.push(updates.orderIndex);
    }

    if (!fields.length) {
      return;
    }

    params.push(questionId);
    await query(`UPDATE test_questions SET ${fields.join(', ')}, created_at = created_at WHERE id = ?`, params);
  }

  static async deleteQuestion(questionId: number): Promise<void> {
    await query('DELETE FROM test_questions WHERE id = ?', [questionId]);
  }

  static async reorderQuestions(testId: number, orderedIds: number[]): Promise<void> {
    const updates = orderedIds.map((id, index) => query(
      'UPDATE test_questions SET order_index = ? WHERE id = ? AND test_id = ?',
      [index, id, testId]
    ));
    await Promise.all(updates);
  }

  // 테스트 문제 목록 조회
  static async getQuestions(testId: number): Promise<TestQuestion[]> {
    const questions = await query(
      `SELECT id, test_id as testId, type, question_text as questionText, 
              question_data as questionData, points, order_index as orderIndex, created_at as createdAt
       FROM test_questions 
       WHERE test_id = ? 
       ORDER BY order_index ASC`,
      [testId]
    ) as TestQuestion[];
    
    // questionData를 JSON으로 파싱
    return questions.map(q => ({
      ...q,
      questionData: typeof q.questionData === 'string' ? JSON.parse(q.questionData) : q.questionData
    }));
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
    const result = await query(
      'INSERT INTO test_submissions (test_id, student_id, answers, score, is_graded, graded_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        submissionData.testId,
        submissionData.studentId,
        JSON.stringify(submissionData.answers),
        typeof submissionData.score === 'number' ? submissionData.score : null,
        submissionData.isGraded ? 1 : 0,
        submissionData.gradedAt ? submissionData.gradedAt : null
      ]
    ) as any;

    return result.insertId;
  }

  // 테스트 제출 조회
  static async getSubmission(testId: number, studentId: number): Promise<TestSubmission | null> {
    const submissions = await query(
      `SELECT id, test_id as testId, student_id as studentId, answers, score, 
              is_graded as isGraded, is_published as isPublished, submitted_at as submittedAt, graded_at as gradedAt
       FROM test_submissions 
       WHERE test_id = ? AND student_id = ?`,
      [testId, studentId]
    ) as TestSubmission[];
    
    if (submissions.length === 0) return null;
    
    const submission = submissions[0];
    // answers를 JSON으로 파싱
    return {
      ...submission,
      answers: typeof submission.answers === 'string' ? JSON.parse(submission.answers) : submission.answers
    };
  }

  static async getSubmissionById(submissionId: number): Promise<TestSubmission | null> {
    const rows = await query(
      `SELECT id, test_id as testId, student_id as studentId, answers, score, is_graded as isGraded,
              is_published as isPublished, submitted_at as submittedAt, graded_at as gradedAt
       FROM test_submissions
       WHERE id = ?`,
      [submissionId]
    ) as TestSubmission[];

    if (!rows.length) {
      return null;
    }

    const submission = rows[0];
    return {
      ...submission,
      answers: typeof submission.answers === 'string' ? JSON.parse(submission.answers) : submission.answers
    };
  }

  static async getSubmissionsByTest(testId: number): Promise<(TestSubmission & { studentName?: string })[]> {
    const rows = await query(
      `SELECT ts.id,
              ts.test_id as testId,
              ts.student_id as studentId,
              ts.answers,
              ts.score,
              ts.is_graded as isGraded,
              ts.is_published as isPublished,
              ts.submitted_at as submittedAt,
              ts.graded_at as gradedAt,
              u.name as studentName
       FROM test_submissions ts
       JOIN users u ON ts.student_id = u.id
       WHERE ts.test_id = ?
       ORDER BY ts.submitted_at DESC`,
      [testId]
    ) as any[];

    return rows.map((row) => ({
      ...row,
      answers: typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers
    }));
  }

  // 테스트 제출 채점
  static async gradeSubmission(submissionId: number, score: number): Promise<void> {
    await query(
      'UPDATE test_submissions SET score = ?, is_graded = TRUE, graded_at = NOW() WHERE id = ?',
      [score, submissionId]
    );
  }

  // 테스트 제출 공개 설정
  static async publishSubmission(submissionId: number, isPublished: boolean): Promise<void> {
    await query(
      'UPDATE test_submissions SET is_published = ? WHERE id = ?',
      [isPublished, submissionId]
    );
  }

  static async updateSubmission(submissionId: number, updates: {
    answers?: any;
    score?: number | null;
    isGraded?: boolean;
    gradedAt?: Date | null;
    isPublished?: boolean;
  }): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.answers !== undefined) {
      fields.push('answers = ?');
      params.push(JSON.stringify(updates.answers));
    }

    if (updates.score !== undefined) {
      fields.push('score = ?');
      params.push(updates.score);
    }

    if (updates.isGraded !== undefined) {
      fields.push('is_graded = ?');
      params.push(updates.isGraded ? 1 : 0);
    }

    if (updates.gradedAt !== undefined) {
      fields.push('graded_at = ?');
      params.push(updates.gradedAt);
    }

    if (updates.isPublished !== undefined) {
      fields.push('is_published = ?');
      params.push(updates.isPublished ? 1 : 0);
    }

    if (!fields.length) {
      return;
    }

    params.push(submissionId);
    await query(`UPDATE test_submissions SET ${fields.join(', ')}, submitted_at = submitted_at WHERE id = ?`, params);
  }

  static async getSubmissionStats(testIds: number[]): Promise<Record<number, { total: number; published: number; graded: number }>> {
    if (!testIds.length) {
      return {};
    }

    const placeholders = testIds.map(() => '?').join(', ');
    const rows = await query(
      `SELECT test_id as testId,
              COUNT(*) as total,
              SUM(CASE WHEN is_published = TRUE THEN 1 ELSE 0 END) as published,
              SUM(CASE WHEN is_graded = TRUE THEN 1 ELSE 0 END) as graded
       FROM test_submissions
       WHERE test_id IN (${placeholders})
       GROUP BY test_id`,
      testIds
    ) as any[];

    return rows.reduce((acc, row) => {
      acc[row.testId] = {
        total: Number(row.total || 0),
        published: Number(row.published || 0),
        graded: Number(row.graded || 0)
      };
      return acc;
    }, {} as Record<number, { total: number; published: number; graded: number }>);
  }

  static async getStudentSubmissionMap(studentId: number): Promise<Record<number, TestSubmission>> {
    const rows = await query(
      `SELECT id, test_id as testId, student_id as studentId, answers, score, is_graded as isGraded,
              is_published as isPublished, submitted_at as submittedAt, graded_at as gradedAt
       FROM test_submissions
       WHERE student_id = ?`,
      [studentId]
    ) as TestSubmission[];

    return rows.reduce((acc, row) => {
      acc[row.testId] = {
        ...row,
        answers: typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers
      };
      return acc;
    }, {} as Record<number, TestSubmission>);
  }

  static async findAvailableForStudent(studentId: number): Promise<Array<Test & { courseId: number; courseTitle: string; blockId: number }>> {
    const rows = await query(
      `SELECT DISTINCT
         t.id,
         t.title,
         t.description,
         t.teacher_id as teacherId,
         t.time_limit as timeLimit,
         t.total_score as totalScore,
         t.is_published as isPublished,
         t.publish_at as publishAt,
         t.due_date as dueDate,
         t.class_id as classId,
         cls.name as className,
         subj.name as subjectName,
         t.created_at as createdAt,
         cb.course_id as courseId,
         cb.id as blockId,
         c.title as courseTitle
       FROM content_blocks cb
       JOIN courses c ON cb.course_id = c.id AND c.is_published = TRUE
       LEFT JOIN course_students cs ON cs.course_id = c.id AND cs.student_id = ?
       LEFT JOIN students stu ON stu.user_id = ?
       LEFT JOIN class_students cls_map ON cls_map.class_id = c.class_id AND cls_map.student_id = ?
       JOIN tests t ON t.id = CAST(JSON_UNQUOTE(JSON_EXTRACT(cb.content, '$.testId')) AS UNSIGNED)
       LEFT JOIN classes cls ON t.class_id = cls.id
       LEFT JOIN subjects subj ON cls.subject_id = subj.id
       WHERE cb.type = 'test'
         AND t.is_published = TRUE
         AND (
           cs.student_id IS NOT NULL
           OR (stu.class_id IS NOT NULL AND stu.class_id = c.class_id)
           OR cls_map.id IS NOT NULL
         )
       ORDER BY c.title ASC, t.created_at DESC`,
      [studentId, studentId, studentId]
    ) as any[];

    const uniqueMap = new Map<number, any>();
    rows.forEach((row) => {
      if (!uniqueMap.has(row.id)) {
        uniqueMap.set(row.id, row);
      }
    });

    return Array.from(uniqueMap.values()).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      teacherId: row.teacherId,
      timeLimit: row.timeLimit,
      totalScore: row.totalScore,
      isPublished: !!row.isPublished,
      publishAt: row.publishAt ?? null,
      dueDate: row.dueDate ?? null,
      classId: row.classId ?? null,
      className: row.className ?? null,
      subjectName: row.subjectName ?? null,
      createdAt: row.createdAt,
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      blockId: row.blockId
    }));
  }

  static async findClassBasedForStudent(studentId: number): Promise<Array<Test & { courseId: number | null; courseTitle: string | null; blockId: number | null }>> {
    const rows = await query(
      `SELECT DISTINCT
         t.id,
         t.title,
         t.description,
         t.teacher_id as teacherId,
         t.time_limit as timeLimit,
         t.total_score as totalScore,
         t.is_published as isPublished,
         t.publish_at as publishAt,
         t.due_date as dueDate,
         t.class_id as classId,
         cls.name as className,
         subj.name as subjectName,
         t.created_at as createdAt,
         cb.course_id as courseId,
         c.title as courseTitle,
         cb.id as blockId
       FROM tests t
       LEFT JOIN classes cls ON t.class_id = cls.id
       LEFT JOIN subjects subj ON cls.subject_id = subj.id
       LEFT JOIN content_blocks cb
         ON cb.type = 'test'
        AND CAST(JSON_UNQUOTE(JSON_EXTRACT(cb.content, '$.testId')) AS UNSIGNED) = t.id
       LEFT JOIN courses c ON cb.course_id = c.id
       WHERE t.is_published = TRUE
         AND t.class_id IS NOT NULL
         AND (
           EXISTS (
             SELECT 1
               FROM class_students cls_map
              WHERE cls_map.class_id = t.class_id
                AND cls_map.student_id = ?
           )
           OR EXISTS (
             SELECT 1
               FROM students stu
              WHERE stu.user_id = ?
                AND stu.class_id = t.class_id
           )
           OR EXISTS (
             SELECT 1
               FROM course_students cs
               JOIN courses c2 ON c2.id = cs.course_id
              WHERE cs.student_id = ?
                AND c2.class_id = t.class_id
           )
         )
       ORDER BY t.created_at DESC`,
      [studentId, studentId, studentId]
    ) as any[];

    const uniqueMap = new Map<number, any>();
    rows.forEach((row) => {
      if (!uniqueMap.has(row.id)) {
        uniqueMap.set(row.id, row);
      }
    });

    return Array.from(uniqueMap.values()).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      teacherId: row.teacherId,
      timeLimit: row.timeLimit,
      totalScore: row.totalScore,
      isPublished: !!row.isPublished,
      publishAt: row.publishAt ?? null,
      dueDate: row.dueDate ?? null,
      classId: row.classId ?? null,
      className: row.className ?? null,
      subjectName: row.subjectName ?? null,
      createdAt: row.createdAt,
      courseId: row.courseId ?? null,
      courseTitle: row.courseTitle ?? null,
      blockId: row.blockId ?? null
    }));
  }
}
