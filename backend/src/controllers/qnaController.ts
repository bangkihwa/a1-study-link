import { Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest } from '../types';
import QnaService from '../services/qnaService';

export class QnaController {
  static createQuestion = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    if (req.user.role !== 'student') {
      throw createError('Only students can ask questions', 403);
    }

    const { courseId, question, isPublic } = req.body;
    const courseIdNum = parseInt(courseId, 10);

    if (isNaN(courseIdNum) || !question || typeof question !== 'string') {
      throw createError('Valid courseId and question are required', 400);
    }

    const created = await QnaService.createQuestion({
      courseId: courseIdNum,
      studentId: req.user.id,
      question: question.trim(),
      isPublic: typeof isPublic === 'boolean' ? isPublic : true
    });

    res.status(201).json({
      success: true,
      data: created,
      message: 'Question submitted successfully'
    });
  });

  static getQuestionsByCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
    const courseId = parseInt(req.params.courseId, 10);
    if (isNaN(courseId)) {
      throw createError('Invalid course ID', 400);
    }

    const questions = await QnaService.getQuestionsByCourse(courseId, req.user ? { id: req.user.id, role: req.user.role } : undefined);
    res.status(200).json({
      success: true,
      data: questions,
      message: 'Questions retrieved successfully'
    });
  });

  static getMyQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    if (req.user.role !== 'student') {
      throw createError('Only students can view their questions', 403);
    }

    const questions = await QnaService.getQuestionsByStudent(req.user.id);
    res.status(200).json({
      success: true,
      data: questions,
      message: 'Questions retrieved successfully'
    });
  });

  static getTeacherQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw createError('Only teachers or admins can view assigned questions', 403);
    }

    const questions = await QnaService.getQuestionsForTeacher(req.user.id);
    res.status(200).json({
      success: true,
      data: questions,
      message: 'Questions retrieved successfully'
    });
  });

  static answerQuestion = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw createError('Only teachers or admins can answer questions', 403);
    }

    const questionId = parseInt(req.params.id, 10);
    if (isNaN(questionId)) {
      throw createError('Invalid question ID', 400);
    }

    const { answer } = req.body;
    if (!answer || typeof answer !== 'string') {
      throw createError('Answer content is required', 400);
    }

    const updated = await QnaService.answerQuestion({
      id: questionId,
      teacherId: req.user.id,
      answer: answer.trim()
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Answer submitted successfully'
    });
  });

  static deleteQuestion = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    if (req.user.role !== 'admin') {
      throw createError('Only administrators can delete questions', 403);
    }

    const questionId = parseInt(req.params.id, 10);
    if (isNaN(questionId)) {
      throw createError('Invalid question ID', 400);
    }

    await QnaService.deleteQuestion(questionId);
    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  });
}

export default QnaController;
