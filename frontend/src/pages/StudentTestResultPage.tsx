import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { TestQuestion, TestSubmissionResult, TestSubmissionSummary, TestSummary } from '../types';

interface SubmissionDetail {
  test: TestSummary;
  submission: TestSubmissionSummary;
  questions: TestQuestion[];
}

const StudentTestResultPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const numericTestId = testId ? Number(testId) : NaN;

  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!numericTestId || Number.isNaN(numericTestId)) {
        setError('유효하지 않은 테스트입니다.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getTestSubmissionResult(numericTestId);
        if (response.success && response.data) {
          setDetail(response.data as SubmissionDetail);
        } else {
          throw new Error(response.message || '결과를 불러오지 못했습니다.');
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || '결과를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [numericTestId]);

  const results: TestSubmissionResult[] = useMemo(() => detail?.submission.answers?.results || [], [detail]);

  if (!numericTestId || Number.isNaN(numericTestId)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">유효하지 않은 요청입니다.</div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">결과를 불러오는 중...</div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 text-gray-600">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => navigate('/student/tests')}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        >
          테스트 목록으로 돌아가기
        </button>
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  const totalScore = results.reduce((sum, result) => sum + (result.awardedScore ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{detail.test.title}</h1>
          <p className="text-xs text-gray-500 mt-1">
            제출 일시: {new Date(detail.submission.submittedAt).toLocaleString()} · 총점 {detail.test.totalScore ?? 100}점
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/student/tests')}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
        >
          테스트 목록으로 돌아가기
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
          <span>내 점수: <strong>{detail.submission.score ?? totalScore}</strong> / {detail.test.totalScore ?? 100}</span>
          <span>채점 상태: <strong>{detail.submission.isGraded ? '채점 완료' : '채점 대기'}</strong></span>
          <span>공개 상태: <strong>{detail.submission.isPublished ? '공개됨' : '미공개'}</strong></span>
        </div>
        {detail.submission.answers?.feedback && (
          <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
            강사 피드백: {detail.submission.answers.feedback}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {results.map((result) => {
          const question = detail.questions.find((item) => item.id === result.questionId);
          if (!question) return null;
          return (
            <div key={result.questionId} className="bg-white rounded-lg shadow p-6 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{question.questionText}</h2>
                  <p className="text-xs text-gray-500 mt-1">배점 {question.points ?? 0}점</p>
                </div>
                <div className="text-xs font-medium px-2 py-1 rounded-full border">
                  {question.type.replace('_', ' ')}
                </div>
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-medium text-gray-800">내 답변:</span>
                <div className="mt-1 bg-gray-50 rounded-md px-3 py-2 whitespace-pre-wrap">{String(result.response ?? '-')}</div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                {typeof result.isCorrect === 'boolean' && (
                  <span className={`px-2 py-1 rounded-full ${result.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {result.isCorrect ? '정답' : '오답'}
                  </span>
                )}
                <span>획득 점수: {result.awardedScore ?? 0}점 / {result.maxScore}</span>
                {result.requiresManualGrading && <span>서술형 채점</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentTestResultPage;
