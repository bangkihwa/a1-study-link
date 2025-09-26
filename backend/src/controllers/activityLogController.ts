import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import ActivityLogService from '../services/activityLogService';
import { AuthRequest } from '../types';

export class ActivityLogController {
  static getMyLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const logs = await ActivityLogService.getRecentForUser(req.user.id, limit);

    res.status(200).json({
      success: true,
      data: logs,
      message: 'Activity logs retrieved successfully'
    });
  });

  static getLogs = asyncHandler(async (req: Request, res: Response) => {
    const { userId, activityType, limit } = req.query;

    const logs = await ActivityLogService.getLogs({
      userId: userId ? parseInt(userId as string, 10) : undefined,
      activityType: activityType as any,
      limit: limit ? parseInt(limit as string, 10) : undefined
    });

    res.status(200).json({
      success: true,
      data: logs,
      message: 'Activity logs retrieved successfully'
    });
  });
}

export default ActivityLogController;
