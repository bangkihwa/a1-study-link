import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { StudentTestSummary } from '../types';

const StudentTestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<StudentTestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTests();
      if (response.success) {
        setTests(response.data || []);
      } else {
        throw new Error(response.message || '응시 가능한 테스트를 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '테스트 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const stats = useMemo(() => {
    const total = tests.length;
    const completed = tests.filter((test) => test.hasSubmitted).length;
    const published = tests.filter((test) => test.submissionStatus?.isPublished).length;
    return { total, completed, published };
  }, [tests]);

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">테스트 정보를 불러오는 중...</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">온라인 테스트</h1>
          <p className="text-sm text-gray-600">강의에 배정된 온라인 테스트를 확인하고 응시하세요.</p>
        </div>
        <div className="text-sm text-gray-500">
          총 {stats.total}개 · 응시 완료 {stats.completed}개 · 결과 공개 {stats.published}개
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tests.length === 0 && (
          <div className="col-span-full border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 space-y-2">
            <p className="text-sm">현재 응시 가능한 테스트가 없습니다.</p>
            <p className="text-xs text-gray-400">
              강의 콘텐츠 또는 담당 강사를 통해 테스트 공개 여부를 다시 확인해 주세요.
            </p>
          </div>
        )}

        {tests.map((test) => {
          const status = test.submissionStatus;
          const isPastDue = (() => {
            if (!test.dueDate) return false;
            const d = new Date(test.dueDate as any);
            const endUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 14, 59, 59, 999); // 23:59:59 KST
            return Date.now() > endUtc;
          })();
          const canAttempt = !test.hasSubmitted && !isPastDue;
          const canViewResult = Boolean(status?.isPublished);
          const isCourseLinked = Boolean(test.courseId);
          const locationLabel = isCourseLinked
            ? `강의: ${test.courseTitle ?? '연결됨'}`
            : test.className
              ? `반: ${test.className}`
              : '반 테스트';
          const locationHint = isCourseLinked
            ? (test.blockId
              ? '강의 콘텐츠에서도 바로 확인할 수 있습니다.'
              : '강의 콘텐츠에 표시되지 않는 테스트일 수 있습니다.')
            : '강의 콘텐츠에 포함되지 않은 반 테스트입니다.';
          return (
            <div key={test.id} className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{test.title}</h2>
                  {test.courseTitle ? (
                    <p className="text-xs text-gray-500 mt-1">강의: {test.courseTitle}</p>
                  ) : test.className ? (
                    <p className="text-xs text-gray-500 mt-1">반: {test.className}</p>
                  ) : null}
                  {test.description && (
                    <p className="text-sm text-gray-600 mt-2">{test.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
                  <span>{test.isPublished ? '공개됨' : '준비중'}</span>
                  {status && (
                    <span>
                      {status.isPublished ? '결과 공개' : status.isGraded ? '채점 완료' : '채점 대기'}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full border ${
                      isCourseLinked
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}
                  >
                    {isCourseLinked ? '강의 연계' : '반 테스트'}
                  </span>
                  {isPastDue && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">마감됨</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div>총점 <span className="font-medium">{test.totalScore ?? 100}점</span></div>
                <div>시간 제한 <span className="font-medium">{test.timeLimit ? `${test.timeLimit}분` : '없음'}</span></div>
                <div>응시 상태 <span className="font-medium">{test.hasSubmitted ? '응시 완료' : '미응시'}</span></div>
                <div>공개 상태 <span className="font-medium">{status?.isPublished ? '공개됨' : '미공개'}</span></div>
                <div>마감일 <span className="font-medium">{formatDate(test.dueDate)}</span></div>
                <div>담당 반 <span className="font-medium">{test.className ? `${test.className}${test.subjectName ? ` (${test.subjectName})` : ''}` : '-'}</span></div>
                <div>연결 위치 <span className="font-medium">{locationLabel}</span></div>
                <div className="col-span-2 text-xs text-gray-500">{locationHint}</div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/student/tests/${test.id}/attempt`)}
                  disabled={!canAttempt}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    canAttempt
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {canAttempt ? '응시하기' : (isPastDue ? '마감됨' : '응시 완료')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/student/tests/${test.id}/result`)}
                  disabled={!canViewResult}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    canViewResult
                      ? 'border border-green-300 text-green-700 hover:bg-green-50'
                      : 'border border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  결과 보기
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentTestsPage;
