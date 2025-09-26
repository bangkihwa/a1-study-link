import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { QnaItem } from '../types';

const StudentQnaPage: React.FC = () => {
  const [questions, setQuestions] = useState<QnaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getMyQna();
        if (response.success) {
          setQuestions(response.data || []);
        } else {
          throw new Error(response.message || '질문 기록을 불러오지 못했습니다.');
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || '질문 기록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [questions]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">질문 기록을 불러오는 중...</div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">나의 질문 내역</h1>
          <p className="text-sm text-gray-600">등록한 질문과 강사 답변을 한눈에 확인하세요.</p>
        </div>
        <Link
          to="/student/dashboard"
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
        >
          대시보드로 돌아가기
        </Link>
      </div>

      {sortedQuestions.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
          등록된 질문이 없습니다. 강의 상세 페이지에서 질문을 남겨보세요.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedQuestions.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-6 space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  강의 #{item.courseId} · {item.isPublic ? '공개' : '비공개'} 질문
                </span>
                <span>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-md px-3 py-2">{item.question}</p>
              {item.answer ? (
                <div className="border border-green-200 bg-green-50 rounded-md px-3 py-3 text-sm text-gray-800">
                  <div className="font-medium text-green-700 mb-1">답변</div>
                  <p className="whitespace-pre-wrap">{item.answer}</p>
                  <p className="text-xs text-gray-500 mt-2">{item.answeredAt ? new Date(item.answeredAt).toLocaleString() : ''}</p>
                </div>
              ) : (
                <p className="text-sm text-amber-600">답변을 기다리는 중입니다.</p>
              )}
              <div>
                <Link
                  to={`/course/${item.courseId}/qna`}
                  className="text-xs text-blue-600 hover:text-blue-500"
                >
                  해당 강의 Q&A로 이동
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentQnaPage;
