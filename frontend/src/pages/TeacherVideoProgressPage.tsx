import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { VideoProgress, VideoProgressSummary } from '../types';

interface GroupedProgress {
  studentId: number;
  studentName: string;
  blocks: VideoProgress[];
  averageProgress: number;
  completedCount: number;
  latestActivity: string | null;
}

const TeacherVideoProgressPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const numericCourseId = courseId ? Number(courseId) : NaN;

  const [progressList, setProgressList] = useState<VideoProgress[]>([]);
  const [summary, setSummary] = useState<VideoProgressSummary[]>([]);
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [sortKey, setSortKey] = useState<'name' | 'progress' | 'completion'>('name');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (Number.isNaN(numericCourseId)) {
        setError('유효하지 않은 강의 ID입니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [progressResponse, summaryResponse] = await Promise.all([
          apiService.getCourseVideoProgress(numericCourseId),
          apiService.getCourseVideoSummary(numericCourseId)
        ]);

        if (progressResponse.success) {
          setProgressList(progressResponse.data || []);
        } else {
          setError(progressResponse.message || '영상 진행 상황을 불러오지 못했습니다.');
        }

        if (summaryResponse.success) {
          setSummary(summaryResponse.data || []);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || '영상 진행 상황을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [numericCourseId]);

  const grouped = useMemo<GroupedProgress[]>(() => {
    const map = new Map<number, (GroupedProgress & { latestActivityTs: number })>();

    for (const item of progressList) {
      const timestamp = item.lastWatchedAt ? new Date(item.lastWatchedAt).getTime() : 0;
      const existing = map.get(item.studentId);

      if (!existing) {
        map.set(item.studentId, {
          studentId: item.studentId,
          studentName: item.studentName || `학생 ${item.studentId}`,
          blocks: [item],
          averageProgress: Number(item.progressPercentage ?? 0),
          completedCount: item.isCompleted ? 1 : 0,
          latestActivity: item.lastWatchedAt || null,
          latestActivityTs: timestamp
        });
      } else {
        existing.blocks.push(item);
        const total = existing.blocks.reduce((sum, block) => sum + Number(block.progressPercentage ?? 0), 0);
        existing.averageProgress = existing.blocks.length ? total / existing.blocks.length : 0;
        existing.completedCount = existing.blocks.filter((block) => block.isCompleted).length;
        if (timestamp > existing.latestActivityTs) {
          existing.latestActivityTs = timestamp;
          existing.latestActivity = item.lastWatchedAt || null;
        }
      }
    }

  const aggregated = Array.from(map.values()).map(({ latestActivityTs, ...rest }) => rest);

  const filtered = aggregated.filter((student) => !onlyIncomplete || student.completedCount < student.blocks.length);

    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'progress':
          return b.averageProgress - a.averageProgress;
        case 'completion': {
          const aRatio = a.blocks.length ? a.completedCount / a.blocks.length : 0;
          const bRatio = b.blocks.length ? b.completedCount / b.blocks.length : 0;
          return bRatio - aRatio;
        }
        default:
          return a.studentName.localeCompare(b.studentName, 'ko');
      }
    });

    return sorted;
  }, [progressList, onlyIncomplete, sortKey]);

  const summaryAggregates = useMemo(() => {
    if (!summary.length) {
      return {
        totalBlocks: 0,
        overallCompletion: 0,
        latestActivity: null as string | null
      };
    }

    const totals = summary.reduce(
      (acc, block) => {
        acc.tracked += block.trackedStudents;
        acc.completed += block.completedCount;
        if (block.lastActivityAt) {
          const ts = new Date(block.lastActivityAt).getTime();
          if (ts > acc.latestTs) {
            acc.latestTs = ts;
            acc.latest = block.lastActivityAt;
          }
        }
        return acc;
      },
      { tracked: 0, completed: 0, latest: null as string | null, latestTs: 0 }
    );

    return {
      totalBlocks: summary.length,
      overallCompletion: totals.tracked > 0 ? (totals.completed / totals.tracked) * 100 : 0,
      latestActivity: totals.latest
    };
  }, [summary]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        진행 상황을 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 text-gray-600">
        <p>{error}</p>
        <Link to="/teacher/dashboard" className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
          대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">강의 영상 진행 현황</h1>
          <p className="text-sm text-gray-600">학생별 영상 시청 상태를 확인하고 미완료 학생을 파악하세요.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">콘텐츠 요약</h2>
              <p className="text-sm text-gray-500 mt-1">
                총 {summaryAggregates.totalBlocks}개의 동영상 블록이 있으며, 전체 완료율은
                {' '}
                {summaryAggregates.overallCompletion.toFixed(1)}% 입니다.
              </p>
              {summaryAggregates.latestActivity && (
                <p className="text-xs text-gray-400 mt-2">
                  최근 업데이트: {new Date(summaryAggregates.latestActivity).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={onlyIncomplete}
                  onChange={(event) => setOnlyIncomplete(event.target.checked)}
                />
                미완료 학생만 보기
              </label>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as 'name' | 'progress' | 'completion')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="name">이름순</option>
                <option value="progress">평균 진도 높은 순</option>
                <option value="completion">완료율 높은 순</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.length === 0 && (
              <div className="col-span-full text-sm text-gray-500 border border-dashed border-gray-200 rounded-md px-3 py-6 text-center">
                아직 수집된 콘텐츠 시청 데이터가 없습니다.
              </div>
            )}

            {summary.map((block) => {
              const completionRate = block.trackedStudents > 0
                ? (block.completedCount / block.trackedStudents) * 100
                : 0;
              return (
                <div key={block.blockId} className="border border-gray-100 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{block.blockTitle || `콘텐츠 ${block.blockId}`}</p>
                      <p className="text-xs text-gray-500">필수 여부: {block.isRequired ? '필수' : '선택'}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                      평균 {Number(block.averageProgress ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>완료: {block.completedCount} / {block.trackedStudents}</p>
                    <p>완료율: {completionRate.toFixed(1)}%</p>
                    <p>최근 업데이트: {block.lastActivityAt ? new Date(block.lastActivityAt).toLocaleString() : '-'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학생</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 진도율</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">완료 콘텐츠</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최근 업데이트</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grouped.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-gray-500">기록된 시청 데이터가 없습니다.</td>
                </tr>
              )}
              {grouped.map((student) => (
                <tr key={student.studentId} className="align-top">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{student.studentName}</div>
                    <ul className="mt-2 space-y-1 text-xs text-gray-500">
                      {student.blocks.map((block) => (
                        <li key={block.videoBlockId} className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-700">{block.blockTitle || `콘텐츠 ${block.videoBlockId}`}:</span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-medium ${block.isCompleted
                              ? 'bg-green-100 text-green-700'
                              : block.progressPercentage >= 75
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {block.isCompleted ? '완료' : `${Number(block.progressPercentage ?? 0).toFixed(1)}%`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{Number(student.averageProgress ?? 0).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {student.completedCount} / {student.blocks.length}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {student.latestActivity ? new Date(student.latestActivity).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherVideoProgressPage;
