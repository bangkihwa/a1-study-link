import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import YouTubePlayer from '../components/student/YouTubePlayer';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  ContentBlock,
  ContentBlockStudentStatus,
  Course,
  QnaItem,
  StudentTestSummary,
  Test,
  TestAttempt,
  TestAttemptQuestion,
  VideoProgressSummary
} from '../types';

const parseYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '');
    }
    if (parsed.searchParams.has('v')) {
      return parsed.searchParams.get('v');
    }
    if (parsed.pathname.includes('/embed/')) {
      return parsed.pathname.split('/embed/')[1];
    }
    return null;
  } catch (error) {
    return null;
  }
};

interface TestState {
  attempt: TestAttempt | null;
  detail: StudentTestSummary | Test | null;
  answers: Record<string, any>;
  loading: boolean;
  error: string | null;
  statusMessage: string | null;
}

const emptyTestState: TestState = {
  attempt: null,
  detail: null,
  answers: {},
  loading: false,
  error: null,
  statusMessage: null
};

interface CourseDetail extends Course {
  contentBlocks?: ContentBlock[];
  videoSummary?: VideoProgressSummary[];
}

const computeStudentProgress = (blocks: ContentBlock[]): {
  studentProgress: Course['studentProgress'];
  nextContent?: Course['nextContent'];
} => {
  const sorted = [...blocks].sort((a, b) => a.orderIndex - b.orderIndex);
  const required = sorted.filter((block) => block.isRequired !== false && (block.type === 'video' || block.type === 'test'));
  const completed = required.filter((block) => block.studentStatus?.isCompleted).length;
  const total = required.length;
  const rawProgress = total > 0 ? (completed / total) * 100 : sorted.length > 0 ? 100 : 0;
  const progressPercentage = Math.min(100, rawProgress);
  const nextBlock = required.find((block) => !block.studentStatus?.isCompleted);

  const nextContent = nextBlock
    ? {
        blockId: nextBlock.id,
        type: nextBlock.type,
        title: nextBlock.title,
        isRequired: nextBlock.isRequired !== false,
        status: 'pending' as const,
        progressPercentage: nextBlock.type === 'video' ? nextBlock.studentStatus?.progressPercentage ?? 0 : undefined,
        videoId: nextBlock.type === 'video' ? (nextBlock.content as any)?.videoId ?? null : undefined,
        testId: nextBlock.type === 'test' ? Number((nextBlock.content as any)?.testId) || null : undefined
      }
    : undefined;

  return {
    studentProgress: {
      progressPercentage,
      completedBlocks: completed,
      totalBlocks: total,
      nextUncompletedTitle: nextBlock?.title,
      nextUncompletedBlockId: nextBlock?.id
    },
    nextContent: nextContent ?? undefined
  };
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const CourseLearningPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const numericCourseId = courseId ? Number(courseId) : NaN;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentVideoBlockId, setCurrentVideoBlockId] = useState<number | null>(null);
  const [currentInfoBlockId, setCurrentInfoBlockId] = useState<number | null>(null);
  const [currentTestBlockId, setCurrentTestBlockId] = useState<number | null>(null);

  const [testState, setTestState] = useState<TestState>(emptyTestState);
  const activeTestBlockRef = useRef<number | null>(null);

  const [studentTests, setStudentTests] = useState<StudentTestSummary[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsError, setTestsError] = useState<string | null>(null);

  const [qnaItems, setQnaItems] = useState<QnaItem[]>([]);
  const [qnaLoading, setQnaLoading] = useState(true);
  const [qnaError, setQnaError] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionPublic, setQuestionPublic] = useState(true);
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState<Record<number, string>>({});
  const [answerSubmittingId, setAnswerSubmittingId] = useState<number | null>(null);

  const [generalMessage, setGeneralMessage] = useState<string | null>(null);
  const [autoplay, setAutoplay] = useState(false);

  const loadQna = useCallback(async () => {
    if (Number.isNaN(numericCourseId)) {
      setQnaError('유효하지 않은 강의 ID입니다.');
      setQnaLoading(false);
      return;
    }
    try {
      setQnaLoading(true);
      setQnaError(null);
      const response = await apiService.getCourseQna(numericCourseId);
      if (!response.success) {
        throw new Error(response.message || '질문 목록을 불러오지 못했습니다.');
      }
      setQnaItems(response.data || []);
    } catch (err: any) {
      setQnaError(err?.response?.data?.message || err?.message || '질문 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setQnaLoading(false);
    }
  }, [numericCourseId]);

  const loadStudentTests = useCallback(async () => {
    if (!isStudent) {
      return;
    }
    try {
      setTestsLoading(true);
      setTestsError(null);
      const response = await apiService.getTests();
      if (response.success) {
        setStudentTests(response.data || []);
      } else {
        throw new Error(response.message || '학생 테스트 목록을 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setTestsError(err?.response?.data?.message || err?.message || '학생 테스트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setTestsLoading(false);
    }
  }, [isStudent]);

  const blocks = useMemo(() => course?.contentBlocks ?? [], [course]);
  const currentVideoBlock = useMemo(() => blocks.find((block) => block.id === currentVideoBlockId && block.type === 'video') || null, [blocks, currentVideoBlockId]);
  const currentVideoId = useMemo(() => {
    if (!currentVideoBlock) {
      return null;
    }
    const content: any = currentVideoBlock.content || {};
    return content.videoId || parseYouTubeVideoId(content.url || '');
  }, [currentVideoBlock]);
  const currentInfoBlock = useMemo(() => blocks.find((block) => block.id === currentInfoBlockId && block.type !== 'video' && block.type !== 'test') || null, [blocks, currentInfoBlockId]);
  const currentTestBlock = useMemo(() => blocks.find((block) => block.id === currentTestBlockId && block.type === 'test') || null, [blocks, currentTestBlockId]);
  const studentTestMap = useMemo(() => {
    return studentTests.reduce((map, test) => {
      map.set(test.id, test);
      return map;
    }, new Map<number, StudentTestSummary>());
  }, [studentTests]);

  const courseTestEntries = useMemo(() => {
    if (!course) {
      return [];
    }
    const entries: Array<{ kind: 'block' | 'standalone'; block?: ContentBlock; test?: StudentTestSummary }> = [];
    const blockTestIds = new Set<number>();

    blocks.filter((block) => block.type === 'test').forEach((block) => {
      const testId = Number((block.content as any)?.testId);
      if (Number.isInteger(testId) && testId > 0) {
        blockTestIds.add(testId);
      }
      entries.push({
        kind: 'block',
        block,
        test: Number.isInteger(testId) && testId > 0 ? studentTestMap.get(testId) : undefined
      });
    });

    if (isStudent) {
      studentTests.forEach((test) => {
        const matchesCourse = test.courseId === course.id;
        const matchesClass = course.classId != null && test.classId === course.classId;
        if (!blockTestIds.has(test.id) && (matchesCourse || matchesClass)) {
          entries.push({ kind: 'standalone', test });
        }
      });
    }

    return entries;
  }, [blocks, course, isStudent, studentTestMap, studentTests]);


  const handleVideoProgressUpdate = useCallback((blockId: number, status: ContentBlockStudentStatus) => {
    setCourse((prev) => {
      if (!prev || !prev.contentBlocks) {
        return prev;
      }
      const updatedBlocks = prev.contentBlocks.map((block) => {
        if (block.id !== blockId) {
          return block;
        }
        return {
          ...block,
          studentStatus: {
            ...(block.studentStatus ?? {}),
            ...status
          }
        };
      });

      const { studentProgress, nextContent } = computeStudentProgress(updatedBlocks);

      return {
        ...prev,
        contentBlocks: updatedBlocks,
        studentProgress,
        nextContent
      };
    });
  }, []);

  const handleVideoProgress = useRef<Record<number, number>>({});

  const onVideoProgress = useCallback(
    async (watched: number, total: number) => {
      if (!currentVideoBlock) return;
      const blockId = currentVideoBlock.id;
      const lastSent = handleVideoProgress.current[blockId] ?? 0;
      const delta = watched - lastSent;
      const shouldSend = watched === 0 || watched >= total || delta >= 5;
      if (!shouldSend) {
        return;
      }
      handleVideoProgress.current[blockId] = watched;

      try {
        const response = await apiService.updateVideoProgress({
          videoBlockId: blockId,
          watchedDuration: watched,
          totalDuration: total
        });
        if (response.success && response.data) {
          const status: ContentBlockStudentStatus = {
            isCompleted: Boolean(response.data.isCompleted),
            progressPercentage: Number(response.data.progressPercentage ?? 0),
            watchedDuration: Number(response.data.watchedDuration ?? watched),
            totalDuration: Number(response.data.totalDuration ?? total),
            lastWatchedAt: response.data.lastWatchedAt ?? new Date().toISOString()
          };
          handleVideoProgressUpdate(blockId, status);
        }
      } catch (err) {
        console.error('Failed to update video progress', err);
      }
    },
    [currentVideoBlock, handleVideoProgressUpdate]
  );

  const onVideoComplete = useCallback(() => {
    if (!currentVideoBlock) return;
    handleVideoProgressUpdate(currentVideoBlock.id, {
      ...(currentVideoBlock.studentStatus ?? {}),
      isCompleted: true,
      progressPercentage: 100,
      watchedDuration: currentVideoBlock.studentStatus?.totalDuration ?? undefined,
      totalDuration: currentVideoBlock.studentStatus?.totalDuration
    });
    setGeneralMessage('영상 시청이 완료되었습니다. 계속 학습을 진행하세요.');
  }, [currentVideoBlock, handleVideoProgressUpdate]);

  const loadTestData = useCallback(
    async (testId: number, blockId: number) => {
      setTestState((prev) => ({ ...prev, loading: true, error: null, statusMessage: null }));
      activeTestBlockRef.current = blockId;
      try {
        if (user?.role === 'student') {
          const response = await apiService.getTestAttempt(testId);
          if (!response.success) {
            throw new Error(response.message || '테스트 정보를 불러오지 못했습니다.');
          }
          if (activeTestBlockRef.current !== blockId) {
            return;
          }
          const attempt = response.data as TestAttempt;
          setTestState({
            attempt,
            detail: attempt.test as any,
            answers: {},
            loading: false,
            error: null,
            statusMessage: null
          });
        } else {
          const response = await apiService.getTest(testId);
          if (!response.success) {
            throw new Error(response.message || '테스트 정보를 불러오지 못했습니다.');
          }
          if (activeTestBlockRef.current !== blockId) {
            return;
          }
          setTestState({
            attempt: null,
            detail: response.data as Test,
            answers: {},
            loading: false,
            error: null,
            statusMessage: null
          });
        }
      } catch (err: any) {
        if (activeTestBlockRef.current !== blockId) {
          return;
        }
        setTestState((prev) => ({ ...prev, loading: false, error: err?.response?.data?.message || err?.message || '테스트 데이터를 불러오는 중 오류가 발생했습니다.' }));
      }
    },
    [user?.role]
  );

  const handleSelectTestBlock = useCallback(
    (block: ContentBlock) => {
      const testId = Number((block.content as any)?.testId);
      if (!Number.isInteger(testId) || testId <= 0) {
        setTestState((prev) => ({ ...prev, error: '연결된 테스트 정보를 찾을 수 없습니다.' }));
        return;
      }
      setCurrentTestBlockId(block.id);
      loadTestData(testId, block.id);
    },
    [loadTestData]
  );

  const handleSelectInfoBlock = useCallback((block: ContentBlock) => {
    setCurrentInfoBlockId(block.id);
  }, []);

  const loadCourse = useCallback(async () => {
    if (Number.isNaN(numericCourseId)) {
      setError('유효하지 않은 강의 ID입니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCourse(numericCourseId);
      if (!response.success) {
        throw new Error(response.message || '강의 정보를 불러오지 못했습니다.');
      }
      const data = response.data as CourseDetail;
      const blocks = Array.isArray(data.contentBlocks) ? data.contentBlocks : [];
      setCourse(data);

      const preferredNext = data.nextContent?.blockId || null;
      const firstVideo = blocks.find((block) => block.type === 'video');
      const initialVideoId = preferredNext && blocks.find((block) => block.id === preferredNext && block.type === 'video')
        ? preferredNext
        : firstVideo?.id ?? null;
      setCurrentVideoBlockId(initialVideoId);

      const initialInfoBlock = preferredNext && blocks.find((block) => block.id === preferredNext && block.type !== 'video' && block.type !== 'test')
        ? preferredNext
        : null;
      setCurrentInfoBlockId(initialInfoBlock);

      const pendingTestBlock = preferredNext && blocks.find((block) => block.id === preferredNext && block.type === 'test')
        ? preferredNext
        : null;
      if (pendingTestBlock) {
        const target = blocks.find((block) => block.id === pendingTestBlock);
        if (target) {
          handleSelectTestBlock(target);
        }
      } else {
        setCurrentTestBlockId(null);
        setTestState(emptyTestState);
        activeTestBlockRef.current = null;
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '강의 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [handleSelectTestBlock, numericCourseId]);

  useEffect(() => {
    loadCourse();
    loadQna();
  }, [loadCourse, loadQna]);

  useEffect(() => {
    if (isStudent) {
      loadStudentTests();
    }
  }, [isStudent, loadStudentTests]);

  const handleSubmitTest = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (user?.role !== 'student') {
        return;
      }
      const activeBlock = currentTestBlock;
      const testId = Number(testState.attempt?.test?.id);
      if (!activeBlock || !Number.isInteger(testId)) {
        setTestState((prev) => ({ ...prev, error: '제출 가능한 테스트가 없습니다.' }));
        return;
      }

      try {
        setTestState((prev) => ({ ...prev, loading: true, error: null, statusMessage: null }));
        const response = await apiService.submitTest({
          testId,
          answers: testState.answers
        });
        if (!response.success) {
          throw new Error(response.message || '테스트 제출에 실패했습니다.');
        }

        const requiresManual = response.data?.requiresManualGrading;
        const score = response.data?.score;
        const message = requiresManual
          ? '제출이 완료되었습니다. 서술형 채점 결과는 추후 확인 가능합니다.'
          : `제출이 완료되었습니다. 자동 채점 점수: ${score ?? 0}점`;
        setTestState((prev) => ({ ...prev, loading: false, statusMessage: message }));
        setGeneralMessage('테스트 제출을 완료했습니다.');
        await loadCourse();
      } catch (err: any) {
        setTestState((prev) => ({
          ...prev,
          loading: false,
          error: err?.response?.data?.message || err?.message || '테스트 제출 중 오류가 발생했습니다.'
        }));
      }
    },
    [currentTestBlock, loadCourse, testState.answers, testState.attempt, user?.role]
  );

  const handleTestAnswerChange = useCallback((questionId: number, value: any) => {
    setTestState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [String(questionId)]: value
      }
    }));
  }, []);

  const handleAskQuestion = useCallback(async () => {
    if (!questionText.trim() || Number.isNaN(numericCourseId)) {
      return;
    }
    try {
      setQuestionSubmitting(true);
      const response = await apiService.createQnaQuestion(numericCourseId, questionText.trim(), questionPublic);
      if (!response.success) {
        throw new Error(response.message || '질문 등록에 실패했습니다.');
      }
      setQuestionText('');
      setQuestionPublic(true);
      await loadQna();
      setGeneralMessage('질문이 등록되었습니다.');
    } catch (err: any) {
      setQnaError(err?.response?.data?.message || err?.message || '질문 등록 중 오류가 발생했습니다.');
    } finally {
      setQuestionSubmitting(false);
    }
  }, [loadQna, numericCourseId, questionPublic, questionText]);

  const handleAnswerQuestion = useCallback(async (item: QnaItem) => {
    const draft = answerDrafts[item.id];
    if (!draft || !draft.trim()) {
      return;
    }
    try {
      setAnswerSubmittingId(item.id);
      const response = await apiService.answerQnaQuestion(item.id, draft.trim());
      if (!response.success) {
        throw new Error(response.message || '답변 등록에 실패했습니다.');
      }
      setAnswerDrafts((prev) => ({ ...prev, [item.id]: '' }));
      await loadQna();
      setGeneralMessage('답변이 등록되었습니다.');
    } catch (err: any) {
      setQnaError(err?.response?.data?.message || err?.message || '답변 등록 중 오류가 발생했습니다.');
    } finally {
      setAnswerSubmittingId(null);
    }
  }, [answerDrafts, loadQna]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">강의 정보를 불러오는 중...</div>
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
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-sm text-primary-600 font-medium">{isTeacher ? '강의 미리보기' : '학습 진행'}</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{course.title}</h1>
            {course.description && <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{course.description}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              돌아가기
            </button>
            {isTeacher && (
              <>
                <Link
                  to={`/teacher/courses/${course.id}/edit`}
                  className="px-4 py-2 border border-indigo-300 text-indigo-600 rounded-md text-sm hover:bg-indigo-50"
                >
                  강의 정보 수정
                </Link>
                <Link
                  to={`/teacher/tests`}
                  className="px-4 py-2 border border-blue-300 text-blue-600 rounded-md text-sm hover:bg-blue-50"
                >
                  테스트 관리로 이동
                </Link>
              </>
            )}
          </div>
        </div>

        {course.studentProgress && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>진도율</span>
              <span>{course.studentProgress.progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min(100, course.studentProgress.progressPercentage)}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
              <span>
                완료 {course.studentProgress.completedBlocks} / {course.studentProgress.totalBlocks}
              </span>
              {course.studentProgress.nextUncompletedTitle && (
                <span className="text-blue-600">
                  다음 콘텐츠: {course.studentProgress.nextUncompletedTitle}
                </span>
              )}
            </div>
          </div>
        )}

        {generalMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-start justify-between">
            <span>{generalMessage}</span>
            <button
              type="button"
              onClick={() => setGeneralMessage(null)}
              className="ml-4 text-xs font-medium text-green-700 hover:underline"
            >
              닫기
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
          <div className="space-y-5">
            {currentVideoBlock ? (
              <div className="space-y-3">
                {currentVideoId ? (
                  <div className="bg-black rounded-lg shadow">
                    <YouTubePlayer
                      videoId={currentVideoId}
                      autoplay={autoplay}
                      onProgress={onVideoProgress}
                      onComplete={onVideoComplete}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 text-sm text-gray-500">
                    유효한 유튜브 영상 정보를 찾을 수 없습니다.
                  </div>
                )}
                <div className="bg-white rounded-lg shadow p-4 space-y-2">
                  <h2 className="text-lg font-semibold text-gray-900">{currentVideoBlock.title}</h2>
                  <p className="text-xs text-gray-500">
                    영상 · 필수 여부: {currentVideoBlock.isRequired !== false ? '필수' : '선택'}
                  </p>
                  {currentVideoBlock.studentStatus && (
                    <div className="text-sm text-gray-600">
                      진행률 {currentVideoBlock.studentStatus.progressPercentage?.toFixed(1) ?? 0}% ·
                      시청 시간 {Math.floor(currentVideoBlock.studentStatus.watchedDuration ?? 0)}초 /
                      {Math.floor(currentVideoBlock.studentStatus.totalDuration ?? 0)}초
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
                재생할 영상이 없습니다. 오른쪽에서 다른 콘텐츠를 선택하세요.
              </div>
            )}

            {currentInfoBlock && (
              <div className="bg-white rounded-lg shadow p-5 space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">{currentInfoBlock.title}</h2>
                <p className="text-xs text-gray-500">
                  {currentInfoBlock.type === 'mindmap' ? '마인드맵' : '텍스트'} · {currentInfoBlock.isRequired !== false ? '필수' : '선택'}
                </p>
                {currentInfoBlock.type === 'mindmap' ? (
                  <a
                    href={(currentInfoBlock.content as any)?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50"
                  >
                    마인드맵 열기 ↗
                  </a>
                ) : (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {(currentInfoBlock.content as any)?.body ?? '내용이 없습니다.'}
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="bg-white rounded-lg shadow divide-y">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900">콘텐츠 목록</h2>
                <p className="text-xs text-gray-500 mt-1">영상, 테스트, 자료를 선택해 학습을 진행하세요.</p>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {blocks.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">등록된 콘텐츠가 없습니다.</div>
                ) : (
                  <ul className="divide-y">
                    {blocks.map((block) => {
                      const isActive =
                        block.id === currentVideoBlockId ||
                        block.id === currentTestBlockId ||
                        block.id === currentInfoBlockId;
                      return (
                        <li key={block.id} className={`p-4 space-y-2 ${isActive ? 'bg-blue-50' : 'bg-white'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{block.title}</p>
                              <p className="text-xs text-gray-500">
                                {block.type === 'video' && '동영상'}
                                {block.type === 'test' && '테스트'}
                                {block.type === 'text' && '텍스트'}
                                {block.type === 'mindmap' && '마인드맵'} · {block.isRequired !== false ? '필수' : '선택'}
                              </p>
                              {block.studentStatus && (
                                <p className="text-xs text-gray-500 mt-1">
                                  진행률 {block.studentStatus.progressPercentage?.toFixed(0) ?? 0}% ·
                                  {block.studentStatus.isCompleted ? '완료' : '진행 중'}
                                </p>
                              )}
                            </div>
                            {block.type === 'video' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentVideoBlockId(block.id);
                                  setAutoplay(true);
                                }}
                                className="px-3 py-1 text-xs border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50"
                              >
                                재생하기
                              </button>
                            )}
                            {block.type === 'test' && (
                              <button
                                type="button"
                                onClick={() => handleSelectTestBlock(block)}
                                className="px-3 py-1 text-xs border border-indigo-300 text-indigo-600 rounded-md hover:bg-indigo-50"
                              >
                                {isStudent ? '응시하기' : '테스트 보기'}
                              </button>
                            )}
                            {block.type !== 'video' && block.type !== 'test' && (
                              <button
                                type="button"
                                onClick={() => handleSelectInfoBlock(block)}
                                className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                열기
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">강의 테스트</h2>
              {testsLoading ? (
                <p className="text-sm text-gray-500">테스트 정보를 불러오는 중...</p>
              ) : testsError ? (
                <p className="text-sm text-red-600">{testsError}</p>
              ) : courseTestEntries.length > 0 ? (
                <ul className="space-y-3">
                  {courseTestEntries.map((entry) => {
                    if (entry.kind === 'block' && entry.block) {
                      const block = entry.block;
                      const testId = Number((block.content as any)?.testId);
                      const summary = entry.test;
                      const status = block.studentStatus;
                      const hasSubmission = summary?.hasSubmitted ?? status?.hasSubmission ?? false;
                      const resultPublished = summary?.submissionStatus?.isPublished || status?.submissionStatus?.isPublished;
                      const canAttempt = isStudent && Number.isInteger(testId) && testId > 0 && !hasSubmission;
                      const canViewResult = isStudent && resultPublished && Number.isInteger(testId) && testId > 0;
                      const displayedScore = status?.submissionStatus?.score ?? summary?.submissionStatus?.score;

                      return (
                        <li key={`block-${block.id}`} className="border border-gray-200 rounded-md p-3">
                          <p className="text-sm font-semibold text-gray-800">{block.title}</p>
                          {summary && (
                            <p className="text-xs text-gray-500 mt-1">
                              마감일 {formatDate(summary.dueDate)} · 총점 {summary.totalScore ?? 100}점
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                            <span>{block.isRequired ? '필수' : '선택'}</span>
                            {status && <span>{status.isCompleted ? '완료' : '미완료'}</span>}
                            {summary && <span>{summary.hasSubmitted ? '응시 완료' : '미응시'}</span>}
                            {typeof displayedScore === 'number' && (<span>점수: {displayedScore}</span>)}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/student/tests/${testId}/attempt`)}
                              disabled={!canAttempt}
                              className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
                             >
                              응시하기
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/student/tests/${testId}/result`)}
                              disabled={!canViewResult}
                              className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 hover:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                             >
                              결과 보기
                            </button>
                          </div>
                        </li>
                      );
                    }

                    if (entry.kind === 'standalone' && entry.test) {
                      const test = entry.test;
                      const canAttempt = isStudent && !test.hasSubmitted;
                      const canViewResult = isStudent && Boolean(test.submissionStatus?.isPublished);

                      return (
                        <li key={`standalone-${test.id}`} className="border border-dashed border-blue-200 rounded-md p-3 bg-blue-50/30">
                          <p className="text-sm font-semibold text-gray-800">{test.title}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                            <span>총점 {test.totalScore ?? 100}점</span>
                            <span>마감일 {formatDate(test.dueDate)}</span>
                            <span>{test.hasSubmitted ? '응시 완료' : '미응시'}</span>
                            {test.courseTitle && <span>강의: {test.courseTitle}</span>}
                            {!test.courseTitle && test.className && <span>반: {test.className}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/student/tests/${test.id}/attempt`)}
                              disabled={!canAttempt}
                              className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
                             >
                              응시하기
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/student/tests/${test.id}/result`)}
                              disabled={!canViewResult}
                              className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 hover:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                             >
                              결과 보기
                            </button>
                          </div>
                        </li>
                      );
                    }

                    return null;
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">이 강의에 포함된 테스트가 없습니다.</p>
              )}
            </div>


            {isTeacher && course.videoSummary && course.videoSummary.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">영상 학습 요약</h2>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 text-xs text-gray-600">
                  {course.videoSummary.map((summary) => (
                    <div key={summary.blockId} className="border border-gray-200 rounded-md px-3 py-2 flex flex-col gap-1">
                      <span className="font-medium text-gray-800">{summary.blockTitle}</span>
                      <span>평균 진행률 {summary.averageProgress?.toFixed(1) ?? 0}% · 완료 {summary.completedCount}/{summary.trackedStudents}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Q&A</h2>
              <p className="text-xs text-gray-500">공개/비공개 설정이 가능한 유튜브 스타일 댓글 영역입니다.</p>
            </div>
          </div>

          {isStudent && (
            <div className="space-y-3">
              <textarea
                value={questionText}
                onChange={(event) => setQuestionText(event.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="영상 학습 중 궁금한 점을 입력하세요."
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={questionPublic}
                    onChange={(event) => setQuestionPublic(event.target.checked)}
                    className="h-4 w-4"
                  />
                  공개 질문으로 등록하기
                </label>
                <button
                  type="button"
                  onClick={handleAskQuestion}
                  disabled={questionSubmitting || questionText.trim().length < 3}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
                >
                  {questionSubmitting ? '등록 중...' : '질문 등록'}
                </button>
              </div>
            </div>
          )}

          {qnaLoading ? (
            <div className="text-sm text-gray-500">질문을 불러오는 중...</div>
          ) : qnaError ? (
            <div className="text-sm text-red-600">{qnaError}</div>
          ) : qnaItems.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-500">
              아직 등록된 질문이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {qnaItems.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.studentName || `학생 ${item.studentId}`}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()} · {item.isPublic ? '공개 질문' : '비공개 질문'}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{item.question}</div>

                  {item.answer ? (
                    <div className="border border-green-200 bg-green-50 rounded-md px-3 py-3 text-sm text-gray-800">
                      <div className="font-medium text-green-700 mb-1">{item.teacherName || '강사 답변'}</div>
                      <p className="whitespace-pre-wrap">{item.answer}</p>
                      {item.answeredAt && (
                        <p className="text-xs text-gray-500 mt-2">{new Date(item.answeredAt).toLocaleString()}</p>
                      )}
                    </div>
                  ) : isTeacher ? (
                    <div className="space-y-2">
                      <textarea
                        value={answerDrafts[item.id] ?? ''}
                        onChange={(event) => setAnswerDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))}
                        rows={2}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="답변을 입력하세요"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAnswerQuestion(item)}
                          disabled={answerSubmittingId === item.id || !(answerDrafts[item.id] || '').trim()}
                          className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
                        >
                          {answerSubmittingId === item.id ? '등록 중...' : '답변 등록'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">답변을 기다리는 중입니다.</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CourseLearningPage;
