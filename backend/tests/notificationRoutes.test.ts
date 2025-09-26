import { NotificationService } from '../src/services/notificationService';
import { NotificationController } from '../src/controllers/notificationController';

jest.mock('../src/services/notificationService', () => ({
  NotificationService: {
    getNotificationsByUser: jest.fn(),
    markAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
    markAllAsRead: jest.fn()
  }
}));

const mockedNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;

const createMockResponse = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return {
    res: { status } as unknown as any,
    status,
    json
  };
};

describe('Notification routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns notifications for current user', async () => {
    mockedNotificationService.getNotificationsByUser.mockResolvedValueOnce([
      {
        id: 1,
        userId: 202,
        type: 'grade',
        title: '테스트 결과 안내',
        message: '모의고사 채점 결과를 확인하세요.',
        isRead: false,
        createdAt: new Date()
      }
    ] as any);

    const { res, status, json } = createMockResponse();
    const next = jest.fn();

    await NotificationController.getNotifications(
      {
        user: {
          id: 202,
          username: 'student_user',
          role: 'student',
          name: '학생 사용자',
          isApproved: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        query: {}
      } as any,
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(mockedNotificationService.getNotificationsByUser).toHaveBeenCalledWith(202, 20);
    expect(status).toHaveBeenCalledWith(200);
    const payload = json.mock.calls[0][0];
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].title).toBe('테스트 결과 안내');
  });

  it('marks notification as read', async () => {
    mockedNotificationService.markAsRead.mockResolvedValueOnce(true);

    const { res, status, json } = createMockResponse();
    const next = jest.fn();

    await NotificationController.markAsRead(
      {
        params: { id: '12' },
        user: {
          id: 202,
          username: 'student_user',
          role: 'student',
          name: '학생 사용자',
          isApproved: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any,
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(mockedNotificationService.markAsRead).toHaveBeenCalledWith(12, 202);
    expect(status).toHaveBeenCalledWith(200);
    const payload = json.mock.calls[0][0];
    expect(payload.success).toBe(true);
  });

  it('passes limit query to service when fetching notifications', async () => {
    mockedNotificationService.getNotificationsByUser.mockResolvedValueOnce([] as any);

    const { res, status, json } = createMockResponse();
    const next = jest.fn();

    await NotificationController.getNotifications(
      {
        user: {
          id: 303,
          username: 'student_user',
          role: 'student',
          name: '학생 사용자',
          isApproved: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        query: { limit: '5' }
      } as any,
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(mockedNotificationService.getNotificationsByUser).toHaveBeenCalledWith(303, 5);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalled();
  });

  it('returns unread count for current user', async () => {
    mockedNotificationService.getUnreadCount.mockResolvedValueOnce(3);

    const { res, status, json } = createMockResponse();
    const next = jest.fn();

    await NotificationController.getUnreadCount(
      {
        user: {
          id: 404,
          username: 'teacher_user',
          role: 'teacher',
          name: '교사 사용자',
          isApproved: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any,
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(mockedNotificationService.getUnreadCount).toHaveBeenCalledWith(404);
    expect(status).toHaveBeenCalledWith(200);
    const payload = json.mock.calls[0][0];
    expect(payload.data.count).toBe(3);
  });

  it('marks all notifications as read and returns affected count', async () => {
    mockedNotificationService.markAllAsRead.mockResolvedValueOnce(7);

    const { res, status, json } = createMockResponse();
    const next = jest.fn();

    await NotificationController.markAllAsRead(
      {
        user: {
          id: 505,
          username: 'parent_user',
          role: 'parent',
          name: '학부모 사용자',
          isApproved: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any,
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(mockedNotificationService.markAllAsRead).toHaveBeenCalledWith(505);
    expect(status).toHaveBeenCalledWith(200);
    const payload = json.mock.calls[0][0];
    expect(payload.data.count).toBe(7);
  });
});
