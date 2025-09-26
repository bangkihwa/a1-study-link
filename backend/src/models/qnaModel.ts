import { query } from '../config/database';

export interface QnaRecord {
  id: number;
  courseId: number;
  studentId: number;
  question: string;
  isPublic: boolean;
  answer?: string | null;
  teacherId?: number | null;
  answeredAt?: Date | null;
  createdAt: Date;
  studentName?: string;
  teacherName?: string;
  courseTitle?: string;
}

export class QnaModel {
  static async createQuestion(data: { courseId: number; studentId: number; question: string; isPublic: boolean }): Promise<number> {
    const result = await query(
      `INSERT INTO qna (course_id, student_id, question, is_public) VALUES (?, ?, ?, ?)` ,
      [data.courseId, data.studentId, data.question, data.isPublic]
    ) as any;

    return result.insertId;
  }

  static async getById(id: number): Promise<QnaRecord | null> {
    const rows = await query(
      `SELECT q.id,
              q.course_id as courseId,
              q.student_id as studentId,
              q.question,
              q.is_public as isPublic,
              q.answer,
              q.teacher_id as teacherId,
              q.answered_at as answeredAt,
              q.created_at as createdAt,
              us.name as studentName,
              ut.name as teacherName
       FROM qna q
       LEFT JOIN users us ON q.student_id = us.id
       LEFT JOIN users ut ON q.teacher_id = ut.id
       WHERE q.id = ?
       LIMIT 1`,
      [id]
    ) as QnaRecord[];

    return rows.length ? rows[0] : null;
  }

  static async getByCourse(courseId: number): Promise<QnaRecord[]> {
    const rows = await query(
      `SELECT q.id,
              q.course_id as courseId,
              q.student_id as studentId,
              q.question,
              q.is_public as isPublic,
              q.answer,
              q.teacher_id as teacherId,
              q.answered_at as answeredAt,
              q.created_at as createdAt,
              us.name as studentName,
              ut.name as teacherName
       FROM qna q
       LEFT JOIN users us ON q.student_id = us.id
       LEFT JOIN users ut ON q.teacher_id = ut.id
       WHERE q.course_id = ?
       ORDER BY q.created_at DESC`,
      [courseId]
    ) as QnaRecord[];

    return rows;
  }

  static async getByStudent(studentId: number): Promise<QnaRecord[]> {
    const rows = await query(
      `SELECT q.id,
              q.course_id as courseId,
              q.student_id as studentId,
              q.question,
              q.is_public as isPublic,
              q.answer,
              q.teacher_id as teacherId,
              q.answered_at as answeredAt,
              q.created_at as createdAt,
              ut.name as teacherName
       FROM qna q
       LEFT JOIN users ut ON q.teacher_id = ut.id
       WHERE q.student_id = ?
       ORDER BY q.created_at DESC`,
      [studentId]
    ) as QnaRecord[];

    return rows;
  }

  static async getByTeacher(teacherId: number): Promise<QnaRecord[]> {
    const rows = await query(
      `SELECT q.id,
              q.course_id as courseId,
              q.student_id as studentId,
              q.question,
              q.is_public as isPublic,
              q.answer,
              q.teacher_id as teacherId,
              q.answered_at as answeredAt,
              q.created_at as createdAt,
              us.name as studentName,
              c.title as courseTitle
       FROM qna q
       JOIN courses c ON q.course_id = c.id
       LEFT JOIN users us ON q.student_id = us.id
       WHERE c.teacher_id = ?
       ORDER BY q.created_at DESC`,
      [teacherId]
    ) as any[];

    return rows;
  }

  static async answerQuestion(id: number, data: { answer: string; teacherId: number }): Promise<void> {
    await query(
      `UPDATE qna
       SET answer = ?, teacher_id = ?, answered_at = NOW()
       WHERE id = ?`,
      [data.answer, data.teacherId, id]
    );
  }

  static async deleteQuestion(id: number): Promise<void> {
    await query('DELETE FROM qna WHERE id = ?', [id]);
  }

  static async deleteByCourse(courseId: number): Promise<void> {
    await query('DELETE FROM qna WHERE course_id = ?', [courseId]);
  }
}

export default QnaModel;
