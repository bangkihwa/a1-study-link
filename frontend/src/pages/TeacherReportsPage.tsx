import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Course, VideoProgress } from '../types';

interface CourseReportRow {
  courseId: number;
  title: string;
  description?: string;
  averageProgress: number;
  completionRate: number;
  enrolledStudents: number;
  lastActivity?: string | null;
}

const TeacherReportsPage: React.FC = () => {
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
        setError(err?.message || '리포트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const reportRows = useMemo<CourseReportRow[]>(() => {
    return courses.map((course) => {
      const progressList = progressByCourse[course.id] || [];
      const studentMap = new Map<number, { total: number; completed: number; entries: number; lastActivity?: string | null }>();

      progressList.forEach((entry) => {
        const existing = studentMap.get(entry.studentId);
        if (!existing) {
          studentMap.set(entry.studentId, {
            total: entry.progressPercentage,
            completed: entry.isCompleted ? 1 : 0,
            entries: 1,
            lastActivity: entry.lastWatchedAt || null
          });
        } else {
          existing.total += entry.progressPercentage;
          existing.completed += entry.isCompleted ? 1 : 0;
          existing.entries += 1;
          if (entry.lastWatchedAt && (!existing.lastActivity || new Date(entry.lastWatchedAt) > new Date(existing.lastActivity))) {
            existing.lastActivity = entry.lastWatchedAt;
          }
        }
      });

      const students = Array.from(studentMap.values());
      const enrolledStudents = students.length;
      const averageProgress = enrolledStudents
        ? students.reduce((sum, row) => sum + row.total / row.entries, 0) / enrolledStudents
        : 0;
      const completionRate = enrolledStudents
        ? students.reduce((sum, row) => sum + (row.completed > 0 ? 1 : 0), 0) / enrolledStudents * 100
        : 0;
      const lastActivity = students.reduce<string | null>((latest, row) => {
        if (!row.lastActivity) return latest;
        if (!latest || new Date(row.lastActivity) > new Date(latest)) {
          return row.lastActivity;
        }
        return latest;
      }, null);

      return {
        courseId: course.id,
        title: course.title,
        description: course.description,
        averageProgress,
        completionRate,
        enrolledStudents,
        lastActivity
      };
    });
  }, [courses, progressByCourse]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">리포트를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">학습 리포트</h1>
          <p className="text-sm text-gray-600">강의별 학습 진행 상황과 완료율을 확인하세요.</p>
        </div>
        <Link
          to="/teacher/dashboard"
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
        >
          대시보드로 돌아가기
        </Link>
      </div>

      {reportRows.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
          표시할 강의가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {reportRows.map((row) => (
            <section key={row.courseId} className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{row.title}</h2>
                  {row.description && <p className="text-sm text-gray-600 mt-1">{row.description}</p>}
                </div>
                <div className="text-xs text-gray-500">
                  최근 활동: {row.lastActivity ? new Date(row.lastActivity).toLocaleString() : '기록 없음'}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-700">
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">평균 진도율</p>
                  <p className="text-lg font-semibold text-blue-600">{row.averageProgress.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">완료율</p>
                  <p className="text-lg font-semibold text-green-600">{row.completionRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">참여 학생</p>
                  <p className="text-lg font-semibold text-gray-800">{row.enrolledStudents}명</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">자세히</p>
                  <Link
                    to={`/teacher/courses/${row.courseId}/video-progress`}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    영상 진도 상세 보기
                  </Link>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherReportsPage;
