import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Course } from '../../types';

interface TeacherCourseSummary {
  id: number;
  title: string;
  description?: string;
  isPublished: boolean;
  averageProgress: number;
  uniqueStudents: number;
  videoBlockCount: number;
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<TeacherCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (courseId: number) => {
    if (!window.confirm('정말로 이 강의를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    try {
      const resp = await apiService.deleteCourse(courseId);
      if (!resp.success) {
        throw new Error(resp.message || '강의 삭제에 실패했습니다.');
      }
      await loadCourses();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || '강의 삭제 중 오류가 발생했습니다.');
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const coursesResp = await apiService.getCourses();
      if (!coursesResp.success) {
        throw new Error(coursesResp.message || '강의 목록을 불러오지 못했습니다.');
      }

      const summaries: TeacherCourseSummary[] = ((coursesResp.data || []) as Course[]).map((rawCourse) => {
        const stats = rawCourse.videoStats ?? {
          averageProgress: 0,
          uniqueStudents: 0,
          videoBlockCount: 0
        };

        return {
          id: rawCourse.id,
          title: rawCourse.title,
          description: rawCourse.description,
          isPublished: rawCourse.isPublished,
          averageProgress: stats.averageProgress,
          uniqueStudents: stats.uniqueStudents,
          videoBlockCount: stats.videoBlockCount
        };
      });

      setCourses(summaries);
    } catch (err: any) {
      setError(err?.message || '대시보드 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 최초/사용자 변경 시 로드
  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // 포커스/가시성 변화 및 알림 갱신 시 재조회 + 주기 폴링
  useEffect(() => {
    const onFocus = () => loadCourses();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadCourses();
    };
    const onNotificationsUpdated = () => {
      // 알림 수 변경 시 대시보드 데이터 재조회(클래스 배정/변경 알림 등)
      loadCourses();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('app:notifications-updated', onNotificationsUpdated as EventListener);

    const interval = setInterval(loadCourses, 60000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('app:notifications-updated', onNotificationsUpdated as EventListener);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const aggregates = useMemo(() => {
    if (courses.length === 0) {
      return {
        totalCourses: 0,
        publishedCourses: 0,
        averageProgress: 0,
        totalStudents: 0
      };
    }

    const publishedCourses = courses.filter((course) => course.isPublished).length;
    const averageProgress = courses.reduce((sum, course) => sum + course.averageProgress, 0) / courses.length;
    const totalStudents = courses.reduce((sum, course) => sum + course.uniqueStudents, 0);

    return {
      totalCourses: courses.length,
      publishedCourses,
      averageProgress,
      totalStudents
    };
  }, [courses]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
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
      <div>
        <h1 className="text-2xl font-bold">강사 대시보드</h1>
        {user && <p className="text-gray-600 mt-1">{user.name} 강사님의 강의 현황을 한눈에 모았습니다.</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          to="/teacher/courses"
          className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          강의 관리
        </Link>
        <Link
          to="/teacher/students"
          className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 text-sm font-medium text-green-700 hover:bg-green-100"
        >
          학생 관리
        </Link>
        <Link
          to="/teacher/tests"
          className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-100"
        >
          테스트 관리
        </Link>
        <Link
          to="/teacher/reports"
          className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-3 text-sm font-medium text-purple-700 hover:bg-purple-100"
        >
          학습 리포트
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardStat title="총 강의" value={`${aggregates.totalCourses}`} accent="text-blue-600" />
        <DashboardStat title="공개 강의" value={`${aggregates.publishedCourses}`} accent="text-green-600" />
        <DashboardStat title="평균 영상 진도" value={`${aggregates.averageProgress.toFixed(1)}%`} accent="text-purple-600" />
        <DashboardStat title="참여 학생" value={`${aggregates.totalStudents}`} accent="text-amber-600" />
      </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h2 className="text-xl font-bold">담당 강의 목록</h2>
            <div className="flex items-center gap-2">
              <Link
                to="/teacher/courses"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                강의 관리로 이동
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                to="/teacher/tests"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                테스트 관리로 이동
              </Link>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={loadCourses}
                className="text-sm text-gray-600 hover:text-gray-800"
                title="새로고침"
              >
                ↻ 새로고침
              </button>
            </div>
          </div>

        <div className="space-y-4">
          {courses.length === 0 && <p className="text-sm text-gray-500">등록된 강의가 없습니다.</p>}
          {courses.map((course) => (
            <div key={course.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h3 className="font-medium text-lg text-gray-900">{course.title}</h3>
                  {course.description && <p className="text-sm text-gray-500">{course.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${course.isPublished ? 'border-green-300 text-green-700 bg-green-50' : 'border-yellow-300 text-yellow-700 bg-yellow-50'}`}>
                    {course.isPublished ? '공개' : '비공개'}
                  </span>
                  <Link
                    to={`/teacher/courses/${course.id}/video-progress`}
                    className="text-xs text-primary-600 hover:text-primary-500"
                  >
                    진행 상황 보기
                  </Link>
                  <Link
                    to={`/course/${course.id}/qna`}
                    className="text-xs text-blue-600 hover:text-blue-500"
                  >
                    Q&A 관리
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>평균 진도율: <span className="font-medium">{course.averageProgress.toFixed(1)}%</span></div>
                <div>참여 학생 수: <span className="font-medium">{course.uniqueStudents}명</span></div>
                <div>영상 블록 수: <span className="font-medium">{course.videoBlockCount}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DashboardStat: React.FC<{ title: string; value: string; accent?: string }> = ({ title, value, accent }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className={`mt-2 text-3xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
  </div>
);

export default TeacherDashboard;
