import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CalendarContextData } from '../types';

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{11}(?:[?&][^\s]*)?$/i;

const TeacherCourseEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const params = useParams<{ courseId?: string }>();
  const parsedCourseId = params.courseId ? Number(params.courseId) : NaN;
  const isEdit = !Number.isNaN(parsedCourseId);
  const courseId = isEdit ? parsedCourseId : undefined;

  const [context, setContext] = useState<CalendarContextData | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState<boolean>(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialVideoUrl, setInitialVideoUrl] = useState('');
  const [initialVideoTitle, setInitialVideoTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [courseDetail, setCourseDetail] = useState<any | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    const loadContext = async () => {
      setContextLoading(true);
      setError(null);
      try {
        const response = await apiService.getCalendarContext();
        if (response.success) {
          setContext(response.data || {});
        } else {
          setError(response.message || '강의 생성에 필요한 정보를 불러오지 못했습니다.');
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || '강의 생성에 필요한 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setContextLoading(false);
      }
    };

    loadContext();
  }, []);

  useEffect(() => {
    if (!isEdit || !courseId || contextLoading) {
      return;
    }

    const loadCourse = async () => {
      setCourseLoading(true);
      setError(null);
      try {
        const response = await apiService.getManageCourse(courseId);
        if (!response.success) {
          throw new Error(response.message || '강의 정보를 불러오지 못했습니다.');
        }
        const detail = response.data;
        setCourseDetail(detail);
        setTitle(detail.title || '');
        setDescription(detail.description || '');
        setSelectedClassId(detail.classId ? String(detail.classId) : '');
        setIsPublished(Boolean(detail.isPublished));
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || '강의 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setCourseLoading(false);
      }
    };

    loadCourse();
  }, [isEdit, courseId, contextLoading]);

  const classOptions = useMemo(() => {
    if (!context) {
      return [];
    }
    const classes = context.classes || [];
    if (courseDetail && classes.every((cls) => cls.id !== courseDetail.classId)) {
      return [
        ...classes,
        {
          id: courseDetail.classId,
          name: courseDetail.className || `반 #${courseDetail.classId}`,
          subjectName: (courseDetail as any)?.subjectName ?? null
        }
      ];
    }
    return classes;
  }, [context, courseDetail]);

  const handleClassChange = (value: string) => {
    setSelectedClassId(value);
    setFeedback(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    if (!title.trim()) {
      setError('강의 제목을 입력하세요.');
      return;
    }

    if (!selectedClassId) {
      setError('담당 반을 선택하세요.');
      return;
    }

    const classId = Number(selectedClassId);
    if (!Number.isInteger(classId) || classId <= 0) {
      setError('유효한 반을 선택하세요.');
      return;
    }

    const trimmedDescription = description.trim();

    if (!isEdit) {
      const trimmedVideoUrl = initialVideoUrl.trim();
      const trimmedVideoTitle = initialVideoTitle.trim();

      if (!trimmedVideoUrl) {
        setError('대표 유튜브 영상 링크를 입력하세요.');
        return;
      }
      if (!YOUTUBE_URL_REGEX.test(trimmedVideoUrl)) {
        setError('유효한 유튜브 영상 링크를 입력하세요.');
        return;
      }

      setSaving(true);
      try {
        const response = await apiService.createCourse({
          title: title.trim(),
          description: trimmedDescription || undefined,
          classId,
          isPublished,
          initialVideoUrl: trimmedVideoUrl,
          initialVideoTitle: trimmedVideoTitle || undefined
        });

        if (!response.success) {
          throw new Error(response.message || '강의 생성에 실패했습니다.');
        }

        setFeedback('강의가 성공적으로 생성되었습니다. 강의 목록으로 이동합니다.');
        setTimeout(() => {
          navigate('/teacher/courses');
        }, 1500);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || '강의 생성 중 오류가 발생했습니다.');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!courseId) {
      setError('유효하지 않은 강의 ID입니다.');
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.updateCourse(courseId, {
        title: title.trim(),
        description: trimmedDescription || undefined,
        classId,
        isPublished
      });

      if (!response.success) {
        throw new Error(response.message || '강의 정보를 수정하지 못했습니다.');
      }

      const updated = response.data;
      setCourseDetail(updated);
      setIsPublished(Boolean(updated?.isPublished));
      setFeedback('강의 정보가 업데이트되었습니다.');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '강의 정보를 수정하는 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const isLoading = contextLoading || courseLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        강의 정보를 준비하는 중...
      </div>
    );
  }

  if (!user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        강사 전용 페이지입니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? '강의 정보 수정' : '새 강의 만들기'}</h1>
          <p className="text-sm text-gray-600">
            {isEdit
              ? '강의 기본 정보를 수정하고 공개 여부를 관리하세요.'
              : '담당 반을 선택하면 해당 반 학생들에게 자동으로 강의가 배정됩니다.'}
          </p>
        </header>

        {feedback && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {feedback}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">강의명</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="예) 3월 1주차 물리 수업"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당 반</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            >
              <option value="">반을 선택하세요</option>
              {classOptions.map((cls) => (
                <option key={cls.id} value={String(cls.id)}>
                  {cls.name} {cls.subjectName ? `- ${cls.subjectName}` : ''}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
              선택한 반에 속한 모든 학생에게 강의가 자동으로 배정됩니다. 별도로 학생을 선택할 필요가 없습니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="강의에 대한 간단한 소개나 공지를 입력하세요."
            />
          </div>

          <div className="flex items-center justify-between border border-gray-200 rounded-md px-4 py-3 bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-900">강의 공개 여부</p>
              <p className="text-xs text-gray-500">공개로 전환하면 학생들이 즉시 학습을 시작할 수 있습니다.</p>
            </div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">{isPublished ? '공개' : '비공개'}</span>
            </label>
          </div>

          {!isEdit && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">대표 유튜브 영상 링크</label>
                <input
                  type="url"
                  value={initialVideoUrl}
                  onChange={(e) => setInitialVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  강의 생성 시 첫 번째 학습 영상으로 등록됩니다. 유튜브 영상 링크를 사용하세요.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">영상 제목 (선택)</label>
                <input
                  type="text"
                  value={initialVideoTitle}
                  onChange={(e) => setInitialVideoTitle(e.target.value)}
                  placeholder="예) 오리엔테이션"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/teacher/courses')}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={saving}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? '저장 중...' : isEdit ? '강의 수정' : '강의 생성'}
            </button>
          </div>
        </form>

        {isEdit && courseDetail && (
          <section className="bg-white rounded-lg shadow p-5 space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">강의 요약</h2>
            <p className="text-sm text-gray-600">반: {courseDetail.className || `#${courseDetail.classId}`}</p>
            <p className="text-sm text-gray-600">공개 상태: {courseDetail.isPublished ? '공개' : '비공개'}</p>
            <p className="text-xs text-gray-400">
              마지막 수정: {courseDetail.updatedAt ? new Date(courseDetail.updatedAt).toLocaleString() : '-'}
            </p>
          </section>
        )}
      </div>
    </div>
  );
};

export default TeacherCourseEditorPage;
