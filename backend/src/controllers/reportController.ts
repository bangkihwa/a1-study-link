import { Response, NextFunction } from 'express';
import { ReportService } from '../services/reportService';
import { createError, asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../types';

export class ReportController {
  // 학생의 학습 리포트 조회
  static getStudentReport = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // 학생은 자신의 리포트만 조회 가능
    // 교사와 관리자는 다른 사용자의 리포트 조회 가능
    let studentId: number;
    const { studentId: paramStudentId } = req.params;
    
    if (req.user.role === 'student') {
      // 학생은 자신의 리포트만 조회 가능
      studentId = req.user.id;
    } else if (req.user.role === 'teacher' || req.user.role === 'admin') {
      if (!paramStudentId) {
        throw createError('Student ID parameter is required', 400);
      }
      studentId = parseInt(paramStudentId, 10);
    } else {
      throw createError('Invalid user role', 403);
    }

    if (isNaN(studentId)) {
      throw createError('Invalid student ID', 400);
    }

    // 날짜 파라미터 처리
    let { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    
    // 기본값 설정 (최근 30일)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    if (!startDate) {
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
    }
    
    if (!endDate) {
      endDate = today.toISOString().split('T')[0];
    }

    // 날짜 유효성 검사
    const dateValidation = ReportService.validateDateRange(startDate, endDate);
    if (!dateValidation.isValid) {
      throw createError(dateValidation.error || 'Invalid date range', 400);
    }

    const report = await ReportService.getStudentReport(studentId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: report,
      message: 'Student report retrieved successfully'
    });
  });

  // 반별 학습 리포트 조회 (교사용)
  static getClassReport = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // 교사와 관리자만 조회 가능
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw createError('Insufficient permissions to view class report', 403);
    }

    const { classId } = req.params;
    const classIdNum = parseInt(classId, 10);

    if (isNaN(classIdNum)) {
      throw createError('Invalid class ID', 400);
    }

    // 날짜 파라미터 처리
    let { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    
    // 기본값 설정 (최근 30일)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    if (!startDate) {
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
    }
    
    if (!endDate) {
      endDate = today.toISOString().split('T')[0];
    }

    // 날짜 유효성 검사
    const dateValidation = ReportService.validateDateRange(startDate, endDate);
    if (!dateValidation.isValid) {
      throw createError(dateValidation.error || 'Invalid date range', 400);
    }

    const report = await ReportService.getClassReport(classIdNum, startDate, endDate);

    res.status(200).json({
      success: true,
      data: report,
      message: 'Class report retrieved successfully'
    });
  });

  // 전체 학습 활동 로그 조회 (관리자용)
  static getAdminActivityReport = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // 관리자만 조회 가능
    if (req.user.role !== 'admin') {
      throw createError('Insufficient permissions to view admin activity report', 403);
    }

    // 날짜 파라미터 처리
    let { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    
    // 기본값 설정 (최근 30일)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    if (!startDate) {
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
    }
    
    if (!endDate) {
      endDate = today.toISOString().split('T')[0];
    }

    // 날짜 유효성 검사
    const dateValidation = ReportService.validateDateRange(startDate, endDate);
    if (!dateValidation.isValid) {
      throw createError(dateValidation.error || 'Invalid date range', 400);
    }

    const report = await ReportService.getAdminActivityReport(startDate, endDate);

    res.status(200).json({
      success: true,
      data: report,
      message: 'Admin activity report retrieved successfully'
    });
  });
}
