import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'admin': return '관리자';
      case 'teacher': return '강사';
      case 'student': return '학생';
      case 'parent': return '학부모';
      default: return '사용자';
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const getMenuItems = () => {
    switch (user?.role) {
      case 'student':
        return [
          { name: '대시보드', path: '/student/dashboard' },
          { name: '강의', path: '/student/courses' },
          { name: '테스트', path: '/student/tests' },
          { name: '캘린더', path: '/student/calendar' },
          { name: '학습 리포트', path: '/student/reports' },
          { name: '알림', path: '/student/notifications' },
          { name: '활동 이력', path: '/student/activity' }
        ];
      case 'teacher':
        return [
          { name: '대시보드', path: '/teacher/dashboard' },
          { name: '강의 관리', path: '/teacher/courses' },
          { name: '새 강의 만들기', path: '/teacher/courses/new' },
          { name: '테스트 관리', path: '/teacher/tests' },
          { name: '학생 관리', path: '/teacher/students' },
          { name: '학습 리포트', path: '/teacher/reports' },
          { name: '일정 관리', path: '/teacher/calendar' },
        ];
      case 'parent':
        return [
          { name: '대시보드', path: '/parent/dashboard' },
          { name: '자녀 현황', path: '/parent/children' },
          { name: '캘린더', path: '/parent/calendar' },
          { name: '학습 리포트', path: '/parent/reports' },
          { name: '알림', path: '/parent/notifications' },
        ];
      case 'admin':
        return [
          { name: '대시보드', path: '/admin/dashboard' },
          { name: '사용자 관리', path: '/admin/users' },
          { name: '학원/강의 관리', path: '/admin/academy-courses' },
          { name: '리포트', path: '/admin/reports' },
          { name: '활동 로그', path: '/admin/activity-log' },
          { name: '시스템 설정', path: '/admin/settings' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="flex h-full min-h-[calc(100vh-8rem)] flex-col rounded-2xl bg-white/95 shadow-sm ring-1 ring-gray-100 backdrop-blur">
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
          {(user?.name || user?.username || '?').charAt(0).toUpperCase()}
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
          <div className="text-xs text-gray-500">{getRoleDisplayName()}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              isActive(item.path)
                ? 'bg-blue-100 text-blue-900 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
