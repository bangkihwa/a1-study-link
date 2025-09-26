import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { TestSummary } from '../types';
import { useAuth } from '../contexts/AuthContext';

const statusColors: Record<'published' | 'draft' | 'scheduled', string> = {
  published: 'bg-green-100 text-green-700 border border-green-200',
  draft: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  scheduled: 'bg-blue-100 text-blue-700 border border-blue-200'
};

const TeacherTestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  const canCreate = user?.role === 'teacher';

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTests();
      if (response.success) {
        setTests(response.data || []);
      } else {
        setError(response.message || '테스트 목록을 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '테스트 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleDelete = async (testId: number) => {
    if (!window.confirm('정말로 이 테스트를 삭제하시겠습니까?')) {
      return;
    }
    try {
      setStatusMessage(null);
      const response = await apiService.deleteTest(testId);
      if (response.success) {
        setStatusMessage('테스트가 삭제되었습니다.');
        fetchTests();
      } else {
        setError(response.message || '테스트 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '테스트 삭제 중 오류가 발생했습니다.');
    }
  };


  const totals = useMemo(() => {
    if (!tests.length) {
      return { total: 0, published: 0, submissions: 0 };
    }
    const published = tests.filter((test) => test.isPublished).length;
    const submissions = tests.reduce((sum, test) => sum + (test.submissionStats?.total || 0), 0);
    return { total: tests.length, published, submissions };
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
          <h1 className="text-2xl font-bold text-gray-900">테스트 관리</h1>
          <p className="text-sm text-gray-600">강의를 위한 온라인 테스트를 생성하고 질문을 구성하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            총 {totals.total}개 · 공개 {totals.published}개 · 제출 {totals.submissions}건
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={() => navigate('/teacher/tests/create')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              새 테스트 만들기
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {statusMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tests.length === 0 && (
          <div className="col-span-full">
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
              아직 생성된 테스트가 없습니다. 새로운 테스트를 만들어 보세요.
            </div>
          </div>
        )}

        {tests.map((test) => (
          <div key={test.id} className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{test.title}</h2>
                {test.description && (
                  <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                )}
              </div>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  test.isPublished ? statusColors.published : (test.publishAt ? statusColors.scheduled : statusColors.draft)
                }`}
              >
                {test.isPublished ? '공개' : (test.publishAt ? '예약됨' : '비공개')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div>
                총점 <span className="font-medium">{test.totalScore ?? 100}</span>
              </div>
              <div>
                시간 제한 <span className="font-medium">{test.timeLimit ? `${test.timeLimit}분` : '없음'}</span>
              </div>
              <div>
                마감일 <span className="font-medium">{formatDate(test.dueDate)}</span>
              </div>
              <div>
                담당 반 <span className="font-medium">{test.className ? `${test.className}${test.subjectName ? ` (${test.subjectName})` : ''}` : '-'}</span>
              </div>
              <div>
                공개일 <span className="font-medium">{test.publishAt ? formatDate(test.publishAt) : (test.isPublished ? '즉시' : '미정')}</span>
              </div>
              <div>
                제출 수 <span className="font-medium">{test.submissionStats?.total ?? 0}</span>
              </div>
              <div>
                채점 완료 <span className="font-medium">{test.submissionStats?.graded ?? 0}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/teacher/tests/${test.id}`)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50"
              >
                질문 관리
              </button>
              <button
                type="button"
                onClick={() => navigate(`/teacher/tests/${test.id}/submissions`)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50"
              >
                제출 현황
              </button>
              <button
                type="button"
                onClick={() => handleDelete(test.id)}
                className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-700 rounded-md hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherTestsPage;
