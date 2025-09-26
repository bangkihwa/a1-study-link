import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { ParentChildSummary, StudentReportSummary } from '../types';

const toIsoDate = (date: Date) => date.toISOString().split('T')[0];

const getDefaultRange = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start: toIsoDate(thirtyDaysAgo), end: toIsoDate(today) };
};

const formatNumber = (value: number | null | undefined, options?: Intl.NumberFormatOptions) => {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('ko-KR', options).format(value);
};

const ParentReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaults = useMemo(() => getDefaultRange(), []);
  const [children, setChildren] = useState<ParentChildSummary[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [report, setReport] = useState<StudentReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChildren = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getParentChildren();
      if (!response.success) {
        throw new Error(response.message || '자녀 목록을 불러오지 못했습니다.');
      }
      const list: ParentChildSummary[] = response.data || [];
      setChildren(list);

      const initialId = searchParams.get('studentId');
      if (initialId) {
        const numericId = Number(initialId);
        if (!Number.isNaN(numericId) && list.some((child) => child.studentId === numericId)) {
          setSelectedChildId(numericId);
          return;
        }
      }

      if (list.length > 0) {
        setSelectedChildId(list[0].studentId);
        setSearchParams((params) => {
          params.set('studentId', String(list[0].studentId));
          return params;
        }, { replace: true });
      } else {
        setSelectedChildId(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '자녀 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchParams, setSearchParams]);

  const fetchReport = useCallback(async () => {
    if (!selectedChildId) {
      setReport(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getParentChildReport(selectedChildId, { startDate, endDate });
      if (!response.success) {
        throw new Error(response.message || '학습 리포트를 불러오지 못했습니다.');
      }
      setReport(response.data || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '학습 리포트를 불러오는 중 오류가 발생했습니다.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [selectedChildId, startDate, endDate]);

  useEffect(() => {
    loadChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchReport();
    }
  }, [selectedChildId, fetchReport]);

  const handleChildChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(value)) {
      setSelectedChildId(value);
      setSearchParams((params) => {
        params.set('studentId', String(value));
        return params;
      }, { replace: true });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetchReport();
  };

  const selectedChild = children.find((child) => child.studentId === selectedChildId);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">자녀 학습 리포트</h1>
        <p className="text-sm text-gray-600">자녀를 선택하고 기간을 지정해 학습 데이터를 확인하세요.</p>
      </header>

      {children.length === 0 ? (
        loading ? (
          <div className="min-h-[200px] flex items-center justify-center text-gray-600">자녀 정보를 불러오는 중...</div>
        ) : (
          <div className="min-h-[200px] flex flex-col items-center justify-center space-y-3 text-gray-600">
            <p>연동된 자녀 계정이 없습니다.</p>
            <p className="text-sm">학부모 계정에서 학생 고유번호를 연결해야 학습 리포트를 확인할 수 있습니다.</p>
          </div>
        )
      ) : (
        <>
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="child" className="block text-sm font-medium text-gray-700">자녀 선택</label>
              <select
                id="child"
                value={selectedChildId ?? ''}
                onChange={handleChildChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {children.map((child) => (
                  <option key={child.studentId} value={child.studentId}>
                    {child.studentName} ({child.studentNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
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
            <div>
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
            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                리포트 조회
              </button>
            </div>
          </form>

          {loading ? (
            <div className="min-h-[200px] flex items-center justify-center text-gray-600">학습 리포트를 불러오는 중...</div>
          ) : error ? (
            <div className="min-h-[200px] flex flex-col items-center justify-center space-y-3 text-gray-600">
              <p>{error}</p>
              <button
                type="button"
                onClick={fetchReport}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                다시 시도
              </button>
            </div>
          ) : report && selectedChild ? (
            <section className="space-y-6">
              <div className="bg-white rounded-lg shadow p-5 space-y-1">
                <h2 className="text-lg font-semibold text-gray-900">{selectedChild.studentName} 학생 학습 개요</h2>
                <p className="text-sm text-gray-600">{startDate} ~ {endDate}</p>
              </div>

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
                  <h3 className="text-lg font-semibold text-gray-900">테스트 활동</h3>
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
                  <h3 className="text-lg font-semibold text-gray-900">Q&A 활동</h3>
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
        </>
      )}
    </div>
  );
};

export default ParentReportsPage;
