import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Notification } from '../../types';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // 전역 알림 상태 변경 브로드캐스트 (대시보드 등에서 수신하여 데이터 갱신 트리거)
  const broadcastNotificationsUpdated = (count: number) => {
    try {
      window.dispatchEvent(new CustomEvent('app:notifications-updated', { detail: { unreadCount: count } }));
    } catch {
      // 안전 무시
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const response = await apiService.getUnreadNotificationCount();
      if (response.success) {
        const count = response.data?.count ?? response.data ?? 0;
        setUnreadCount(count);
        broadcastNotificationsUpdated(count);
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoadingNotifications(true);
      const response = await apiService.getNotifications();
      if (response.success) {
        setNotifications(response.data || []);
        const unread = (response.data || []).filter((item: Notification) => !item.isRead).length;
        setUnreadCount(unread);
        broadcastNotificationsUpdated(unread);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user || !isNotificationOpen) {
      return;
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotificationOpen, user?.id]);

  const handleNotificationToggle = async () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await apiService.markNotificationRead(id);
      if (response.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAll = async () => {
    try {
      const response = await apiService.markAllNotificationsRead();
      if (response.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'admin': return '관리자';
      case 'teacher': return '강사';
      case 'student': return '학생';
      case 'parent': return '학부모';
      default: return '사용자';
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">에이원 스터디링크</h1>
            </div>
            <nav className="ml-6 flex space-x-8">
              <Link 
                to={`/${user?.role}/dashboard`} 
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                대시보드
              </Link>
              {user?.role === 'student' && (
                <>
                  <Link 
                    to="/student/courses" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    강의
                  </Link>
                  <Link 
                    to="/student/tests" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    테스트
                  </Link>
                  <Link 
                    to="/student/calendar" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    캘린더
                  </Link>
                  <Link 
                    to="/student/qna" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Q&A
                  </Link>
                </>
              )}
              {user?.role === 'teacher' && (
                <>
                  <Link 
                    to="/teacher/courses" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    강의 관리
                  </Link>
                  <Link 
                    to="/teacher/students" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    학생 관리
                  </Link>
                  <Link 
                    to="/teacher/tests" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    테스트 관리
                  </Link>
                  <Link 
                    to="/teacher/reports" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    학습 리포트
                  </Link>
                  <Link 
                    to="/teacher/calendar" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    일정 관리
                  </Link>
                  <Link 
                    to="/teacher/qna" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Q&A 관리
                  </Link>
                </>
              )}
              {user?.role === 'parent' && (
                <>
                  <Link 
                    to="/parent/children" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    자녀 현황
                  </Link>
                  <Link 
                    to="/parent/calendar" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    캘린더
                  </Link>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link 
                    to="/admin/users" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    사용자 관리
                  </Link>
                  <Link 
                    to="/admin/academy-courses" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    학원/강의 관리
                  </Link>
                  <Link 
                    to="/admin/reports" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    리포트
                  </Link>
                  <Link 
                    to="/admin/settings" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    시스템 설정
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center">
            <div className="relative mr-4">
              <button
                type="button"
                onClick={handleNotificationToggle}
                className="relative inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="알림"
              >
                <span aria-hidden="true" className="text-lg">
                  🔔
                </span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-500 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {isNotificationOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">알림</h3>
                    <button
                      type="button"
                      onClick={handleMarkAll}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      모두 읽음 처리
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {loadingNotifications && (
                      <div className="px-4 py-3 text-sm text-gray-500">알림을 불러오는 중...</div>
                    )}
                    {!loadingNotifications && notifications.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500">새로운 알림이 없습니다.</div>
                    )}
                    {!loadingNotifications && notifications.map((notification) => (
                      <div key={notification.id} className="px-4 py-3 border-b border-gray-100 last:border-none">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                          </div>
                          {!notification.isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              읽음
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <div className="relative inline-block text-left">
                <div>
                  <button
                    type="button"
                    className="flex text-sm rounded-full focus:outline-none"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {(user?.name || user?.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                      {user?.name} ({getRoleDisplayName()})
                    </span>
                  </button>
                </div>
                {isMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Link
                        to={`/${user?.role}/profile`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        프로필
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
