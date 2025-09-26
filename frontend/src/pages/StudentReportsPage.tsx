import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api';
import { StudentReportSummary } from '../types';

const formatNumber = (value: number | null | undefined, options?: Intl.NumberFormatOptions) => {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('ko-KR', options).format(value);
};

const getDefaultDates = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const toIso = (date: Date) => date.toISOString().split('T')[0];
  return {
    start: toIso(thirtyDaysAgo),
    end: toIso(today)
  };
};

const StudentReportsPage: React.FC = () => {
  const defaults = useMemo(() => getDefaultDates(), []);
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [report, setReport] = useState<StudentReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchReport = useCallback(async (params?: { startDate?: string; endDate?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getMyStudentReport(params);
      if (!response.success) {
        throw new Error(response.message || '리포트를 불러오지 못했습니다.');
      }
      setReport(response.data || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '리포트를 불러오는 중 오류가 발생했습니다.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport({ startDate, endDate });
  }, [fetchReport, startDate, endDate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    await fetchReport({ startDate, endDate });
    setSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">나의 학습 리포트</h1>
        <p className="text-sm text-gray-600">기간을 선택해 최근 학습 활동과 성과를 확인하세요.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">시작일</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">종료일</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            min={startDate}
            max={defaults.end}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {submitting ? '불러오는 중...' : '리포트 새로고침'}
        </button>
      </form>

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center text-gray-600">리포트를 불러오는 중...</div>
      ) : error ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center space-y-3 text-gray-600">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => fetchReport({ startDate, endDate })}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : report ? (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">학습한 동영상</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(report.videoProgress.totalVideos)}</p>
              <p className="text-xs text-gray-500 mt-1">완료 {formatNumber(report.videoProgress.completedVideos)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">평균 진도율</p>
              <p className="text-2xl font-semibold text-blue-600">{formatNumber(report.videoProgress.averageProgress, { maximumFractionDigits: 1 })}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">평균 테스트 점수</p>
              <p className="text-2xl font-semibold text-green-600">{formatNumber(report.testSubmissions.averageScore, { maximumFractionDigits: 1 })}점</p>
              <p className="text-xs text-gray-500 mt-1">응시 {formatNumber(report.testSubmissions.totalTests)}회</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">로그인 횟수</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(report.loginActivity.totalLogins)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg shadow space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">테스트 활동</h2>
              <div className="flex items-center justify-between text-sm">
                <span>총 응시 횟수</span>
                <span className="font-medium">{formatNumber(report.testSubmissions.totalTests)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>채점 완료</span>
                <span className="font-medium">{formatNumber(report.testSubmissions.gradedTests)}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Q&A 활동</h2>
              <div className="flex items-center justify-between text-sm">
                <span>등록한 질문</span>
                <span className="font-medium">{formatNumber(report.questions.totalQuestions)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>답변 완료</span>
                <span className="font-medium">{formatNumber(report.questions.answeredQuestions)}</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="min-h-[200px] flex items-center justify-center text-gray-600">표시할 리포트가 없습니다.</div>
      )}
    </div>
  );
};

export default StudentReportsPage;
