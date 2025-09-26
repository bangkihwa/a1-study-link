import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Course, Notification, VideoProgress } from '../../types';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [videoLogs, setVideoLogs] = useState<VideoProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [coursesResult, progressResult, notificationsResult] = await Promise.allSettled([
          apiService.getCourses(),
          apiService.getMyVideoProgress(),
          apiService.getNotifications()
        ]);

        if (coursesResult.status !== 'fulfilled' || !coursesResult.value.success) {
          throw new Error(
            (coursesResult.status === 'fulfilled' && coursesResult.value.message) ||
            '강의 정보를 불러오지 못했습니다.'
          );
        }
        const coursesResp = coursesResult.value;

        let progressRespData: VideoProgress[] = [];
        if (progressResult.status === 'fulfilled' && progressResult.value.success) {
          progressRespData = progressResult.value.data || [];
        }
        setVideoLogs(progressRespData);

        if (notificationsResult.status === 'fulfilled' && notificationsResult.value.success) {
          setNotifications(notificationsResult.value.data || []);
        } else if (notificationsResult.status === 'rejected') {
          console.warn('Failed to fetch notifications:', notificationsResult.reason);
        } else if (notificationsResult.status === 'fulfilled' && !notificationsResult.value.success) {
          console.warn('Failed to fetch notifications:', notificationsResult.value.message);
        }
        const courseSummaries = ((coursesResp.data || []) as Course[]).map((course) => ({
          ...course,
          studentProgress: {
            progressPercentage: Math.max(0, Math.min(100, course.studentProgress?.progressPercentage ?? 0)),
            completedBlocks: Math.max(0, course.studentProgress?.completedBlocks ?? 0),
            totalBlocks: Math.max(0, course.studentProgress?.totalBlocks ?? 0),
            nextUncompletedTitle: course.studentProgress?.nextUncompletedTitle,
            nextUncompletedBlockId: course.studentProgress?.nextUncompletedBlockId
          }
        }));

        setCourses(courseSummaries);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err?.message || '대시보드 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const aggregates = useMemo(() => {
    if (courses.length === 0) {
      return {
        averageProgress: 0,
        completedCourses: 0,
        totalVideosCompleted: videoLogs.filter((log) => log.isCompleted).length
      };
    }

    const averageProgress =
      courses.reduce((sum, course) => sum + (course.studentProgress?.progressPercentage ?? 0), 0) / courses.length;
    const completedCourses = courses.filter(
      (course) => {
        const totalBlocks = course.studentProgress?.totalBlocks ?? 0;
        const completedBlocks = course.studentProgress?.completedBlocks ?? 0;
        return totalBlocks > 0 && completedBlocks === totalBlocks;
      }
    ).length;
    const completedVideos = videoLogs.filter((log) => log.isCompleted).length;

    return {
      averageProgress,
      completedCourses,
      totalVideosCompleted: completedVideos
    };
  }, [courses, videoLogs]);

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
      <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">학생 대시보드</h1>
          {user && <p className="text-gray-600 mt-1">{user.name}님, 오늘도 즐거운 학습 되세요!</p>}
        </div>
        <Link
          to="/student/tests"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50"
        >
          온라인 테스트 보기
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">수강 중인 강의</h2>
            <div className="space-y-4">
              {courses.length === 0 && (
                <p className="text-sm text-gray-500">현재 등록된 강의가 없습니다.</p>
              )}
              {courses.map((course) => {
                const progress = course.studentProgress;
                const progressPercentage = progress?.progressPercentage ?? 0;
                const completedBlocks = progress?.completedBlocks ?? 0;
                const totalBlocks = progress?.totalBlocks ?? 0;
                const nextContentTitle = course.nextContent?.title ?? progress?.nextUncompletedTitle;
                const nextContentType = course.nextContent?.type;
                const nextContentStatus = course.nextContent?.status ?? (nextContentTitle ? 'pending' : 'completed');

                return (
                  <div key={course.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg text-gray-900">{course.title}</h3>
                          {!course.isPublished && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              준비 중
                            </span>
                          )}
                        </div>
                        {course.description && <p className="text-sm text-gray-500 mt-1">{course.description}</p>}
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
                      {course.isPublished && (
                        <span className="text-sm text-gray-600">진도율 {progressPercentage.toFixed(1)}%</span>
                      )}
                    </div>
                    {course.isPublished && (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, progressPercentage)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>
                            완료 {completedBlocks} / {totalBlocks}
                          </span>
                          <span>
                            {nextContentStatus === 'pending'
                              ? '학습 진행 중'
                              : '모든 콘텐츠 완료'}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <Link
                        to={`/course/${course.id}/qna`}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50"
                      >
                        Q&A 보기
                      </Link>
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
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">알림</h2>
            <div className="space-y-3">
              {notifications.length === 0 && <p className="text-sm text-gray-500">새로운 알림이 없습니다.</p>}
              {notifications.map((notification) => (
                <div key={notification.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <h2 className="text-xl font-bold">학습 통계</h2>
            <div className="flex justify-between text-sm text-gray-600">
              <span>평균 영상 진행률</span>
              <span className="font-medium">{aggregates.averageProgress.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>완료한 강의</span>
              <span className="font-medium">{aggregates.completedCourses}개</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>완료한 영상</span>
              <span className="font-medium">{aggregates.totalVideosCompleted}개</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
