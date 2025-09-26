import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Course } from '../types';

const StudentCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getCourses();
        if (response.success) {
          const data = (response.data || []) as Course[];
          const normalized = data.map((course) => ({
            ...course,
            studentProgress: {
              progressPercentage: Math.max(0, Math.min(100, course.studentProgress?.progressPercentage ?? 0)),
              completedBlocks: Math.max(0, course.studentProgress?.completedBlocks ?? 0),
              totalBlocks: Math.max(0, course.studentProgress?.totalBlocks ?? 0),
              nextUncompletedTitle: course.studentProgress?.nextUncompletedTitle,
              nextUncompletedBlockId: course.studentProgress?.nextUncompletedBlockId
            }
          }));
          setCourses(normalized);
        } else {
          throw new Error(response.message || '강의 목록을 불러오지 못했습니다.');
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || '강의 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
          <h1 className="text-2xl font-bold text-gray-900">수강 중인 강의</h1>
          <p className="text-sm text-gray-600">등록된 강의를 확인하고 상세 학습 페이지로 이동하세요.</p>
        </div>
        <Link
          to="/student/dashboard"
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
        >
          대시보드로 돌아가기
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
          현재 등록된 강의가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => {
            const progress = course.studentProgress;
            const progressPercentage = progress?.progressPercentage ?? 0;
            const completedBlocks = progress?.completedBlocks ?? 0;
            const totalBlocks = progress?.totalBlocks ?? 0;
            const nextContentTitle = course.nextContent?.title ?? progress?.nextUncompletedTitle;
            const nextContentType = course.nextContent?.type;
            const nextContentStatus = course.nextContent?.status ?? (nextContentTitle ? 'pending' : 'completed');

            return (
              <div key={course.id} className="bg-white rounded-lg shadow p-6 space-y-3">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-gray-900">{course.title}</h2>
                      {!course.isPublished && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          준비 중
                        </span>
                      )}
                    </div>
                    {course.description && <p className="text-sm text-gray-600 mt-1">{course.description}</p>}
                    {course.isPublished && nextContentTitle && (
                      <p className="text-xs text-blue-600 mt-1">
                        다음 콘텐츠: {nextContentTitle}
                        {nextContentType === 'video' && ' (영상)'}
                        {nextContentType === 'test' && ' (테스트)'}
                      </p>
                    )}
                    {course.isPublished && !nextContentTitle && (
                      <p className="text-xs text-green-600 mt-1">모든 필수 콘텐츠를 완료했습니다.</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0 pt-1">
                    최근 업데이트: {new Date(course.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                {course.isPublished && (
                  <div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>진도율</span>
                      <span>{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, progressPercentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <span>
                        완료 {completedBlocks} / {totalBlocks}
                      </span>
                      <span>
                        {nextContentStatus === 'pending'
                          ? '학습 진행 중'
                          : '모든 콘텐츠 완료'}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {course.isPublished ? (
                    <Link
                      to={`/student/courses/${course.id}`}
                      className="px-3 py-1.5 text-xs font-medium border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50"
                    >
                      학습 시작
                    </Link>
                  ) : (
                    <span className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-400 bg-gray-50 rounded-md cursor-not-allowed">
                      학습 시작 (준비 중)
                    </span>
                  )}
                  <Link
                    to={`/course/${course.id}/qna`}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50"
                  >
                    Q&A 보기
                  </Link>
                  <Link
                    to="/student/tests"
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50"
                  >
                    테스트 이동
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentCoursesPage;
