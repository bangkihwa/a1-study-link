import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Course } from '../types';

interface TeacherCourseSummary extends Course {
  submissionStats?: {
    total: number;
    graded: number;
    published: number;
  };
}

const TeacherCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<TeacherCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCourses();
      if (response.success) {
        setCourses(response.data || []);
      } else {
        throw new Error(response.message || '강의 목록을 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '강의 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (courseId: number) => {
    if (!window.confirm('정말로 이 강의를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    try {
      const resp = await apiService.deleteCourse(courseId);
      if (!resp.success) {
        throw new Error(resp.message || '강의 삭제에 실패했습니다.');
      }
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '강의 삭제 중 오류가 발생했습니다.');
      alert(err?.response?.data?.message || err?.message || '강의 삭제 중 오류가 발생했습니다.');
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') load();
    };
    const onNotificationsUpdated = () => load();

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('app:notifications-updated', onNotificationsUpdated as EventListener);

    const interval = setInterval(load, 60000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('app:notifications-updated', onNotificationsUpdated as EventListener);
      clearInterval(interval);
    };
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">강의 목록을 불러오는 중...</div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">{error}</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">담당 강의 관리</h1>
          <p className="text-sm text-gray-600">강의 정보를 확인하고 Q&A 및 테스트 현황을 확인하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/teacher/courses/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            새 강의 만들기
          </Link>
          <Link
            to="/teacher/dashboard"
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            대시보드로 돌아가기
          </Link>
          <button
            type="button"
            onClick={load}
            className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
            title="새로고침"
          >
            ↻ 새로고침
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
          <p className="mb-3">담당하고 있는 강의가 없습니다.</p>
          <Link
            to="/teacher/courses/new"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            첫 강의 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow p-6 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{course.title}</h2>
                  {course.description && <p className="text-sm text-gray-600 mt-1">{course.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${course.isPublished ? 'border-green-300 text-green-700 bg-green-50' : 'border-yellow-300 text-yellow-700 bg-yellow-50'}`}>
                    {course.isPublished ? '공개' : '비공개'}
                  </span>
                  <Link
                    to={`/teacher/courses/${course.id}/video-progress`}
                    className="text-xs text-primary-600 hover:text-primary-500"
                  >
                    영상 진도
                  </Link>
                  <Link
                    to={`/course/${course.id}/qna`}
                    className="text-xs text-blue-600 hover:text-blue-500"
                  >
                    Q&A
                  </Link>
                  <Link
                    to={`/teacher/courses/${course.id}/view`}
                    className="text-xs text-indigo-600 hover:text-indigo-500"
                  >
                    학생 화면 보기
                  </Link>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(course.id)}
                    className="text-xs text-red-600 hover:text-red-700"
                    title="강의 삭제"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <Link
                  to="/teacher/tests"
                  className="underline text-sm text-gray-700"
                >
                  테스트 관리로 이동
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  to={`/teacher/courses/${course.id}/manage`}
                  className="underline text-sm text-indigo-600"
                >
                  반 학생 보기
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  to={`/teacher/courses/${course.id}/edit`}
                  className="underline text-sm text-blue-600"
                >
                  강의 정보 수정
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherCoursesPage;
