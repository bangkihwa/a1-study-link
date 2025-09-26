import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middlewares/auth';

export const notificationRoutes = Router();

// 사용자의 알림 목록 조회
notificationRoutes.get('/', authenticateToken, NotificationController.getNotifications);

// 알림 읽음 처리
notificationRoutes.put('/:id/read', authenticateToken, NotificationController.markAsRead);

// 사용자의 읽지 않은 알림 수 조회
notificationRoutes.get('/unread-count', authenticateToken, NotificationController.getUnreadCount);

// 사용자의 모든 알림 읽음 처리
notificationRoutes.put('/read-all', authenticateToken, NotificationController.markAllAsRead);