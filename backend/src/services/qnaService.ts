import QnaModel, { QnaRecord } from '../models/qnaModel';
import { CourseModel } from '../models/courseModel';
import ClassModel from '../models/classModel';
import ActivityLogService from './activityLogService';
import { NotificationService } from './notificationService';
import { User } from '../types';

export class QnaService {
  static async createQuestion(options: { courseId: number; studentId: number; question: string; isPublic: boolean }): Promise<QnaRecord> {
    const id = await QnaModel.createQuestion({
      courseId: options.courseId,
      studentId: options.studentId,
      question: options.question,
      isPublic: options.isPublic
    });

    await ActivityLogService.log({
      userId: options.studentId,
      activityType: 'question_ask',
      relatedId: id,
      metadata: {
        courseId: options.courseId,
        question: options.question
      }
    });

    const created = await QnaModel.getById(id);
    return created!;
  }

  static async getQuestionById(id: number): Promise<QnaRecord | null> {
    return await QnaModel.getById(id);
  }

  static async getQuestionsByCourse(courseId: number, viewer?: Pick<User, 'id' | 'role'>): Promise<QnaRecord[]> {
    const questions = await QnaModel.getByCourse(courseId);

    if (!viewer) {
      return questions.filter((question) => question.isPublic);
    }

    if (viewer.role === 'admin') {
      return questions;
    }

    if (viewer.role === 'teacher') {
      const course = await CourseModel.findById(courseId, { onlyPublished: false });
      if (course) {
        if (course.teacherId === viewer.id) {
          return questions;
        }
        const classRecord = await ClassModel.findById(course.classId);
        if (classRecord?.teacherId === viewer.id) {
          return questions;
        }
      }
      return questions.filter((question) => question.isPublic);
    }

    if (viewer.role === 'student') {
      return questions.filter((question) => question.isPublic || question.studentId === viewer.id);
    }

    return questions.filter((question) => question.isPublic);
  }

  static async getQuestionsByStudent(studentId: number): Promise<QnaRecord[]> {
    return await QnaModel.getByStudent(studentId);
  }

  static async getQuestionsForTeacher(teacherId: number): Promise<QnaRecord[]> {
    return await QnaModel.getByTeacher(teacherId);
  }

  static async answerQuestion(options: { id: number; teacherId: number; answer: string }): Promise<QnaRecord> {
    const existing = await QnaModel.getById(options.id);
    if (!existing) {
      throw createServiceError('Question not found', 404);
    }

    await QnaModel.answerQuestion(options.id, {
      teacherId: options.teacherId,
      answer: options.answer
    });

    if (existing.studentId) {
      await NotificationService.createAnswerNotification(existing.studentId, existing.question, existing.courseId);
    }

    const updated = await QnaModel.getById(options.id);
    return updated!;
  }

  static async deleteQuestion(id: number): Promise<void> {
    await QnaModel.deleteQuestion(id);
  }
}

function createServiceError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

export default QnaService;
