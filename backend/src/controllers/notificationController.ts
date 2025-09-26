import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService';
import { createError, asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../types';

export class NotificationController {
  // 사용자의 알림 목록 조회
  static getNotifications = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { limit } = req.query;
    let limitNum = 20;
    if (typeof limit === 'string') {
      const parsed = parseInt(limit, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        limitNum = parsed;
      }
    }

    const notifications = await NotificationService.getNotificationsByUser(req.user.id, limitNum);

    res.status(200).json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully'
    });
  });

  // 알림 읽음 처리
  static markAsRead = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;
    const notificationId = parseInt(id, 10);

    if (isNaN(notificationId)) {
      throw createError('Invalid notification ID', 400);
    }

    const success = await NotificationService.markAsRead(notificationId, req.user.id);

    if (!success) {
      throw createError('Notification not found or access denied', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  });

  // 사용자의 읽지 않은 알림 수 조회
  static getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const count = await NotificationService.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      data: { count },
      message: 'Unread notification count retrieved successfully'
    });
  });

  // 사용자의 모든 알림 읽음 처리
  static markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const count = await NotificationService.markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      data: { count },
      message: 'All notifications marked as read'
    });
  });
}
