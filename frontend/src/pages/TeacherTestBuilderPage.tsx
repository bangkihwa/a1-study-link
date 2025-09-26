import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { QuestionFormState } from '../components/tests/TestQuestionForm';
import TestQuestionForm from '../components/tests/TestQuestionForm';
import TestQuestionList from '../components/tests/TestQuestionList';
import { AdminUser, TestSummary, TestQuestion } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface TeacherTestBuilderPageProps {
  isCreate?: boolean;
}

const TeacherTestBuilderPage: React.FC<TeacherTestBuilderPageProps> = ({ isCreate }) => {
  const toDateString = (date: Date) => date.toISOString().slice(0, 10);
  const params = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState<TestSummary | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [loading, setLoading] = useState(!isCreate);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<TestQuestion | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [teacherOptions, setTeacherOptions] = useState<AdminUser[]>([]);
  const [classOptions, setClassOptions] = useState<Array<{ id: number; name: string; subjectName?: string | null }>>([]);
  const [courses, setCourses] = useState<Array<{ id: number; title: string; classId: number }>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [classLoading, setClassLoading] = useState(true);
  const [publishOption, setPublishOption] = useState<'immediate' | 'scheduled' | 'draft'>('draft');

  const testId = params.testId ? Number(params.testId) : undefined;
  const isNew = Boolean(isCreate) || !testId;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const response = await apiService.getAdminUsers({ role: 'teacher', status: 'all' });
        if (response.success) {
          setTeacherOptions(response.data || []);
        }
      } catch (err) {
        console.error('Failed to load teacher list', err);
      }
    };

    if (isAdmin) {
      loadTeachers();
    }
  }, [isAdmin]);

  useEffect(() => {
    const loadTeacherCourses = async () => {
      try {
        const resp = await apiService.getCourses();
        if (resp.success) {
          const list = (resp.data || []).map((c: any) => ({ id: c.id, title: c.title, classId: c.classId }));
          setCourses(list);
        }
      } catch {
        // ignore
      }
    };

    const loadClasses = async () => {
      try {
        setClassLoading(true);
        const response = await apiService.getCalendarContext();
        if (response.success) {
          setClassOptions(response.data?.classes || []);
        }
      } catch (err) {
        console.error('Failed to load class list', err);
      } finally {
        setClassLoading(false);
      }
    };

    loadClasses();
    loadTeacherCourses();
  }, []);

  const fetchTest = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTest(id);
      if (response.success && response.data) {
        const testData = response.data.test || response.data;
        setTest(testData);
        if (testData.isPublished) {
          setPublishOption('immediate');
        } else if (testData.publishAt) {
          setPublishOption('scheduled');
        } else {
          setPublishOption('draft');
        }
        setQuestions((response.data.questions || []).map((question: TestQuestion, index: number) => ({
          ...question,
          orderIndex: question.orderIndex ?? index
        })));
      } else {
        throw new Error(response.message || '테스트 정보를 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '테스트 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNew && testId) {
      fetchTest(testId);
    }
  }, [isNew, testId]);

  const mergedClassOptions = useMemo(() => {
    if (!test || !test.classId) {
      return classOptions;
    }
    if (classOptions.some((cls) => cls.id === test.classId)) {
      return classOptions;
    }
    return [
      ...classOptions,
      {
        id: test.classId,
        name: test.className || `반 #${test.classId}`,
        subjectName: test.subjectName ?? null
      }
    ];
  }, [classOptions, test]);

  const resetQuestionForm = () => {
    setEditingQuestion(null);
  };

  const handleCreateTest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const publishChoice = formData.get('publishOption') as 'immediate' | 'scheduled' | 'draft' | null;
    const publishAt = formData.get('publishAt') as string | null;
    const courseIdRaw = formData.get('courseId') as string | null;
  
    const payload: {
      title: string;
      description?: string;
      timeLimit?: number | null;
      totalScore?: number | null;
      teacherId?: number;
      dueDate: string;
      classId: number;
      isPublished?: boolean;
      publishAt?: string | null;
      courseId?: number | null;
    } = {
      title: (formData.get('title') as string).trim(),
      description: (formData.get('description') as string)?.trim() || undefined,
      timeLimit: formData.get('timeLimit') ? Number(formData.get('timeLimit')) : undefined,
      totalScore: formData.get('totalScore') ? Number(formData.get('totalScore')) : undefined,
      dueDate: (formData.get('dueDate') as string)?.trim(),
      classId: Number(formData.get('classId')),
      isPublished: publishChoice === 'immediate' ? true : false,
      publishAt: publishChoice === 'scheduled' ? (publishAt || null) : null,
      courseId: courseIdRaw ? Number(courseIdRaw) : undefined
    };
  
    if (!payload.title) {
      setError('테스트 제목을 입력해 주세요.');
      return;
    }
  
    if (!payload.dueDate) {
      setError('마감일을 선택해 주세요.');
      return;
    }
  
    if (!payload.classId || Number.isNaN(payload.classId)) {
      setError('반을 선택해 주세요.');
      return;
    }
  
    if (isAdmin) {
      const teacherIdRaw = (formData.get('teacherId') as string || '').trim();
      if (!teacherIdRaw) {
        setError('담당 강사를 선택해 주세요.');
        return;
      }
      const teacherId = Number(teacherIdRaw);
      if (Number.isNaN(teacherId)) {
        setError('유효한 담당 강사를 선택해 주세요.');
        return;
      }
      payload.teacherId = teacherId;
    }
  
    try {
      setSaving(true);
      const response = await apiService.createTest(payload);
      if (response.success && response.data?.testId) {
        navigate(`/teacher/tests/${response.data.testId}`);
      } else {
        throw new Error(response.message || '테스트 생성에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '테스트 생성 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!testId) return;

    const formData = new FormData(event.currentTarget);
    const title = (formData.get('title') as string)?.trim() || '';
    const description = (formData.get('description') as string)?.trim() || null;
    const timeLimit = formData.get('timeLimit') ? Number(formData.get('timeLimit')) : null;
    const totalScore = formData.get('totalScore') ? Number(formData.get('totalScore')) : null;
    const rawDueDate = (formData.get('dueDate') as string || '').trim();
    const rawClassId = (formData.get('classId') as string || '').trim();

    const publishOption = formData.get('publishOption') as 'immediate' | 'scheduled' | 'draft';
    const publishAt = formData.get('publishAt') as string;
    const courseIdRaw = formData.get('courseId') as string;

    const isPublished = publishOption === 'immediate';
    const scheduledPublishAt = publishOption === 'scheduled' ? publishAt : null;
    
    if (!title) {
      setError('테스트 제목을 입력해 주세요.');
      return;
    }

    if (!rawDueDate) {
      setError('마감일을 선택해 주세요.');
      return;
    }

    if (!rawClassId) {
      setError('반을 선택해 주세요.');
      return;
    }

    const parsedClassId = Number(rawClassId);
    if (Number.isNaN(parsedClassId)) {
      setError('유효한 반을 선택해 주세요.');
      return;
    }

    const payload = {
      title,
      description,
      timeLimit,
      totalScore,
      isPublished,
      publishAt: scheduledPublishAt,
      dueDate: rawDueDate,
      classId: parsedClassId,
      courseId: courseIdRaw ? Number(courseIdRaw) : undefined
    };

    try {
      setSaving(true);
      const response = await apiService.updateTest(testId, payload);
      if (response.success) {
        setStatusMessage('테스트 정보가 저장되었습니다.');
        fetchTest(testId);
      } else {
        throw new Error(response.message || '테스트 정보 저장에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '테스트 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuestionSubmit = async (data: QuestionFormState) => {
    if (!testId) return;
    try {
      setQuestionSubmitting(true);
      setStatusMessage(null);
      if (editingQuestion) {
        const response = await apiService.updateTestQuestion(editingQuestion.id, {
          questionText: data.questionText,
          questionData: data.questionData,
          points: data.points,
          orderIndex: editingQuestion.orderIndex
        });
        if (!response.success) {
          throw new Error(response.message || '문항 수정에 실패했습니다.');
        }
      } else {
        const response = await apiService.createTestQuestion({
          testId,
          type: data.type,
          questionText: data.questionText,
          questionData: data.questionData,
          points: data.points,
          orderIndex: questions.length
        });
        if (!response.success) {
          throw new Error(response.message || '문항 추가에 실패했습니다.');
        }
      }
      setStatusMessage(editingQuestion ? '문항이 수정되었습니다.' : '문항이 추가되었습니다.');
      resetQuestionForm();
      fetchTest(testId);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '문항 저장 중 오류가 발생했습니다.');
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (question: TestQuestion) => {
    if (!testId) return;
    if (!window.confirm('선택한 문항을 삭제하시겠습니까?')) {
      return;
    }
    try {
      const response = await apiService.deleteTestQuestion(question.id);
      if (!response.success) {
        throw new Error(response.message || '문항 삭제에 실패했습니다.');
      }
      setStatusMessage('문항이 삭제되었습니다.');
      if (editingQuestion?.id === question.id) {
        resetQuestionForm();
      }
      fetchTest(testId);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '문항 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleMoveQuestion = async (question: TestQuestion, direction: 'up' | 'down') => {
    if (!testId) return;
    const currentIndex = questions.findIndex((item) => item.id === question.id);
    if (currentIndex === -1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= questions.length) {
      return;
    }

    const reordered = [...questions];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(swapIndex, 0, moved);

    setQuestions(reordered.map((item, index) => ({ ...item, orderIndex: index })));
    try {
      const response = await apiService.reorderTestQuestions(testId, reordered.map((item) => item.id));
      if (!response.success) {
        throw new Error(response.message || '문항 순서를 저장하지 못했습니다.');
      }
      setStatusMessage('문항 순서가 변경되었습니다.');
      fetchTest(testId);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '문항 순서 변경 중 오류가 발생했습니다.');
    }
  };

  const initialFormValue = useMemo(() => {
    if (!editingQuestion) return undefined;
    return {
      id: editingQuestion.id,
      type: editingQuestion.type,
      questionText: editingQuestion.questionText,
      points: editingQuestion.points,
      questionData: editingQuestion.questionData
    };
  }, [editingQuestion]);

  if (isNew) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">새 테스트 만들기</h1>
          <p className="text-sm text-gray-600 mt-1">테스트 기본 정보를 입력한 뒤 문항을 추가할 수 있습니다.</p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
        )}
      <form className="bg-white rounded-lg shadow p-6 space-y-4" onSubmit={handleCreateTest}>
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당 강사</label>
            <select
              name="teacherId"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              defaultValue=""
              required
            >
              <option value="">강사를 선택하세요</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.username})
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
            <input
              name="dueDate"
              type="date"
              required
              defaultValue={toDateString(new Date())}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">반 선택</label>
            <select
              name="classId"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
              disabled={classLoading || classOptions.length === 0}
              defaultValue=""
            >
              <option value="" disabled>
                {classLoading ? '반 정보를 불러오는 중...' : '반을 선택하세요'}
              </option>
              {classOptions.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                  {cls.subjectName ? ` (${cls.subjectName})` : ''}
                </option>
              ))}
            </select>
            {!classLoading && classOptions.length === 0 && (
              <p className="mt-1 text-xs text-red-600">등록된 담당 반이 없습니다. 반을 먼저 설정해 주세요.</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">테스트 제목</label>
          <input
              name="title"
              type="text"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="예: 3월 모의고사 대비 테스트"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
            <textarea
              name="description"
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="테스트에 대한 간단한 설명을 작성하세요"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">총점</label>
              <input
                name="totalScore"
                type="number"
                min={1}
                defaultValue={100}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시간 제한 (분)</label>
              <input
                name="timeLimit"
                type="number"
                min={1}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">공개 설정</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="publishOption"
                  value="draft"
                  checked={publishOption === 'draft'}
                  onChange={() => setPublishOption('draft')}
                  className="h-4 w-4 text-blue-600 border-gray-300"
                />
                <span className="text-sm">비공개</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="publishOption"
                  value="immediate"
                  checked={publishOption === 'immediate'}
                  onChange={() => setPublishOption('immediate')}
                  className="h-4 w-4 text-blue-600 border-gray-300"
                />
                <span className="text-sm">즉시 공개</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="publishOption"
                  value="scheduled"
                  checked={publishOption === 'scheduled'}
                  onChange={() => setPublishOption('scheduled')}
                  className="h-4 w-4 text-blue-600 border-gray-300"
                />
                <span className="text-sm">예약 공개</span>
              </label>
            </div>
            {publishOption === 'scheduled' && (
              <input
                type="datetime-local"
                name="publishAt"
                className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || (!isAdmin && !classLoading && classOptions.length === 0)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? '생성 중...' : '테스트 생성'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/teacher/tests')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
            >
              목록으로 돌아가기
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">테스트 정보를 불러오는 중...</div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 text-gray-600">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => navigate('/teacher/tests')}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        >
          테스트 목록으로 돌아가기
        </button>
      </div>
    );
  }

  if (!test || !testId) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">테스트 빌더</h1>
          <p className="text-sm text-gray-600">문항을 추가하고 순서를 조정하여 테스트를 구성하세요.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/teacher/tests')}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
        >
          목록으로 돌아가기
        </button>
      </div>

      {statusMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">{statusMessage}</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

        <form className="bg-white rounded-lg shadow p-6 space-y-4" onSubmit={handleUpdateTest}>
        {isAdmin && test && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당 강사</label>
            <p className="text-sm text-gray-600">
              {teacherOptions.find((teacher) => teacher.id === test.teacherId)?.name || `강사 #${test.teacherId}`}
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연결할 강의(선택)</label>
            <select
              name="courseId"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="">선택 안 함</option>
              {courses
                .filter((c) => (!test?.classId || c.classId === test.classId))
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">테스트 제목</label>
            <input
              name="title"
              type="text"
              defaultValue={test.title}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시간 제한 (분)</label>
            <input
              name="timeLimit"
              type="number"
              min={1}
              defaultValue={test.timeLimit ?? ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연결할 강의(선택)</label>
            <select
              name="courseId"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="">선택 안 함</option>
              {courses
                .filter((c) => String(c.classId) === (document.querySelector('select[name="classId"]') as HTMLSelectElement | null)?.value || true)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">총점</label>
            <input
              name="totalScore"
              type="number"
              min={1}
              defaultValue={test.totalScore ?? 100}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">공개 설정</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="publishOption" value="draft" checked={publishOption === 'draft'} onChange={() => setPublishOption('draft')} className="h-4 w-4 text-blue-600 border-gray-300"/>
                <span className="text-sm">비공개</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="publishOption" value="immediate" checked={publishOption === 'immediate'} onChange={() => setPublishOption('immediate')} className="h-4 w-4 text-blue-600 border-gray-300"/>
                <span className="text-sm">즉시 공개</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="publishOption" value="scheduled" checked={publishOption === 'scheduled'} onChange={() => setPublishOption('scheduled')} className="h-4 w-4 text-blue-600 border-gray-300"/>
                <span className="text-sm">예약 공개</span>
              </label>
            </div>
            {publishOption === 'scheduled' && (
              <input
                type="datetime-local"
                name="publishAt"
                defaultValue={test.publishAt ? test.publishAt.slice(0, 16) : ''}
                className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
            <input
              name="dueDate"
              type="date"
              defaultValue={test.dueDate ? test.dueDate.substring(0, 10) : ''}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">반 선택</label>
            <select
              name="classId"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
              defaultValue={test.classId ?? ''}
            >
              <option value="" disabled>
                {classLoading ? '반 정보를 불러오는 중...' : '반을 선택하세요'}
              </option>
              {mergedClassOptions.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                  {cls.subjectName ? ` (${cls.subjectName})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={test.description || ''}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? '저장 중...' : '테스트 정보 저장'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/teacher/tests/${testId}/submissions`)}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            제출 현황 보기
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">문항 목록</h2>
          <TestQuestionList
            questions={questions}
            selectedQuestionId={editingQuestion?.id || null}
            onEdit={(question) => setEditingQuestion(question)}
            onDelete={handleDeleteQuestion}
            onMove={handleMoveQuestion}
          />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{editingQuestion ? '문항 수정' : '새 문항 추가'}</h2>
            {editingQuestion && (
              <button
                type="button"
                onClick={resetQuestionForm}
                className="text-xs text-blue-600 hover:underline"
              >
                새 문항 추가로 전환
              </button>
            )}
          </div>
          <TestQuestionForm
            mode={editingQuestion ? 'edit' : 'create'}
            initialValue={initialFormValue}
            submitting={questionSubmitting}
            onSubmit={handleQuestionSubmit}
            onCancel={editingQuestion ? resetQuestionForm : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default TeacherTestBuilderPage;
