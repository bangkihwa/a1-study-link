import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { AdminActivityReport } from '../../types';

const AdminReports: React.FC = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [report, setReport] = useState<AdminActivityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (range?: { startDate: string; endDate: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getAdminActivityReport(range || { startDate, endDate });
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.message || '리포트를 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('리포트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchReport({ startDate, endDate });
  };

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">학습 활동 리포트</h1>
        <p className="text-gray-600">기간별 학습 활동 추이를 확인하고, 어떤 활동이 활발했는지 분석해보세요.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            리포트 갱신
          </button>
          <button
            type="button"
            onClick={() => {
              const resetStart = thirtyDaysAgo.toISOString().split('T')[0];
              const resetEnd = today.toISOString().split('T')[0];
              setStartDate(resetStart);
              setEndDate(resetEnd);
              fetchReport({ startDate: resetStart, endDate: resetEnd });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            최근 30일
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-sm text-gray-500">
          리포트를 불러오는 중...
        </div>
      )}

      {!loading && report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">일별 활동 통계</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <TableHeader>날짜</TableHeader>
                    <TableHeader>총 활동 수</TableHeader>
                    <TableHeader>활성 학생 수</TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.dailyActivity.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-sm text-gray-500">해당 기간의 활동 데이터가 없습니다.</td>
                    </tr>
                  )}
                  {report.dailyActivity.map((day) => (
                    <tr key={day.date}>
                      <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                      <TableCell>{day.totalActivities.toLocaleString()}</TableCell>
                      <TableCell>{day.activeStudents.toLocaleString()}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">활동 유형별 통계</h2>
            <div className="space-y-3">
              {report.activityByType.length === 0 && (
                <p className="text-sm text-gray-500">활동 유형 데이터가 없습니다.</p>
              )}
              {report.activityByType.map((item) => (
                <div key={item.activityType} className="flex items-center justify-between border border-gray-100 rounded-md px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{translateActivityType(item.activityType)}</p>
                    <p className="text-xs text-gray-500">코드: {item.activityType}</p>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{item.count.toLocaleString()}회</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
    {children}
  </th>
);

const TableCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{children}</td>
);

const translateActivityType = (type: string) => {
  switch (type) {
    case 'video_watch':
      return '동영상 시청';
    case 'test_complete':
      return '테스트 완료';
    case 'question_ask':
      return '질문 등록';
    case 'login':
      return '로그인';
    default:
      return type;
  }
};

export default AdminReports;
