import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Notification } from '../types';

const StudentNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [processingAll, setProcessingAll] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getNotifications();
      if (!response.success) {
        throw new Error(response.message || '알림을 불러오지 못했습니다.');
      }
      setNotifications(response.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '알림을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: number) => {
    setProcessingId(notificationId);
    try {
      const response = await apiService.markNotificationRead(notificationId);
      if (!response.success) {
        throw new Error(response.message || '알림을 읽음 처리하지 못했습니다.');
      }
      await loadNotifications();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '알림을 읽음 처리하는 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAll = async () => {
    setProcessingAll(true);
    try {
      const response = await apiService.markAllNotificationsRead();
      if (!response.success) {
        throw new Error(response.message || '알림을 모두 읽음 처리하지 못했습니다.');
      }
      await loadNotifications();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '알림을 모두 읽음 처리하는 중 오류가 발생했습니다.');
    } finally {
      setProcessingAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">알림 센터</h1>
          <p className="text-sm text-gray-600">새로운 과제, 답변, 공지사항 등을 확인하세요.</p>
        </div>
        <button
          type="button"
          onClick={handleMarkAll}
          disabled={processingAll || notifications.length === 0}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processingAll ? '처리 중...' : '모두 읽음 처리'}
        </button>
      </header>

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center text-gray-600">알림을 불러오는 중...</div>
      ) : error ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center space-y-3 text-gray-600">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadNotifications}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="min-h-[200px] flex items-center justify-center text-gray-600">현재 확인할 알림이 없습니다.</div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {notifications.map((notification) => (
            <article key={notification.id} className={`p-4 ${notification.isRead ? 'bg-white' : 'bg-blue-50/60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{notification.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  <p className="mt-2 text-xs text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
                {!notification.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(notification.id)}
                    disabled={processingId === notification.id}
                    className="px-3 py-1 text-xs font-medium border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processingId === notification.id ? '처리 중...' : '읽음'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNotificationsPage;
