import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { TestQuestion, TestSubmissionResult, TestSubmissionSummary, TestSummary } from '../types';

const TeacherTestSubmissionsPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const numericTestId = testId ? Number(testId) : NaN;

  const [test, setTest] = useState<TestSummary | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [submissions, setSubmissions] = useState<TestSubmissionSummary[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [gradedResults, setGradedResults] = useState<TestSubmissionResult[]>([]);
  const [feedback, setFeedback] = useState('');
  const [publishAfterSave, setPublishAfterSave] = useState(false);

  const fetchData = async () => {
    if (!numericTestId || Number.isNaN(numericTestId)) {
      setError('유효하지 않은 테스트 ID입니다.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [testResp, submissionResp] = await Promise.all([
        apiService.getTest(numericTestId),
        apiService.getTestSubmissions(numericTestId)
      ]);

      if (testResp.success && testResp.data) {
        setTest(testResp.data.test || testResp.data);
        setQuestions((testResp.data.questions || []) as TestQuestion[]);
      } else {
        throw new Error(testResp.message || '테스트 정보를 불러오지 못했습니다.');
      }

      if (submissionResp.success) {
        const list = (submissionResp.data || []) as TestSubmissionSummary[];
        setSubmissions(list);
        if (list.length > 0) {
          setSelectedSubmissionId(list[0].id);
        }
      } else {
        throw new Error(submissionResp.message || '제출 목록을 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '제출 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedSubmissionId) || null,
    [selectedSubmissionId, submissions]
  );

  useEffect(() => {
    if (!selectedSubmission) {
      setGradedResults([]);
      setFeedback('');
      setPublishAfterSave(false);
      return;
    }
    const results = selectedSubmission.answers?.results || [];
    setGradedResults(
      results.map((result) => ({
        ...result,
        awardedScore: result.awardedScore ?? 0
      }))
    );
    setFeedback(selectedSubmission.answers?.feedback || '');
    setPublishAfterSave(false);
  }, [selectedSubmission]);

  const totalScore = useMemo(
    () => gradedResults.reduce((sum, result) => sum + (result.awardedScore ?? 0), 0),
    [gradedResults]
  );

  const handleScoreChange = (questionId: number, value: number) => {
    setGradedResults((prev) =>
      prev.map((result) =>
        result.questionId === questionId ? { ...result, awardedScore: Number.isNaN(value) ? 0 : value } : result
      )
    );
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;
    try {
      setSaving(true);
      setStatusMessage(null);
      const response = await apiService.gradeTestSubmission(selectedSubmission.id, {
        score: totalScore,
        gradedResults,
        publish: publishAfterSave,
        feedback: feedback || undefined
      });
      if (!response.success) {
        throw new Error(response.message || '채점 결과를 저장하지 못했습니다.');
      }
      setStatusMessage(publishAfterSave ? '채점 및 공개가 완료되었습니다.' : '채점 결과가 저장되었습니다.');
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '채점 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async (submission: TestSubmissionSummary, nextState: boolean) => {
    try {
      setStatusMessage(null);
      if (nextState) {
        const response = await apiService.publishTestSubmission(submission.id);
        if (!response.success) {
          throw new Error(response.message || '결과 공개에 실패했습니다.');
        }
        setStatusMessage('결과가 공개되었습니다.');
      } else {
        const response = await apiService.unpublishTestSubmission(submission.id);
        if (!response.success) {
          throw new Error(response.message || '결과 비공개 처리에 실패했습니다.');
        }
        setStatusMessage('결과 공개가 취소되었습니다.');
      }
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '결과 공개 상태 변경 중 오류가 발생했습니다.');
    }
  };

  if (!numericTestId || Number.isNaN(numericTestId)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">유효하지 않은 요청입니다.</div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">제출 정보를 불러오는 중...</div>
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

  if (!test) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">제출 현황 · {test.title}</h1>
          <p className="text-sm text-gray-600">학생 제출을 확인하고 서술형 문항을 채점하세요.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/teacher/tests/${numericTestId}`)}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
        >
          테스트 편집으로 이동
        </button>
      </div>

      {statusMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">{statusMessage}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">제출 목록</h2>
            <div className="space-y-2">
              {submissions.length === 0 && (
                <p className="text-sm text-gray-500">아직 제출된 결과가 없습니다.</p>
              )}
              {submissions.map((submission) => (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => setSelectedSubmissionId(submission.id)}
                  className={`w-full text-left border rounded-md px-3 py-2 text-sm transition ${
                    submission.id === selectedSubmissionId
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{submission.studentName || `학생 ${submission.studentId}`}</span>
                    <span className="text-xs text-gray-500">{new Date(submission.submittedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-1 text-gray-600">
                    <span>{submission.isGraded ? '채점 완료' : '채점 대기'}</span>
                    <span>·</span>
                    <span>{submission.isPublished ? '공개됨' : '미공개'}</span>
                    {typeof submission.score === 'number' && (
                      <>
                        <span>·</span>
                        <span>{submission.score}점</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedSubmission ? (
            <div className="bg-white rounded-lg shadow p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedSubmission.studentName || `학생 ${selectedSubmission.studentId}`}</h2>
                  <p className="text-xs text-gray-500">제출 시간: {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePublishToggle(selectedSubmission, !selectedSubmission.isPublished)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                      selectedSubmission.isPublished
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {selectedSubmission.isPublished ? '비공개 전환' : '결과 공개'}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-700">
                <div className="flex flex-wrap items-center gap-3">
                  <span>총점: <strong>{test.totalScore ?? 100}</strong></span>
                  <span>자동 채점 합계: <strong>{gradedResults.reduce((sum, result) => result.requiresManualGrading ? sum : sum + (result.awardedScore ?? 0), 0)}</strong></span>
                  <span>현재 점수: <strong>{totalScore}</strong></span>
                  <span>채점 상태: <strong>{selectedSubmission.isGraded ? '채점 완료' : '채점 대기'}</strong></span>
                  <span>공개 여부: <strong>{selectedSubmission.isPublished ? '공개' : '미공개'}</strong></span>
                </div>
              </div>

              <div className="space-y-4">
                {gradedResults.length === 0 && (
                  <p className="text-sm text-gray-500">저장된 답안 정보가 없습니다.</p>
                )}
                {gradedResults.map((result) => {
                  const question = questions.find((item) => item.id === result.questionId);
                  if (!question) return null;
                  const isEssay = question.type === 'essay' || result.requiresManualGrading;
                  return (
                    <div key={result.questionId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">[{question.orderIndex + 1}] {question.questionText}</h3>
                          <p className="text-xs text-gray-500 mt-1">배점 {question.points ?? 0}점</p>
                        </div>
                        {!isEssay && (
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${result.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {result.isCorrect ? '정답' : '오답'}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 text-sm text-gray-700 space-y-2">
                        <div>
                          <span className="font-medium text-gray-800">학생 답안:</span>
                          <div className="mt-1 text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-md px-3 py-2">{String(result.response ?? '-')}</div>
                        </div>
                        {isEssay ? (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">부여 점수</label>
                            <input
                              type="number"
                              min={0}
                              max={question.points ?? 0}
                              value={result.awardedScore ?? 0}
                              onChange={(event) => handleScoreChange(result.questionId, Number(event.target.value))}
                              className="w-32 border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">자동 채점 점수: {result.awardedScore ?? 0} / {result.maxScore}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">피드백 (선택)</label>
                  <textarea
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="학생에게 전달할 피드백을 입력하세요"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="publishAfterSave"
                    type="checkbox"
                    checked={publishAfterSave}
                    onChange={(event) => setPublishAfterSave(event.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="publishAfterSave" className="text-sm text-gray-700">저장 후 결과를 학생에게 공개</label>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveGrade}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? '저장 중...' : '채점 결과 저장'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusMessage(null)}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
                  >
                    변경 취소
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
              좌측 목록에서 학생 제출을 선택해 주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherTestSubmissionsPage;
