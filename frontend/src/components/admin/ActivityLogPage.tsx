import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { ActivityLog } from '../../types';

const activityLabels: Record<ActivityLog['activityType'], string> = {
  video_watch: '동영상 시청',
  test_complete: '테스트 완료',
  question_ask: '질문 등록',
  login: '로그인'
};

const AdminActivityLogPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filters, setFilters] = useState<{ userId: string; activityType: string; limit: string }>({
    userId: '',
    activityType: '',
    limit: '50'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filters.userId) params.userId = Number(filters.userId);
      if (filters.activityType) params.activityType = filters.activityType;
      if (filters.limit) params.limit = Number(filters.limit);

      const response = await apiService.getActivityLogs(params);
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

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchLogs();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">활동 로그 관리</h1>
        <p className="text-gray-600 mt-1">필터를 사용하여 특정 사용자 또는 활동 유형을 조회할 수 있습니다.</p>
      </div>

      <form className="bg-white rounded-lg shadow p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">사용자 ID</label>
          <input
            type="number"
            min={1}
            value={filters.userId}
            onChange={(e) => handleChange('userId', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="예: 1024"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">활동 유형</label>
          <select
            value={filters.activityType}
            onChange={(e) => handleChange('activityType', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">전체</option>
            <option value="login">로그인</option>
            <option value="video_watch">동영상 시청</option>
            <option value="test_complete">테스트 완료</option>
            <option value="question_ask">질문 등록</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">최대 개수</label>
          <input
            type="number"
            min={10}
            max={200}
            step={10}
            value={filters.limit}
            onChange={(e) => handleChange('limit', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading}
          >
            조회
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자 ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">활동</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상세 정보</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-gray-500">활동 이력을 불러오는 중...</td>
              </tr>
            )}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-gray-500">검색 조건에 해당하는 로그가 없습니다.</td>
              </tr>
            )}
            {!loading && logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{log.userId}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{activityLabels[log.activityType] || log.activityType}</td>
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

export default AdminActivityLogPage;
