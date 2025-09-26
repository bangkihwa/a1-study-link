import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Course, VideoProgress } from '../types';

interface StudentRow {
  studentId: number;
  studentName: string;
  averageProgress: number;
  completedBlocks: number;
  totalBlocks: number;
  lastWatchedAt?: string | null;
}

const TeacherStudentsPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressByCourse, setProgressByCourse] = useState<Record<number, VideoProgress[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const coursesResp = await apiService.getCourses();
        if (!coursesResp.success) {
          throw new Error(coursesResp.message || '강의 목록을 불러오지 못했습니다.');
        }
        const courseList = (coursesResp.data || []) as Course[];
        setCourses(courseList);

        const teacherProgressResp = await apiService.getTeacherCourseVideoProgress();
        if (!teacherProgressResp.success) {
          throw new Error(teacherProgressResp.message || '학습 진행 정보를 불러오지 못했습니다.');
        }

        const progressList = (teacherProgressResp.data || []) as Array<VideoProgress & { courseId?: number }>;
        const progressMap: Record<number, VideoProgress[]> = {};
        progressList.forEach((entry) => {
          if (!entry.courseId) {
            return;
          }
          if (!progressMap[entry.courseId]) {
            progressMap[entry.courseId] = [];
          }
          progressMap[entry.courseId].push(entry);
        });
        setProgressByCourse(progressMap);
      } catch (err: any) {
        setError(err?.message || '학생 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const buildStudentRows = useCallback((courseId: number): StudentRow[] => {
    const progressList = progressByCourse[courseId] || [];
    const map = new Map<number, StudentRow & { count: number }>();

    progressList.forEach((entry) => {
      const existing = map.get(entry.studentId);
      const studentName = entry.studentName || `학생 ${entry.studentId}`;
      if (!existing) {
        map.set(entry.studentId, {
          studentId: entry.studentId,
          studentName,
          averageProgress: entry.progressPercentage,
          completedBlocks: entry.isCompleted ? 1 : 0,
          totalBlocks: 1,
          lastWatchedAt: entry.lastWatchedAt || undefined,
          count: 1
        });
      } else {
        existing.averageProgress += entry.progressPercentage;
        existing.completedBlocks += entry.isCompleted ? 1 : 0;
        existing.totalBlocks += 1;
        existing.count += 1;
        if (entry.lastWatchedAt && (!existing.lastWatchedAt || new Date(entry.lastWatchedAt) > new Date(existing.lastWatchedAt))) {
          existing.lastWatchedAt = entry.lastWatchedAt;
        }
      }
    });

    return Array.from(map.values()).map((row) => ({
      studentId: row.studentId,
      studentName: row.studentName,
      averageProgress: row.count > 0 ? row.averageProgress / row.count : 0,
      completedBlocks: row.completedBlocks,
      totalBlocks: row.totalBlocks,
      lastWatchedAt: row.lastWatchedAt
    }));
  }, [progressByCourse]);

  const summaryByCourse = useMemo(() => {
    const result: Record<number, StudentRow[]> = {};
    courses.forEach((course) => {
      result[course.id] = buildStudentRows(course.id);
    });
    return result;
  }, [courses, buildStudentRows]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">학생 정보를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">학생 관리</h1>
          <p className="text-sm text-gray-600">담당 강의별 학생 학습 현황을 확인하세요.</p>
        </div>
        <Link
          to="/teacher/dashboard"
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
        >
          대시보드로 돌아가기
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
          담당하고 있는 강의가 없습니다.
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map((course) => {
            const rows = summaryByCourse[course.id] || [];
            return (
              <section key={course.id} className="bg-white rounded-lg shadow p-6 space-y-4">
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
                      className="text-xs text-blue-600 hover:text-blue-500"
                    >
                      자세히 보기
                    </Link>
                  </div>
                </div>

                {rows.length === 0 ? (
                  <p className="text-sm text-gray-500">아직 학습 기록이 없습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">학생</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">평균 진도율</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">완료 콘텐츠</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">최근 시청</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {rows.map((row) => (
                          <tr key={row.studentId}>
                            <td className="px-3 py-2 text-gray-800">{row.studentName}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{row.averageProgress.toFixed(1)}%</td>
                            <td className="px-3 py-2 text-right text-gray-700">
                              {row.completedBlocks} / {row.totalBlocks}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-500">
                              {row.lastWatchedAt ? new Date(row.lastWatchedAt).toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherStudentsPage;
