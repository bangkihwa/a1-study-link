import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { QnaItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

const CourseQnaPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const numericCourseId = courseId ? Number(courseId) : NaN;

  const [questions, setQuestions] = useState<QnaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionPublic, setQuestionPublic] = useState(true);
  const [answerDrafts, setAnswerDrafts] = useState<Record<number, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const fetchQuestions = async () => {
    if (!numericCourseId || Number.isNaN(numericCourseId)) {
      setError('유효하지 않은 강의 ID입니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCourseQna(numericCourseId);
      if (response.success) {
        setQuestions(response.data || []);
      } else {
        throw new Error(response.message || '질문 목록을 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '질문 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleAskQuestion = async () => {
    if (!numericCourseId || !questionText.trim()) {
      return;
    }
    try {
      setSubmitting(true);
      setStatusMessage(null);
      const response = await apiService.createQnaQuestion(numericCourseId, questionText.trim(), questionPublic);
      if (!response.success) {
        throw new Error(response.message || '질문 등록에 실패했습니다.');
      }
      setQuestionText('');
      setQuestionPublic(true);
      setStatusMessage('질문이 등록되었습니다. 답변을 기다려 주세요.');
      fetchQuestions();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '질문 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (id: number, value: string) => {
    setAnswerDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmitAnswer = async (id: number) => {
    const answer = answerDrafts[id];
    if (!answer || !answer.trim()) {
      return;
    }
    try {
      setSubmitting(true);
      setStatusMessage(null);
      const response = await apiService.answerQnaQuestion(id, answer.trim());
      if (!response.success) {
        throw new Error(response.message || '답변 등록에 실패했습니다.');
      }
      setAnswerDrafts((prev) => ({ ...prev, [id]: '' }));
      setStatusMessage('답변이 등록되었습니다.');
      fetchQuestions();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '답변 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [questions]
  );

  if (!numericCourseId || Number.isNaN(numericCourseId)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">유효하지 않은 요청입니다.</div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">질문을 불러오는 중...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">강의 Q&A</h1>
          <p className="text-sm text-gray-600">학습 중 궁금한 점을 질문하고, 강사 답변을 확인하세요.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
        >
          돌아가기
        </button>
      </div>

      {statusMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">{statusMessage}</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      {isStudent && (
        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">질문 등록</h2>
          <textarea
            value={questionText}
            onChange={(event) => setQuestionText(event.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="학습 중 궁금한 점을 입력하세요."
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={questionPublic}
                onChange={(event) => setQuestionPublic(event.target.checked)}
                className="h-4 w-4"
              />
              공개 질문으로 등록하기
            </label>
            <button
              type="button"
              onClick={handleAskQuestion}
              disabled={submitting || questionText.trim().length < 3}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? '등록 중...' : '질문 등록'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {sortedQuestions.length === 0 && (
          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
            등록된 질문이 없습니다.
          </div>
        )}

        {sortedQuestions.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">{item.studentName || `학생 ${item.studentId}`}</div>
                <p className="text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleString()} · {item.isPublic ? '공개' : '비공개'} 질문
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-md px-3 py-2">{item.question}</div>

            {item.answer ? (
              <div className="border border-green-200 bg-green-50 rounded-md px-3 py-3 text-sm text-gray-800">
                <div className="font-medium text-green-700 mb-1">{item.teacherName || '답변'}</div>
                <p className="whitespace-pre-wrap">{item.answer}</p>
                <p className="text-xs text-gray-500 mt-2">{item.answeredAt ? new Date(item.answeredAt).toLocaleString() : ''}</p>
              </div>
            ) : isTeacher ? (
              <div className="space-y-3">
                <textarea
                  value={answerDrafts[item.id] ?? ''}
                  onChange={(event) => handleAnswerChange(item.id, event.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="답변을 입력하세요"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSubmitAnswer(item.id)}
                    disabled={submitting || !(answerDrafts[item.id] || '').trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submitting ? '등록 중...' : '답변 등록'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">답변을 기다리는 중입니다.</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseQnaPage;
