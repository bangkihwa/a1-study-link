import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { TestAttempt, TestAttemptQuestion } from '../types';

interface AnswerState {
  [questionId: string]: any;
}

const StudentTestAttemptPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const numericTestId = testId ? Number(testId) : NaN;

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!numericTestId || Number.isNaN(numericTestId)) {
      setError('유효하지 않은 테스트입니다.');
      setLoading(false);
      return;
    }

    const fetchAttempt = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getTestAttempt(numericTestId);
        if (response.success && response.data) {
          setAttempt(response.data as TestAttempt);
        } else {
          throw new Error(response.message || '테스트를 불러오지 못했습니다.');
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || '테스트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [numericTestId]);

  const sortedQuestions = useMemo<TestAttemptQuestion[]>(() => {
    if (!attempt) return [];
    return [...attempt.questions].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [attempt]);

  const isPastDue = useMemo(() => {
    const due = attempt?.test?.dueDate;
    if (!due) return false;
    const d = new Date(due as any);
    const endUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 14, 59, 59, 999); // 23:59:59 KST
    return Date.now() > endUtc;
  }, [attempt?.test?.dueDate]);

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [String(questionId)]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!numericTestId || Number.isNaN(numericTestId)) return;

    try {
      setSubmitting(true);
      setStatusMessage(null);
      const response = await apiService.submitTest({
        testId: numericTestId,
        answers
      });
      if (response.success) {
        const requiresManual = response.data?.requiresManualGrading;
        setStatusMessage(
          requiresManual
            ? '제출이 완료되었습니다. 서술형 채점 결과는 추후 공개됩니다.'
            : `제출이 완료되었습니다. 자동 채점 점수: ${response.data?.score ?? 0}점`
        );
        setTimeout(() => {
          navigate('/student/tests');
        }, 2000);
      } else {
        throw new Error(response.message || '테스트 제출에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '테스트 제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!numericTestId || Number.isNaN(numericTestId)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">유효하지 않은 요청입니다.</div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">테스트 정보를 불러오는 중...</div>
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

  if (!attempt) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{attempt.test.title}</h1>
        {attempt.test.courseTitle && (
          <p className="text-sm text-gray-600 mt-1">과정: {attempt.test.courseTitle}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          총점 {attempt.test.totalScore ?? 100}점 · 시간 제한 {attempt.test.timeLimit ? `${attempt.test.timeLimit}분` : '없음'}
        </p>
      </div>

      {statusMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">{statusMessage}</div>
      )}
      {isPastDue && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
          마감 기한이 지났습니다. 문제는 열람할 수 있지만 제출은 불가합니다.
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {sortedQuestions.map((question, index) => (
          <div key={question.id} className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {index + 1}. {question.questionText}
                </h2>
                <p className="text-xs text-gray-500 mt-1">배점 {question.points}점</p>
              </div>
              <span className="text-xs text-gray-500 uppercase">{question.type.replace('_', ' ')}</span>
            </div>

            {question.type === 'ox' && (
              <div className="flex items-center gap-4">
                {['O', 'X'].map((choice) => (
                  <label key={choice} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={choice}
                      checked={answers[String(question.id)] === choice}
                      onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                      className="h-4 w-4 text-blue-600 border-gray-300"
                    />
                    {choice}
                  </label>
                ))}
              </div>
            )}

            {question.type === 'multiple_choice' && (
              <div className="space-y-2">
                {(question.questionData?.options || []).map((option: string, optionIndex: number) => (
                  <label key={optionIndex} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={optionIndex}
                      checked={Number(answers[String(question.id)]) === optionIndex}
                      onChange={(event) => handleAnswerChange(question.id, Number(event.target.value))}
                      className="h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'short_answer' && (
              <input
                type="text"
                value={answers[String(question.id)] ?? ''}
                onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="정답을 입력하세요"
              />
            )}

            {question.type === 'essay' && (
              <textarea
                value={answers[String(question.id)] ?? ''}
                onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="답안을 작성하세요"
              />
            )}
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || isPastDue}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? '제출 중...' : (isPastDue ? '마감됨' : '테스트 제출')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/tests')}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
            disabled={submitting}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentTestAttemptPage;
