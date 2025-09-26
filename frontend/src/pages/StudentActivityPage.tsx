import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { ActivityLog } from '../types';

const activityLabels: Record<ActivityLog['activityType'], string> = {
  video_watch: '동영상 시청',
  test_complete: '테스트 완료',
  question_ask: '질문 등록',
  login: '로그인'
};

const StudentActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await apiService.getMyActivityLogs(50);
        if (response.success) {
          setLogs(response.data || []);
        } else {
          setError(response.message || '활동 이력을 불러오지 못했습니다.');
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || '활동 이력을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">활동 이력을 불러오는 중...</div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 text-gray-600">
        <p>{error}</p>
        <Link to="/student/dashboard" className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
          대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">나의 활동 이력</h1>
        <p className="text-gray-600 mt-1">최근 순으로 최대 50개의 활동이 표시됩니다.</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">활동</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상세 정보</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-sm text-gray-500">기록된 활동이 없습니다.</td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{activityLabels[log.activityType]}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <pre className="bg-gray-50 rounded-md p-2 text-xs overflow-auto max-h-32">{JSON.stringify(log.metadata || {}, null, 2)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentActivityPage;
