import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { AdminOverview } from '../../types';

const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await apiService.getAdminOverview();
        if (response.success) {
          setOverview(response.data);
        } else {
          setError(response.message || '대시보드 정보를 불러오지 못했습니다.');
        }
      } catch (err) {
        console.error(err);
        setError('대시보드 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || '대시보드 정보를 불러오지 못했습니다.'}
        </div>
      </div>
    );
  }

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <p className="text-gray-600">시스템 현황과 최근 활동을 한눈에 확인하세요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <DashboardCard title="총 학생 수" value={overview.stats.totalStudents} color="blue" />
        <DashboardCard title="총 강사 수" value={overview.stats.totalTeachers} color="green" />
        <DashboardCard title="총 강의 수" value={overview.stats.totalCourses} color="purple" />
        <DashboardCard title="승인 대기 강사" value={overview.stats.pendingTeachers} color="yellow" />
        <DashboardCard title="총 학부모 수" value={overview.stats.totalParents} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">최근 등록 사용자</h2>
          <div className="space-y-4">
            {overview.recentUsers.length === 0 && (
              <p className="text-sm text-gray-500">최근 등록된 사용자가 없습니다.</p>
            )}
            {overview.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">역할: {user.role}</p>
                </div>
                <div className="text-sm text-gray-500">{formatDateTime(user.createdAt)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">최근 생성된 강의</h2>
          <div className="space-y-4">
            {overview.recentCourses.length === 0 && (
              <p className="text-sm text-gray-500">최근 생성된 강의가 없습니다.</p>
            )}
            {overview.recentCourses.map((course) => (
              <div key={course.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                <p className="font-medium text-gray-900">{course.title}</p>
                <p className="text-sm text-gray-500">
                  담당자: {course.teacherName || '미배정'} · 생성일: {formatDateTime(course.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">최근 학습 활동</h2>
        <div className="space-y-4">
          {overview.recentActivities.length === 0 && (
            <p className="text-sm text-gray-500">최근 기록된 학습 활동이 없습니다.</p>
          )}
          {overview.recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0">
              <div>
                <p className="font-medium text-gray-900">{activity.activityType}</p>
                <p className="text-sm text-gray-500">학생: {activity.studentName || '알 수 없음'}</p>
              </div>
              <div className="text-sm text-gray-500">{formatDateTime(activity.createdAt)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const DashboardCard: React.FC<{ title: string; value: number; color: 'blue' | 'green' | 'purple' | 'yellow' | 'indigo' }> = ({ title, value, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
    indigo: 'text-indigo-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${colorMap[color]}`}>{value.toLocaleString()}</p>
    </div>
  );
};

export default AdminDashboard;
