import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { Course } from '../types';

interface ClassStudentSummary {
  id: number;
  name: string;
  email?: string | null;
}

const TeacherCourseManagePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const numericCourseId = courseId ? Number(courseId) : NaN;

  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<ClassStudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(numericCourseId)) {
      setError('유효하지 않은 강의 ID입니다.');
      setLoading(false);
      return;
    }

    const loadCourse = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.getManageCourse(numericCourseId);
        if (!response.success) {
          throw new Error(response.message || '강의 정보를 불러오지 못했습니다.');
        }
        const detail = response.data as Course;
        setCourse(detail);
        if (detail.classId) {
          setStudentsLoading(true);
          const studentResponse = await apiService.getClassStudents(detail.classId);
          if (studentResponse.success) {
            const list: ClassStudentSummary[] = (studentResponse.data || []).map((student: any) => ({
              id: student.id,
              name: student.name,
              email: student.email ?? null
            }));
            setStudents(list);
          } else {
            setError(studentResponse.message || '반 학생 목록을 불러오지 못했습니다.');
          }
          setStudentsLoading(false);
        } else {
          setStudents([]);
          setStudentsLoading(false);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || '강의 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [numericCourseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        강의 정보를 불러오는 중...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 text-gray-600">
        <p>{error || '강의 정보를 표시할 수 없습니다.'}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">강의 관리: {course.title}</h1>
            <p className="text-sm text-gray-600">선택한 반 학생들에게 강의가 자동 배정됩니다.</p>
            <p className="text-xs text-gray-500 mt-1">
              담당 반: {course.classId ? `반 #${course.classId}` : '미지정'} · 공개 상태: {course.isPublished ? '공개' : '비공개'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/teacher/courses"
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              목록으로
            </Link>
            <Link
              to={`/teacher/courses/${course.id}/edit`}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              강의 정보 수정
            </Link>
          </div>
        </div>

        {course.description && (
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{course.description}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">반 학생 목록</h2>
              <p className="text-xs text-gray-500">선택한 반의 모든 학생이 강의에 자동 배정되어 있습니다.</p>
            </div>
            <span className="text-xs text-gray-500">
              총 {students.length}명
            </span>
          </div>

          {studentsLoading ? (
            <p className="text-sm text-gray-500">학생 목록을 불러오는 중...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-gray-500">반에 등록된 학생이 없습니다.</p>
          ) : (
            <ul className="divide-y">
              {students.map((student) => (
                <li key={student.id} className="py-3">
                  <p className="text-sm font-medium text-gray-800">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.email || '이메일 없음'}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherCourseManagePage;
