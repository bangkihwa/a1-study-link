import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { QnaItem } from '../types';

const TeacherQnaPage: React.FC = () => {
  const [questions, setQuestions] = useState<QnaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getTeacherQna();
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
    load();
  }, []);

  const groupedByCourse = useMemo(() => {
    const map = new Map<number, { courseTitle?: string; items: QnaItem[] }>();
    questions.forEach((item: QnaItem) => {
      const existing = map.get(item.courseId);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.courseId, {
          courseTitle: item.courseTitle,
          items: [item]
        });
      }
    });
    return Array.from(map.entries()).map(([courseId, value]) => ({ courseId, ...value }));
  }, [questions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">질문 목록을 불러오는 중...</div>
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">강의별 질문 목록</h1>
          <p className="text-sm text-gray-600">담당 강의에 등록된 학생 질문을 확인하고 답변하세요.</p>
        </div>
      </div>

      {groupedByCourse.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
          아직 질문이 등록되지 않았습니다.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByCourse.map((group) => (
            <section key={group.courseId} className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{group.courseTitle || `강의 #${group.courseId}`}</h2>
                  <p className="text-xs text-gray-500">총 {group.items.length}개의 질문</p>
                </div>
                <Link
                  to={`/course/${group.courseId}/qna`}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  자세히 보기
                </Link>
              </div>
              <div className="space-y-3">
                {group.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{item.studentName || `학생 ${item.studentId}`}</span>
                      <span>{new Date(item.createdAt).toLocaleString()} · {item.isPublic ? '공개' : '비공개'}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-800 line-clamp-2">{item.question}</p>
                    <p className={`mt-1 text-xs font-medium ${item.answer ? 'text-green-600' : 'text-amber-600'}`}>
                      {item.answer ? '답변 완료' : '답변 대기'}
                    </p>
                  </div>
                ))}
                {group.items.length > 3 && (
                  <p className="text-xs text-gray-500">그 외 {group.items.length - 3}개의 질문이 있습니다.</p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherQnaPage;
