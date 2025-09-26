import { Response } from 'express';
import { ParentService } from '../services/parentService';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest } from '../types';
import { ReportService } from '../services/reportService';

export const getChildren = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const children = await ParentService.getLinkedChildren(req.user.id);

  res.status(200).json({
    success: true,
    data: children,
    message: 'Linked children retrieved successfully'
  });
});

export const getChildReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { studentId: studentParamId } = req.params;
  const studentId = parseInt(studentParamId, 10);

  if (Number.isNaN(studentId)) {
    throw createError('Invalid student ID', 400);
  }

  let { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (!startDate) {
    startDate = thirtyDaysAgo.toISOString().split('T')[0];
  }

  if (!endDate) {
    endDate = today.toISOString().split('T')[0];
  }

  const validation = ReportService.validateDateRange(startDate, endDate);
  if (!validation.isValid) {
    throw createError(validation.error || 'Invalid date range', 400);
  }

  try {
    const report = await ParentService.getChildReport(req.user.id, studentId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: report,
      message: 'Student report retrieved successfully'
    });
  } catch (error: any) {
    if (error.message === 'Access denied to student report') {
      throw createError('You do not have permission to view this student report', 403);
    }
    throw error;
  }
});
