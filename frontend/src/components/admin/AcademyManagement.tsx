import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';
import { AdminClass, AdminUser, ClassStudent, Subject } from '../../types';
import ClassAssignmentPanel from './ClassAssignmentPanel';

type ManagementTab = 'subjects' | 'classes' | 'courses';

interface SubjectFormState {
  name: string;
  description: string;
  gradeLevel: string;
  isActive: boolean;
}

const emptySubjectForm: SubjectFormState = {
  name: '',
  description: '',
  gradeLevel: '',
  isActive: true
};

interface ClassFormState {
  name: string;
  subjectId: string;
  teacherId: string;
  gradeLevel: string;
  maxStudents: string;
  isActive: boolean;
}

const emptyClassForm: ClassFormState = {
  name: '',
  subjectId: '',
  teacherId: '',
  gradeLevel: '',
  maxStudents: '30',
  isActive: true
};

const AcademyManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ManagementTab>('classes');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [teachers, setTeachers] = useState<AdminUser[]>([]);
  const [assignableStudents, setAssignableStudents] = useState<ClassStudent[]>([]);

  const [subjectForm, setSubjectForm] = useState<SubjectFormState>(emptySubjectForm);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [classForm, setClassForm] = useState<ClassFormState>(emptyClassForm);
  const [editingClass, setEditingClass] = useState<AdminClass | null>(null);
  const [selectedClassStudentIds, setSelectedClassStudentIds] = useState<number[]>([]);

  const [loading, setLoading] = useState({ subjects: true, classes: true, teachers: true, students: false });
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showArchivedSubjects, setShowArchivedSubjects] = useState(false);
  const [showArchivedClasses, setShowArchivedClasses] = useState(false);

  const resetFeedback = useCallback(() => {
    setError(null);
    setFeedback(null);
  }, []);

  const loadSubjects = useCallback(async (includeInactive: boolean) => {
    try {
      setLoading((prev) => ({ ...prev, subjects: true }));
      const response = await apiService.getAdminSubjects({ includeInactive });
      if (response.success) {
        setSubjects(response.data);
      } else {
        setError(response.message || '과목 목록을 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '과목 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading((prev) => ({ ...prev, subjects: false }));
    }
  }, []);

  const loadClasses = useCallback(async (includeInactive: boolean) => {
    try {
      setLoading((prev) => ({ ...prev, classes: true }));
      const response = await apiService.getAdminClasses({ includeInactive });
      if (response.success) {
        setClasses(response.data);
      } else {
        setError(response.message || '반 목록을 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '반 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading((prev) => ({ ...prev, classes: false }));
    }
  }, []);

  const loadTeachers = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, teachers: true }));
      const response = await apiService.getAdminUsers({ role: 'teacher', status: 'all' });
      if (response.success) {
        setTeachers(response.data);
      } else {
        setError(response.message || '강사 목록을 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '강사 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading((prev) => ({ ...prev, teachers: false }));
    }
  }, []);

  const loadAssignableStudents = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, students: true }));
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
        setAssignableStudents(students);
      } else {
        setError(response.message || '학생 목록을 불러오지 못했습니다.');
        setAssignableStudents([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '학생 목록을 불러오는 중 오류가 발생했습니다.');
      setAssignableStudents([]);
    } finally {
      setLoading((prev) => ({ ...prev, students: false }));
    }
  }, []);

  useEffect(() => {
    loadTeachers();
    loadAssignableStudents();
  }, [loadTeachers, loadAssignableStudents]);

  useEffect(() => {
    loadSubjects(showArchivedSubjects);
  }, [loadSubjects, showArchivedSubjects]);

  useEffect(() => {
    loadClasses(showArchivedClasses);
  }, [loadClasses, showArchivedClasses]);

  const handleSubjectFormChange = (key: keyof SubjectFormState, value: string | boolean) => {
    setSubjectForm((prev) => ({ ...prev, [key]: value } as SubjectFormState));
  };

  const handleClassFormChange = (key: keyof ClassFormState, value: string | boolean) => {
    setClassForm((prev) => ({ ...prev, [key]: value } as ClassFormState));
  };

  const submitSubjectForm = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();

    const payload: any = {
      name: subjectForm.name.trim(),
      description: subjectForm.description.trim() || undefined,
      gradeLevel: subjectForm.gradeLevel ? Number(subjectForm.gradeLevel) : undefined,
      isActive: subjectForm.isActive
    };

    try {
      if (editingSubject) {
        await apiService.updateAdminSubject(editingSubject.id, payload);
        setFeedback('과목 정보가 수정되었습니다.');
      } else {
        await apiService.createAdminSubject(payload);
        setFeedback('새 과목이 생성되었습니다.');
      }

      setSubjectForm(emptySubjectForm);
      setEditingSubject(null);
      loadSubjects(showArchivedSubjects);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(message || '과목 저장 중 오류가 발생했습니다.');
    }
  };

  const submitClassForm = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();

    if (!classForm.subjectId) {
      setError('과목을 선택해 주세요.');
      return;
    }

    const payload: any = {
      name: classForm.name.trim(),
      subjectId: Number(classForm.subjectId),
      teacherId: classForm.teacherId ? Number(classForm.teacherId) : null,
      gradeLevel: classForm.gradeLevel ? Number(classForm.gradeLevel) : undefined,
      maxStudents: classForm.maxStudents ? Number(classForm.maxStudents) : undefined,
      isActive: classForm.isActive,
      studentIds: selectedClassStudentIds
    };

    try {
      if (editingClass) {
        await apiService.updateAdminClass(editingClass.id, payload);
        setFeedback('반 정보가 수정되었습니다.');
      } else {
        await apiService.createAdminClass(payload);
        setFeedback('새 반이 생성되었습니다.');
      }

      setClassForm(emptyClassForm);
      setEditingClass(null);
      setSelectedClassStudentIds([]);
      loadClasses(showArchivedClasses);
      loadAssignableStudents();
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(message || '반 저장 중 오류가 발생했습니다.');
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name,
      description: subject.description || '',
      gradeLevel: subject.gradeLevel != null ? String(subject.gradeLevel) : '',
      isActive: subject.isActive
    });
    setActiveTab('subjects');
  };

  const loadClassStudentAssignments = async (classId: number) => {
    try {
      const response = await apiService.getAdminClassStudents(classId);
      if (response.success) {
        const assigned: number[] = (response.data || []).map((student: any) => Number(student.id));
        setSelectedClassStudentIds(assigned);
      } else {
        setError(response.message || '반 학생 목록을 불러오지 못했습니다.');
        setSelectedClassStudentIds([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '반 학생 목록을 불러오는 중 오류가 발생했습니다.');
      setSelectedClassStudentIds([]);
    }
  };

  const handleEditClass = (classRecord: AdminClass) => {
    setEditingClass(classRecord);
    setClassForm({
      name: classRecord.name,
      subjectId: String(classRecord.subjectId),
      teacherId: classRecord.teacherId ? String(classRecord.teacherId) : '',
      gradeLevel: classRecord.gradeLevel != null ? String(classRecord.gradeLevel) : '',
      maxStudents: String(classRecord.maxStudents),
      isActive: classRecord.isActive
    });
    setActiveTab('classes');
    setSelectedClassStudentIds([]);
    if (classRecord.id) {
      loadClassStudentAssignments(classRecord.id);
    }
  };

  const handleArchiveSubject = async (subjectId: number) => {
    resetFeedback();
    try {
      await apiService.archiveAdminSubject(subjectId);
      setFeedback('과목을 비활성화했습니다.');
      loadSubjects(showArchivedSubjects);
    } catch (err: any) {
      setError(err?.response?.data?.message || '과목 비활성화 중 오류가 발생했습니다.');
    }
  };

  const handleRestoreSubject = async (subjectId: number) => {
    resetFeedback();
    try {
      await apiService.updateAdminSubject(subjectId, { isActive: true });
      setFeedback('과목을 복구했습니다.');
      loadSubjects(showArchivedSubjects);
    } catch (err: any) {
      setError(err?.response?.data?.message || '과목 복구 중 오류가 발생했습니다.');
    }
  };

  const handleArchiveClass = async (classId: number) => {
    resetFeedback();
    try {
      await apiService.archiveAdminClass(classId);
      setFeedback('반을 비활성화했습니다.');
      loadClasses(showArchivedClasses);
      loadAssignableStudents();
    } catch (err: any) {
      setError(err?.response?.data?.message || '반 비활성화 중 오류가 발생했습니다.');
    }
  };

  const handleRestoreClass = async (classId: number) => {
    resetFeedback();
    try {
      await apiService.updateAdminClass(classId, { isActive: true });
      setFeedback('반을 복구했습니다.');
      loadClasses(showArchivedClasses);
    } catch (err: any) {
      setError(err?.response?.data?.message || '반 복구 중 오류가 발생했습니다.');
    }
  };

  const cancelSubjectEdit = () => {
    setEditingSubject(null);
    setSubjectForm(emptySubjectForm);
  };

  const cancelClassEdit = () => {
    setEditingClass(null);
    setClassForm(emptyClassForm);
    setSelectedClassStudentIds([]);
  };

  const activeSubjects = useMemo(() => subjects.filter((s) => s.isActive), [subjects]);

  const summaryMetrics = useMemo(() => {
    const activeClasses = classes.filter((cls) => cls.isActive);
    const activeClassCount = activeClasses.length;
    const totalClassCount = classes.length;
    const totalCapacity = activeClasses.reduce((sum, cls) => sum + (cls.maxStudents ?? 0), 0);
    const assignedToActive = activeClasses.reduce((sum, cls) => sum + (cls.studentCount ?? 0), 0);
    const unassignedStudents = assignableStudents.filter((student) => {
      const memberships = student.classIds ?? (student.classId != null ? [student.classId] : []);
      return memberships.length === 0;
    }).length;

    return {
      activeClassCount,
      totalClassCount,
      totalCapacity,
      assignedToActive,
      unassignedStudents
    };
  }, [classes, assignableStudents]);

  const assignmentPanelDisabled = !activeSubjects.length && !editingClass;

  const renderSubjectTab = () => (
    <section className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">과목 관리</h2>
          <p className="text-sm text-gray-500">학년별 과목을 생성하고 활성 상태를 관리합니다.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showArchivedSubjects}
            onChange={(e) => setShowArchivedSubjects(e.target.checked)}
            className="h-4 w-4"
          />
          비활성 과목 포함
        </label>
      </div>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submitSubjectForm}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">과목명</label>
          <input
            type="text"
            required
            value={subjectForm.name}
            onChange={(e) => handleSubjectFormChange('name', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="예: 중등 과학"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">학년 (선택)</label>
          <input
            type="number"
            min={1}
            max={12}
            value={subjectForm.gradeLevel}
            onChange={(e) => handleSubjectFormChange('gradeLevel', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="1~12"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
          <textarea
            value={subjectForm.description}
            onChange={(e) => handleSubjectFormChange('description', e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="과목에 대한 간단한 설명"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={subjectForm.isActive}
            onChange={(e) => handleSubjectFormChange('isActive', e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-gray-700">활성 상태</span>
        </div>
        <div className="md:col-span-2 flex justify-end gap-2">
          {editingSubject && (
            <button
              type="button"
              onClick={cancelSubjectEdit}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading.subjects}
          >
            {editingSubject ? '과목 수정' : '과목 생성'}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">과목명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학년</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading.subjects && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-gray-500">과목을 불러오는 중...</td>
              </tr>
            )}
            {!loading.subjects && subjects.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-gray-500">등록된 과목이 없습니다.</td>
              </tr>
            )}
            {!loading.subjects && subjects.map((subject) => (
              <tr key={subject.id} className={subject.isActive ? '' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-sm text-gray-900">{subject.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{subject.gradeLevel ?? '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{subject.description || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 text-xs font-medium rounded-md ${subject.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                    {subject.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEditSubject(subject)}
                      className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      수정
                    </button>
                    {subject.isActive ? (
                      <button
                        onClick={() => handleArchiveSubject(subject.id)}
                        className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                      >
                        비활성
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestoreSubject(subject.id)}
                        className="px-3 py-1 text-xs border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50"
                      >
                        복구
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderClassTab = () => {
    const capacityUsage = summaryMetrics.totalCapacity > 0
      ? Math.round((summaryMetrics.assignedToActive / summaryMetrics.totalCapacity) * 100)
      : null;

    return (
      <div className="space-y-4">
        <section className="grid grid-cols-1 xl:grid-cols-[420px,1fr] gap-4">
          <form className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4" onSubmit={submitClassForm}>
            <header className="space-y-1">
              <h2 className="text-lg font-semibold">반 정보</h2>
              <p className="text-sm text-gray-500">강사 배정과 정원, 학생을 한 번에 관리할 수 있습니다.</p>
            </header>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">반 이름</label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) => handleClassFormChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="예: 중3 수학 A반"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">과목</label>
                <select
                  required
                  value={classForm.subjectId}
                  onChange={(e) => handleClassFormChange('subjectId', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">과목 선택</option>
                  {subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                      disabled={!subject.isActive && subject.id !== editingClass?.subjectId}
                    >
                      {subject.name}
                      {!subject.isActive ? ' (비활성)' : ''}
                    </option>
                  ))}
                </select>
                {!subjects.length && (
                  <p className="text-xs text-red-500">먼저 과목을 생성해야 반을 등록할 수 있습니다.</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">담당 강사 (선택)</label>
                <select
                  value={classForm.teacherId}
                  onChange={(e) => handleClassFormChange('teacherId', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">강사 선택</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">학년 (선택)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={classForm.gradeLevel}
                    onChange={(e) => handleClassFormChange('gradeLevel', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="1~12"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">정원</label>
                  <input
                    type="number"
                    min={0}
                    value={classForm.maxStudents}
                    onChange={(e) => handleClassFormChange('maxStudents', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="예: 25"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={classForm.isActive}
                  onChange={(e) => handleClassFormChange('isActive', e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700">운영 중</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {editingClass && (
                <button
                  type="button"
                  onClick={cancelClassEdit}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={loading.classes || (!subjects.length && !editingClass)}
              >
                {editingClass ? '반 수정' : '반 생성'}
              </button>
            </div>
          </form>

          <ClassAssignmentPanel
            students={assignableStudents}
            selectedStudentIds={selectedClassStudentIds}
            selectedClassId={editingClass?.id ?? null}
            disabled={assignmentPanelDisabled}
            loading={loading.students}
            onSelectionChange={(ids) => setSelectedClassStudentIds(ids)}
          />
        </section>

        <section className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">반 목록</h2>
              <p className="text-sm text-gray-500">정원 대비 배정 현황과 상태를 한눈에 확인하세요.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showArchivedClasses}
                onChange={(e) => setShowArchivedClasses(e.target.checked)}
                className="h-4 w-4"
              />
              비활성 반 포함
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">운영 중 / 전체 반</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{summaryMetrics.activeClassCount} / {summaryMetrics.totalClassCount}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">배정 학생 수</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{summaryMetrics.assignedToActive}명</p>
              <p className="text-xs text-gray-400">{capacityUsage != null ? `정원 대비 ${capacityUsage}%` : '정원 미설정'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">미배정 학생</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{summaryMetrics.unassignedStudents}명</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반 이름</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">과목</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당 강사</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학년</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">배정/정원</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading.classes && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-sm text-gray-500">반을 불러오는 중...</td>
                  </tr>
                )}
                {!loading.classes && classes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-sm text-gray-500">등록된 반이 없습니다.</td>
                  </tr>
                )}
                {!loading.classes && classes.map((classRecord) => {
                  const studentCount = classRecord.studentCount ?? 0;
                  const capacity = classRecord.maxStudents ?? 0;
                  const percentage = capacity > 0 ? Math.min(100, Math.round((studentCount / capacity) * 100)) : null;
                  const isEditing = editingClass?.id === classRecord.id;

                  return (
                    <tr key={classRecord.id} className={`${classRecord.isActive ? '' : 'bg-gray-50'} ${isEditing ? 'ring-2 ring-blue-100' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-900">{classRecord.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{classRecord.subjectName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{classRecord.teacherName || '미배정'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{classRecord.gradeLevel ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {studentCount}명
                        {capacity > 0 ? ` / ${capacity}명 (${percentage}%)` : ' / 정원 미설정'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-md ${classRecord.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                          {classRecord.isActive ? '운영 중' : '비활성'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEditClass(classRecord)}
                            className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            수정
                          </button>
                          {classRecord.isActive ? (
                            <button
                              onClick={() => handleArchiveClass(classRecord.id)}
                              className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                            >
                              비활성
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestoreClass(classRecord.id)}
                              className="px-3 py-1 text-xs border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50"
                            >
                              복구
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  };

  const renderCourseTab = () => (
    <section className="bg-white rounded-lg shadow p-6 text-sm text-gray-600">
      <h2 className="text-lg font-semibold text-gray-900">강의 관리</h2>
      <p className="mt-2">강의 탭은 곧 개선 예정입니다. 반 관리 화면에서 강의 생성 시 워크플로우가 유연하게 이어지도록 설계 중입니다.</p>
    </section>
  );

  const tabOptions: Array<{ key: ManagementTab; label: string }> = [
    { key: 'subjects', label: '과목' },
    { key: 'classes', label: '반' },
    { key: 'courses', label: '강의' }
  ];

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">학원 관리</h1>
        <p className="text-gray-600">과목에서 반, 강의까지 한 화면에서 관리하고 배정 현황을 확인하세요.</p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {tabOptions.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm rounded-md border ${activeTab === tab.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {feedback && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{feedback}</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      {activeTab === 'classes' && renderClassTab()}
      {activeTab === 'subjects' && renderSubjectTab()}
      {activeTab === 'courses' && renderCourseTab()}
    </div>
  );
};

export default AcademyManagement;
