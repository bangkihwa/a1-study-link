import { Response, NextFunction } from 'express';
import { VideoService } from '../services/videoService';
import { createError, asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../types';

export class VideoController {
  // 동영상 진행 상황 업데이트
  static updateProgress = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // 학생만 동영상 진행 상황 업데이트 가능
    if (req.user.role !== 'student') {
      throw createError('Only students can update video progress', 403);
    }

    const { videoBlockId, watchedDuration, totalDuration } = req.body;

    // 유효성 검사
    if (!videoBlockId || typeof videoBlockId !== 'number') {
      throw createError('Valid videoBlockId is required', 400);
    }

    if (typeof watchedDuration !== 'number' || watchedDuration < 0) {
      throw createError('Valid watchedDuration is required', 400);
    }

    if (typeof totalDuration !== 'number' || totalDuration <= 0) {
      throw createError('Valid totalDuration is required', 400);
    }

    const normalizedTotal = Math.max(1, Math.round(totalDuration));
    const normalizedWatched = Math.max(0, Math.min(Math.round(watchedDuration), normalizedTotal));

    const progress = await VideoService.updateProgress({
      studentId: req.user.id,
      videoBlockId,
      watchedDuration: normalizedWatched,
      totalDuration: normalizedTotal
    });

    res.status(200).json({
      success: true,
      data: progress,
      message: 'Video progress updated successfully'
    });
  });

  // 특정 학생의 모든 동영상 진행 상황 조회
  static getStudentProgress = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // 학생은 자신의 진행 상황만 조회 가능
    // 교사와 관리자는 studentId 파라미터가 반드시 필요
    let studentId: number;
    const { studentId: paramStudentId } = req.params;

    if (req.user.role === 'student') {
      studentId = req.user.id;
    } else if (req.user.role === 'teacher' || req.user.role === 'admin') {
      if (!paramStudentId) {
        throw createError('Student ID parameter is required', 400);
      }

      studentId = parseInt(paramStudentId, 10);

      if (isNaN(studentId)) {
        throw createError('Invalid student ID', 400);
      }
    } else {
      throw createError('Invalid user role', 403);
    }

    const progress = await VideoService.getStudentProgress(studentId);

    res.status(200).json({
      success: true,
      data: progress,
      message: 'Video progress retrieved successfully'
    });
  });

  // 특정 강의의 모든 동영상 진행 상황 조회 (교사용)
  static getCourseVideoProgress = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // 교사와 관리자만 조회 가능
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw createError('Insufficient permissions to view course video progress', 403);
    }

    const { courseId } = req.params;
    const courseIdNum = parseInt(courseId, 10);

    if (isNaN(courseIdNum)) {
      throw createError('Invalid course ID', 400);
    }

    // 이 부분은 실제 구현에서는 추가적인 검증이 필요함
    // 예: courseId가 유효한지, user가 해당 강의의 소유자인지 확인 등

    const progress = await VideoService.getCourseVideoProgress(courseIdNum);

    res.status(200).json({
      success: true,
      data: progress,
      message: 'Course video progress retrieved successfully'
    });
  });

  static getCourseVideoSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw createError('Insufficient permissions to view course video summary', 403);
    }

    const { courseId } = req.params;
    const courseIdNum = parseInt(courseId, 10);

    if (isNaN(courseIdNum)) {
      throw createError('Invalid course ID', 400);
    }

    const summary = await VideoService.getCourseVideoSummary(courseIdNum);

    res.status(200).json({
      success: true,
      data: summary,
      message: 'Course video summary retrieved successfully'
    });
  });

  static getTeacherCourseProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    let teacherId: number;

    if (req.user.role === 'teacher') {
      teacherId = req.user.id;
    } else if (req.user.role === 'admin') {
      const { teacherId: queryTeacherId } = req.query;
      if (!queryTeacherId) {
        throw createError('teacherId query parameter is required for administrators', 400);
      }
      teacherId = parseInt(queryTeacherId as string, 10);
      if (isNaN(teacherId)) {
        throw createError('Invalid teacher ID', 400);
      }
    } else {
      throw createError('Insufficient permissions to view teacher progress overview', 403);
    }

    const progress = await VideoService.getTeacherCourseVideoProgress(teacherId);

    res.status(200).json({
      success: true,
      data: progress,
      message: 'Teacher course video progress retrieved successfully'
    });
  });

  // 특정 학생의 특정 강의 동영상 진행 상황 조회
  static getStudentCourseProgress = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { studentId, courseId } = req.params;
    const studentIdNum = parseInt(studentId, 10);
    const courseIdNum = parseInt(courseId, 10);

    if (isNaN(studentIdNum) || isNaN(courseIdNum)) {
      throw createError('Invalid student ID or course ID', 400);
    }

    // 권한 확인
    if (req.user.role === 'student' && req.user.id !== studentIdNum) {
      throw createError('Insufficient permissions to view other student\'s progress', 403);
    }

    // 이 부분은 실제 구현에서는 추가적인 검증이 필요함
    // 예: courseId가 유효한지, user가 해당 강의에 접근할 수 있는지 확인 등

    const progress = await VideoService.getStudentCourseProgress(studentIdNum, courseIdNum);

    res.status(200).json({
      success: true,
      data: progress,
      message: 'Student course video progress retrieved successfully'
    });
  });

  // 현재 사용자의 특정 블록 진행 상황 조회
  static getCurrentBlockProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const blockId = parseInt(req.params.blockId, 10);
    if (isNaN(blockId)) {
      throw createError('Invalid block ID', 400);
    }

    const progress = await VideoService.getProgress(req.user.id, blockId);

    res.status(200).json({
      success: true,
      data: progress,
      message: 'Video progress retrieved successfully'
    });
  });
}
