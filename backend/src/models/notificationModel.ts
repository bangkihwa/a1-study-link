import { query } from '../config/database';
import { Notification } from '../types';

export class NotificationModel {
  // 알림 생성
  static async create(notificationData: {
    userId: number;
    type: string;
    title: string;
    message: string;
    relatedId?: number;
  }): Promise<number> {
    const result = await query(
      'INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?)',
      [
        notificationData.userId,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        notificationData.relatedId || null
      ]
    ) as any;
    
    return result.insertId;
  }

  // 사용자의 알림 목록 조회
  static async getNotificationsByUser(userId: number, limit: number = 20): Promise<Notification[]> {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
    const sql = `SELECT id, user_id as userId, type, title, message, is_read as isRead, related_id as relatedId, created_at as createdAt
       FROM notifications 
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ${safeLimit}`;
    const notifications = await query(sql, [userId]) as Notification[];

    return notifications;
  }

  // 알림 읽음 처리
  static async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    const result = await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    ) as any;
    
    return result.affectedRows > 0;
  }

  // 사용자의 읽지 않은 알림 수 조회
  static async getUnreadCount(userId: number): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    ) as any[];
    
    return result[0].count;
  }

  // 사용자의 모든 알림 읽음 처리
  static async markAllAsRead(userId: number): Promise<number> {
    const result = await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    ) as any;
    
    return result.affectedRows;
  }
}
