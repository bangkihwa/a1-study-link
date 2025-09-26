import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';
import { AdminClass, AdminCourseSummary, AdminUser, ClassStudent, ContentBlock, TestSummary } from '../../types';

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})([?&][^\s]*)?$/i;

interface CourseDetail extends AdminCourseSummary {
  contentBlocks: ContentBlock[];
}

interface CourseFormState {
  title: string;
  description: string;
  classId: string;
  teacherId: string;
  isPublished: boolean;
  initialVideoTitle: string;
  initialVideoUrl: string;
}

const emptyCourseForm: CourseFormState = {
  title: '',
  description: '',
  classId: '',
  teacherId: '',
  isPublished: false,
  initialVideoTitle: '',
  initialVideoUrl: ''
};

interface ContentBlockFormState {
  type: 'video' | 'test' | 'mindmap' | 'text';
  title: string;
  url: string;
  testId: string;
  text: string;
  isRequired: boolean;
}

const emptyBlockForm: ContentBlockFormState = {
  type: 'video',
  title: '',
  url: '',
  testId: '',
  text: '',
  isRequired: true
};

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<AdminCourseSummary[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [teachers, setTeachers] = useState<AdminUser[]>([]);
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);

  const [courseForm, setCourseForm] = useState<CourseFormState>(emptyCourseForm);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

  const [blockForm, setBlockForm] = useState<ContentBlockFormState>(emptyBlockForm);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);

  const [allStudents, setAllStudents] = useState<ClassStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [studentClassFilter, setStudentClassFilter] = useState<string>('all');
  const [studentSearch, setStudentSearch] = useState<string>('');

  const [loading, setLoading] = useState({ courses: true, detail: false, classes: true, teachers: true });
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const resetStatus = () => {
    setError(null);
    setFeedback(null);
  };

  const loadCourses = async () => {
    setLoading((prev) => ({ ...prev, courses: true }));
    try {
      const response = await apiService.getAdminCourses();
      if (response.success) {
        setCourses(response.data);
      } else {
        setError(response.message || '강의 목록을 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '강의 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading((prev) => ({ ...prev, courses: false }));
    }
  };

  const loadClasses = async () => {
    setLoading((prev) => ({ ...prev, classes: true }));
    try {
      const response = await apiService.getAdminClasses({ includeInactive: false });
      if (response.success) {
        setClasses(response.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '반 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading((prev) => ({ ...prev, classes: false }));
    }
  };

  const loadTeachers = async () => {
    setLoading((prev) => ({ ...prev, teachers: true }));
    try {
      const response = await apiService.getAdminUsers({ role: 'teacher', status: 'all' });
      if (response.success) {
        setTeachers(response.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '강사 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading((prev) => ({ ...prev, teachers: false }));
    }
  };

  const loadTests = async () => {
    try {
      const response = await apiService.getTests();
      if (response.success) {
        setTests(response.data || []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '테스트 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadAssignableStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await apiService.getAssignableStudents();
      if (response.success) {
        const students: ClassStudent[] = (response.data || []).map((student: any) => {
          const classIds: number[] = Array.isArray(student.classIds)
            ? student.classIds
            : (student.classId != null ? [student.classId] : []);
          const classNames: string[] = Array.isArray(student.classNames)
            ? student.classNames
            : (student.className ? [student.className] : []);
          return {
            id: student.id,
            name: student.name,
            email: student.email || null,
            classId: classIds[0] ?? null,
            className: classNames[0] ?? null,
            classIds,
            classNames
          };
        });
        setAllStudents(students);
      } else {
        setError(response.message || '학생 목록을 불러오지 못했습니다.');
        setAllStudents([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '학생 목록을 불러오는 중 오류가 발생했습니다.');
      setAllStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadCourseDetail = async (courseId: number) => {
    setLoading((prev) => ({ ...prev, detail: true }));
    try {
      const response = await apiService.getManageCourse(courseId);
      if (response.success) {
        const detail = response.data as CourseDetail;
        setCourseDetail(detail);
        const assignedIds = (detail.assignedStudents || []).map((student) => student.id);
        setSelectedStudentIds(assignedIds);
        setAllStudents((prev) => {
          if (!detail.assignedStudents) {
            return prev;
          }
          const map = new Map(prev.map((student) => [student.id, student]));
          detail.assignedStudents.forEach((student: any) => {
            const existing = map.get(student.id) || {
              id: student.id,
              name: student.name,
              email: student.email || null,
              classId: null,
              className: null,
              classIds: [],
              classNames: []
            };

            map.set(student.id, {
              ...existing,
              name: student.name || existing.name,
              email: student.email || existing.email || null,
              classId: existing.classId,
              className: existing.className,
              classIds: existing.classIds || [],
              classNames: existing.classNames || []
            });
          });
          return Array.from(map.values());
        });
        if (detail.classId) {
          setStudentClassFilter(String(detail.classId));
        }
      } else {
        setError(response.message || '강의 정보를 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '강의 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading((prev) => ({ ...prev, detail: false }));
    }
  };

  useEffect(() => {
    loadCourses();
    loadClasses();
    loadTeachers();
    loadTests();
    loadAssignableStudents();
  }, []);

  useEffect(() => {
    if (selectedCourseId != null) {
      loadCourseDetail(selectedCourseId);
    } else {
      setCourseDetail(null);
    }
  }, [selectedCourseId]);

  const handleCourseFormChange = (key: keyof CourseFormState, value: string | boolean) => {
    setCourseForm((prev) => ({ ...prev, [key]: value } as CourseFormState));

    if (key === 'classId') {
      if (typeof value === 'string' && value) {
        setStudentClassFilter(value);
      } else {
        setStudentClassFilter('all');
      }
    }
  };

  const handleSelectCourse = (course: AdminCourseSummary) => {
    setSelectedCourseId(course.id);
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      classId: String(course.classId),
      teacherId: course.teacherId ? String(course.teacherId) : '',
      isPublished: course.isPublished,
      initialVideoTitle: '',
      initialVideoUrl: ''
    });
    setBlockForm(emptyBlockForm);
    setEditingBlockId(null);
    resetStatus();
  };

  const resetCourseForm = () => {
    setCourseForm(emptyCourseForm);
    setEditingCourseId(null);
    setSelectedCourseId(null);
    setCourseDetail(null);
    setStudentClassFilter('all');
    setStudentSearch('');
    setSelectedStudentIds([]);
  };

  const submitCourseForm = async (event: React.FormEvent) => {
    event.preventDefault();
    resetStatus();
  
    if (!courseForm.classId) {
      setError('반을 선택하세요.');
      return;
    }
  
    if (selectedStudentIds.length === 0) {
      setError('강의를 수강할 학생을 한 명 이상 선택하세요.');
      return;
    }
  
    // 신규 강의 생성 시 초기 YouTube URL 필수
    if (!editingCourseId) {
      const url = (courseForm.initialVideoUrl || '').trim();
      if (!YOUTUBE_URL_REGEX.test(url)) {
        setError('유효한 YouTube URL을 입력하세요.');
        return;
      }
    }
  
    const basePayload: any = {
      title: courseForm.title.trim(),
      description: courseForm.description.trim() || undefined,
      classId: Number(courseForm.classId),
      teacherId: courseForm.teacherId ? Number(courseForm.teacherId) : undefined,
      isPublished: courseForm.isPublished,
      studentIds: selectedStudentIds
    };
  
    try {
      if (editingCourseId) {
        await apiService.updateCourse(editingCourseId, basePayload);
        setFeedback('강의 정보가 수정되었습니다.');
        await loadCourses();
        await loadCourseDetail(editingCourseId);
      } else {
        const createPayload = {
          ...basePayload,
          initialVideoUrl: (courseForm.initialVideoUrl || '').trim(),
          initialVideoTitle: (courseForm.initialVideoTitle || '').trim() || '첫 학습 영상'
        };
        const response = await apiService.createCourse(createPayload);
        if (response.success) {
          setFeedback('새 강의가 생성되었습니다.');
          await loadCourses();
          const newId = response.data?.id || response.data?.courseId;
          if (newId) {
            setSelectedCourseId(newId);
          }
        } else {
          setError(response.message || '강의 생성에 실패했습니다.');
        }
      }
      if (!editingCourseId) {
        setCourseForm(emptyCourseForm);
        setStudentClassFilter('all');
        setStudentSearch('');
        setSelectedStudentIds([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '강의 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    resetStatus();
    try {
      await apiService.deleteCourse(courseId);
      setFeedback('강의를 삭제했습니다.');
      if (selectedCourseId === courseId) {
        resetCourseForm();
      }
      await loadCourses();
    } catch (err: any) {
      setError(err?.response?.data?.message || '강의 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleTogglePublish = async (course: AdminCourseSummary) => {
    resetStatus();
    try {
      await apiService.publishCourse(course.id, !course.isPublished);
      setFeedback(course.isPublished ? '강의를 비공개로 전환했습니다.' : '강의를 공개했습니다.');
      await loadCourses();
      if (selectedCourseId === course.id) {
        await loadCourseDetail(course.id);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '공개 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleBlockFormChange = (key: keyof ContentBlockFormState, value: string | boolean) => {
    setBlockForm((prev) => ({ ...prev, [key]: value } as ContentBlockFormState));
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }
      return [...prev, studentId];
    });
  };

  const selectAllStudents = () => {
    setSelectedStudentIds(filteredStudents.map((student) => student.id));
  };

  const clearAllStudents = () => {
    setSelectedStudentIds([]);
  };

  const buildBlockContent = (form: ContentBlockFormState) => {
    switch (form.type) {
      case 'video':
        return { url: form.url.trim() };
      case 'mindmap':
        return { url: form.url.trim() };
      case 'test':
        return { testId: form.testId ? Number(form.testId) : undefined };
      case 'text':
      default:
        return { body: form.text };
    }
  };

  const populateBlockForm = (block: ContentBlock) => {
    const base: ContentBlockFormState = {
      type: block.type,
      title: block.title,
      url: '',
      testId: '',
      text: '',
      isRequired: block.isRequired
    };

    const content = block.content || {};
    switch (block.type) {
      case 'video':
      case 'mindmap':
        base.url = content.url || '';
        break;
      case 'test':
        base.testId = content.testId ? String(content.testId) : '';
        break;
      case 'text':
        base.text = content.body || content.text || '';
        break;
      default:
        break;
    }
    return base;
  };

  const submitBlockForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!courseDetail) {
      setError('강의를 먼저 선택하세요.');
      return;
    }

    resetStatus();

    if (!blockForm.title.trim()) {
      setError('콘텐츠 제목을 입력하세요.');
      return;
    }

    if ((blockForm.type === 'video' || blockForm.type === 'mindmap') && !blockForm.url.trim()) {
      setError('URL을 입력하세요.');
      return;
    }

    if (blockForm.type === 'video' && !YOUTUBE_URL_REGEX.test(blockForm.url.trim())) {
      setError('유효한 YouTube URL을 입력하세요.');
      return;
    }

    if (blockForm.type === 'test' && !blockForm.testId.trim()) {
      setError('연결할 테스트를 선택하세요.');
      return;
    }

    const payload = {
      type: blockForm.type,
      title: blockForm.title.trim(),
      content: buildBlockContent(blockForm),
      isRequired: blockForm.isRequired
    };

    try {
      if (editingBlockId) {
        await apiService.updateContentBlock(courseDetail.id, editingBlockId, payload);
        setFeedback('콘텐츠 블록을 수정했습니다.');
      } else {
        await apiService.createContentBlock(courseDetail.id, payload);
        setFeedback('새 콘텐츠 블록을 추가했습니다.');
      }
      setBlockForm(emptyBlockForm);
      setEditingBlockId(null);
      await loadCourseDetail(courseDetail.id);
    } catch (err: any) {
      setError(err?.response?.data?.message || '콘텐츠 블록 저장 중 오류가 발생했습니다.');
    }
  };

  const handleEditBlock = (block: ContentBlock) => {
    setEditingBlockId(block.id);
    setBlockForm(populateBlockForm(block));
  };

  const handleDeleteBlock = async (blockId: number) => {
    if (!courseDetail) return;
    resetStatus();
    try {
      await apiService.deleteContentBlock(courseDetail.id, blockId);
      setFeedback('콘텐츠 블록을 삭제했습니다.');
      await loadCourseDetail(courseDetail.id);
    } catch (err: any) {
      setError(err?.response?.data?.message || '콘텐츠 블록 삭제 중 오류가 발생했습니다.');
    }
  };

  const moveBlock = async (index: number, direction: 'up' | 'down') => {
    if (!courseDetail) return;
    const blocks = [...courseDetail.contentBlocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const temp = blocks[index];
    blocks[index] = blocks[newIndex];
    blocks[newIndex] = temp;

    setCourseDetail({ ...courseDetail, contentBlocks: blocks });

    try {
      await apiService.reorderContentBlocks(courseDetail.id, blocks.map((b) => b.id));
      setFeedback('콘텐츠 순서를 변경했습니다.');
    } catch (err: any) {
      setError(err?.response?.data?.message || '콘텐츠 순서 변경 중 오류가 발생했습니다.');
      await loadCourseDetail(courseDetail.id);
    }
  };

  const activeTeachers = useMemo(() => teachers.filter((t) => t.isActive), [teachers]);
  const availableClasses = useMemo(() => {
    const set = new Map<number, string>();
    allStudents.forEach((student) => {
      (student.classIds ?? (student.classId != null ? [student.classId] : [])).forEach((id, index) => {
        const label = (student.classNames && student.classNames[index]) || student.className || `반 #${id}`;
        set.set(id, label);
      });
    });
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [allStudents]);

  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();
    return allStudents.filter((student) => {
      if (studentClassFilter !== 'all') {
        const targetClassId = Number(studentClassFilter);
        const memberships = student.classIds ?? (student.classId != null ? [student.classId] : []);
        if (Number.isInteger(targetClassId) && !memberships.includes(targetClassId)) {
          return false;
        }
      }

      if (!search) {
        return true;
      }

      return (
        student.name.toLowerCase().includes(search) ||
        (student.email ?? '').toLowerCase().includes(search)
      );
    });
  }, [allStudents, studentClassFilter, studentSearch]);
  const teacherNameMap = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher.name])), [teachers]);
  const courseTeacherId = courseDetail?.teacherId ?? null;

  const filteredTests = useMemo(() => {
    if (!courseTeacherId) {
      return tests;
    }
    return tests.filter((test) => test.teacherId === courseTeacherId);
  }, [tests, courseTeacherId]);
  const selectedTestOption = useMemo(() => (
    filteredTests.some((test) => String(test.id) === blockForm.testId) ? blockForm.testId : ''
  ), [filteredTests, blockForm.testId]);

  const handleOpenTestBuilder = () => {
    window.open('/teacher/tests/create', '_blank', 'noopener');
  };

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">강의 관리</h1>
        <p className="text-gray-600">강의 정보를 생성·수정하고 콘텐츠를 관리하세요.</p>
      </header>

      {feedback && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{feedback}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <section className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">강의 정보</h2>
            <p className="text-sm text-gray-500">타이틀, 담당 반/강사를 지정하고 공개 여부를 조정합니다.</p>
          </div>
          {editingCourseId && (
            <button
              type="button"
              onClick={resetCourseForm}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              새 강의 만들기
            </button>
          )}
        </div>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submitCourseForm}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">강의명</label>
            <input
              type="text"
              required
              value={courseForm.title}
              onChange={(e) => handleCourseFormChange('title', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당 반</label>
            <select
              required
              value={courseForm.classId}
              onChange={(e) => handleCourseFormChange('classId', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">반 선택</option>
              {classes.filter((c) => c.isActive).map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.subjectName ? `- ${cls.subjectName}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당 강사 (선택)</label>
            <select
              value={courseForm.teacherId}
              onChange={(e) => handleCourseFormChange('teacherId', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">반 담당 강사 사용</option>
              {activeTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} {teacher.isApproved ? '' : '(미승인)'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">공개 여부</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={courseForm.isPublished}
                onChange={(e) => handleCourseFormChange('isPublished', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">공개</span>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">수강 학생</label>
          {loadingStudents ? (
            <p className="text-sm text-gray-500">학생 목록을 불러오는 중...</p>
          ) : allStudents.length === 0 ? (
            <p className="text-sm text-gray-500">배정 가능한 학생 계정이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <label className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">반 필터</span>
                    <select
                      value={studentClassFilter}
                      onChange={(e) => setStudentClassFilter(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                      <option value="all">전체</option>
                      {availableClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">검색</span>
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="이름 또는 이메일"
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAllStudents}
                    className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    필터 결과 전체 선택
                  </button>
                  <button
                    type="button"
                    onClick={clearAllStudents}
                    className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    전체 해제
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">
                    선택된 학생 {selectedStudentIds.length}명 · 필터 결과 {filteredStudents.length}명 · 전체 {allStudents.length}명
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredStudents.map((student) => {
                    const checked = selectedStudentIds.includes(student.id);
                    return (
                      <label
                        key={student.id}
                        className={`flex items-center gap-2 border rounded-md px-3 py-2 text-sm transition ${
                          checked ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="h-4 w-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{student.name}</p>
                  <p className="text-xs text-gray-500">
                            {student.email || '이메일 없음'}
                            {(student.classNames && student.classNames.length)
                              ? ` · ${student.classNames.join(', ')}`
                              : student.className
                                ? ` · ${student.className}`
                                : ''}
                  </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
            {!editingCourseId && (
              <div className="md:col-span-2 border-t border-gray-200 pt-4 space-y-3">
                <h3 className="text-md font-semibold text-gray-800">초기 학습 영상</h3>
                <p className="text-xs text-gray-500">
                  새 강의 생성 시 첫 번째 학습 영상의 YouTube URL이 필요합니다. 생성 후에도 콘텐츠 블록에서 추가/수정할 수 있습니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">영상 제목 (선택)</label>
                    <input
                      type="text"
                      value={courseForm.initialVideoTitle}
                      onChange={(e) => handleCourseFormChange('initialVideoTitle', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="첫 학습 영상"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL (필수)</label>
                    <input
                      type="text"
                      required
                      value={courseForm.initialVideoUrl}
                      onChange={(e) => handleCourseFormChange('initialVideoUrl', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      예: https://youtu.be/XXXXXXXXXXX 또는 https://www.youtube.com/watch?v=XXXXXXXXXXX
                    </p>
                  </div>
                </div>
              </div>
            )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              value={courseForm.description}
              onChange={(e) => handleCourseFormChange('description', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="강의에 대한 설명을 입력하세요."
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading.classes}
            >
              {editingCourseId ? '강의 수정' : '강의 생성'}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader>강의명</TableHeader>
                <TableHeader>담당 강사</TableHeader>
                <TableHeader>반</TableHeader>
                <TableHeader>상태</TableHeader>
                <TableHeader>관리</TableHeader>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading.courses && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-gray-500">강의를 불러오는 중...</td>
                </tr>
              )}
              {!loading.courses && courses.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-gray-500">등록된 강의가 없습니다.</td>
                </tr>
              )}
              {!loading.courses && courses.map((course) => (
                <tr key={course.id} className={selectedCourseId === course.id ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{course.title}</div>
                    {course.description && (
                      <div className="text-sm text-gray-500 max-w-xs truncate">{course.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{course.teacherName || '미배정'}</div>
                    {course.teacherEmail && (
                      <div className="text-xs text-gray-500">{course.teacherEmail}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{course.className || '미배정'}</div>
                    {course.gradeLevel && (
                      <div className="text-xs text-gray-500">{course.gradeLevel} 학년</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                    <StatusBadge status={course.isPublished ? 'success' : 'warning'}>
                      {course.isPublished ? '공개' : '비공개'}
                    </StatusBadge>
                      <ToggleSwitch
                        checked={course.isPublished}
                        onChange={() => handleTogglePublish(course)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSelectCourse(course)}
                        className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        콘텐츠/학생 관리
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {courseDetail && (
        <section className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
          <div className="border border-gray-100 rounded-md p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">배정된 학생</h3>
            {(courseDetail.assignedStudents && courseDetail.assignedStudents.length > 0) ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {courseDetail.assignedStudents.map((student) => (
                  <span
                    key={student.id}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700"
                  >
                    {student.name}
                    {student.email ? ` · ${student.email}` : ''}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">현재 이 강의에 배정된 학생이 없습니다.</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">콘텐츠 블록</h2>
              <p className="text-sm text-gray-500">강의에 포함된 콘텐츠를 관리합니다.</p>
            </div>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submitBlockForm}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
              <select
                value={blockForm.type}
                onChange={(e) => {
                  const nextType = e.target.value as ContentBlockFormState['type'];
                  setBlockForm((prev) => ({ ...prev, type: nextType }));
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="video">동영상</option>
                <option value="test">테스트</option>
                <option value="mindmap">마인드맵</option>
                <option value="text">텍스트</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
              <input
                type="text"
                required
                value={blockForm.title}
                onChange={(e) => handleBlockFormChange('title', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            {(blockForm.type === 'video' || blockForm.type === 'mindmap') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="text"
                  value={blockForm.url}
                  onChange={(e) => handleBlockFormChange('url', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="https://"
                />
              </div>
            )}

            {blockForm.type === 'test' && (
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">테스트 선택</label>
                  <select
                    value={selectedTestOption}
                    onChange={(e) => handleBlockFormChange('testId', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">테스트를 선택하세요</option>
                    {filteredTests.map((test) => (
                      <option key={test.id} value={String(test.id)}>
                        {test.title}
                        {teacherNameMap.get(test.teacherId) ? ` · ${teacherNameMap.get(test.teacherId)}` : ''}
                      </option>
                    ))}
                  </select>
                  {filteredTests.length === 0 && (
                    <p className="mt-1 text-xs text-gray-500">연결 가능한 테스트가 없습니다. 새로운 테스트를 생성해 주세요.</p>
                  )}
                </div>
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={handleOpenTestBuilder}
                    className="px-4 py-2 text-sm border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50"
                  >
                    새 테스트 만들기
                  </button>
                  <p className="text-xs text-gray-500 mt-1">새로운 테스트를 생성한 뒤 목록에서 선택해 연결할 수 있습니다.</p>
                </div>
              </div>
            )}

            {blockForm.type === 'text' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">본문</label>
                <textarea
                  value={blockForm.text}
                  onChange={(e) => handleBlockFormChange('text', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={blockForm.isRequired}
                onChange={(e) => handleBlockFormChange('isRequired', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">필수 콘텐츠</span>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              {editingBlockId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingBlockId(null);
                    setBlockForm(emptyBlockForm);
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={loading.detail}
              >
                {editingBlockId ? '콘텐츠 수정' : '콘텐츠 추가'}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {loading.detail && <p className="text-sm text-gray-500">콘텐츠를 불러오는 중...</p>}
            {!loading.detail && courseDetail.contentBlocks.length === 0 && (
              <p className="text-sm text-gray-500">등록된 콘텐츠 블록이 없습니다.</p>
            )}
            {!loading.detail && courseDetail.contentBlocks.map((block, index) => (
              <div key={block.id} className="border border-gray-200 rounded-md p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">{block.title}</h3>
                    <p className="text-xs text-gray-500">유형: {block.type} · {block.isRequired ? '필수' : '선택'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => moveBlock(index, 'up')}
                      className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                      disabled={index === 0}
                    >
                      위로
                    </button>
                    <button
                      onClick={() => moveBlock(index, 'down')}
                      className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                      disabled={index === courseDetail.contentBlocks.length - 1}
                    >
                      아래로
                    </button>
                    <button
                      onClick={() => handleEditBlock(block)}
                      className="px-3 py-1 text-xs border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <pre className="bg-gray-50 text-gray-700 text-xs rounded-md p-3 overflow-auto">{JSON.stringify(block.content, null, 2)}</pre>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
    {children}
  </th>
);

const TableCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="px-4 py-3 text-sm text-gray-700 align-top whitespace-nowrap">{children}</td>
);

const StatusBadge: React.FC<{ status: 'success' | 'warning'; children: React.ReactNode }> = ({ status, children }) => {
  const styles: Record<string, string> = {
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200'
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[status]}`}>{children}</span>;
};

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    }`}
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export default CourseManagement;
