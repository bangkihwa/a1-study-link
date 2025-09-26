import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import YouTubePlayer from '../components/student/YouTubePlayer';
import { apiService } from '../services/api';
import { ContentBlock } from '../types';

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

interface PlayerProgressState {
  watchedDuration: number;
  totalDuration: number;
  progressPercentage: number;
  isCompleted: boolean;
  lastWatchedAt: string | null;
}

const StudentVideoPage: React.FC = () => {
  const { courseId, blockId } = useParams<{ courseId: string; blockId: string }>();
  const navigate = useNavigate();

  const [block, setBlock] = useState<ContentBlock | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [progress, setProgress] = useState<PlayerProgressState>({
    watchedDuration: 0,
    totalDuration: 0,
    progressPercentage: 0,
    isCompleted: false,
    lastWatchedAt: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const lastSentRef = useRef<number>(0);

  const numericBlockId = blockId ? Number(blockId) : NaN;
  const numericCourseId = courseId ? Number(courseId) : NaN;

  const videoId = useMemo(() => {
    if (!block || block.type !== 'video') return null;
    const url = block.content?.url || '';
    return parseYouTubeVideoId(url);
  }, [block]);

  useEffect(() => {
    const load = async () => {
      if (Number.isNaN(numericCourseId) || Number.isNaN(numericBlockId)) {
        setError('잘못된 강의 또는 콘텐츠 ID입니다.');
        return;
      }

      try {
        setLoading(true);
        const [courseResp, progressResp] = await Promise.all([
          apiService.getCourse(numericCourseId),
          apiService.getMyVideoProgress()
        ]);

        if (!courseResp.success) {
          setError(courseResp.message || '강의 정보를 불러오지 못했습니다.');
          return;
        }

        const courseData = courseResp.data;
        setCourseTitle(courseData.title || '강의');
        const targetBlock = (courseData.contentBlocks || []).find((b: ContentBlock) => b.id === numericBlockId);
        if (!targetBlock || targetBlock.type !== 'video') {
          setError('해당 영상 콘텐츠를 찾을 수 없습니다.');
          return;
        }
        setBlock(targetBlock);

        if (progressResp.success) {
          const existing = (progressResp.data || []).find((p: any) => p.videoBlockId === numericBlockId);
          if (existing) {
            setProgress({
              watchedDuration: existing.watchedDuration,
              totalDuration: existing.totalDuration,
              progressPercentage: existing.progressPercentage,
              isCompleted: existing.isCompleted,
              lastWatchedAt: existing.lastWatchedAt || null
            });
            if (existing.isCompleted) {
              setStatusMessage('이 영상은 이미 완료 처리되었습니다.');
            }
            lastSentRef.current = existing.watchedDuration || 0;
          }
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || '영상 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [numericCourseId, numericBlockId]);

  const handleProgress = async (watched: number, total: number) => {
    if (Number.isNaN(numericBlockId) || watched < 0 || total <= 0) return;

    const delta = watched - lastSentRef.current;
    const shouldSend = watched === 0 || watched >= total || delta >= 5;
    if (!shouldSend) {
      return;
    }
    lastSentRef.current = watched;

    try {
      const response = await apiService.updateVideoProgress({
        videoBlockId: numericBlockId,
        watchedDuration: watched,
        totalDuration: total
      });
      if (response.success && response.data) {
        setProgress({
          watchedDuration: response.data.watchedDuration,
          totalDuration: response.data.totalDuration,
          progressPercentage: response.data.progressPercentage,
          isCompleted: response.data.isCompleted,
          lastWatchedAt: response.data.lastWatchedAt || new Date().toISOString()
        });
        lastSentRef.current = Math.max(lastSentRef.current, response.data.watchedDuration || 0);
        if (response.data.isCompleted && !progress.isCompleted) {
          setStatusMessage('95% 이상 시청이 완료되어 영상이 완료 처리되었습니다.');
        }
      }
    } catch (err: any) {
      console.error('Failed to update progress', err);
    }
  };

  const handleComplete = () => {
    if (!progress.isCompleted) {
      setStatusMessage('영상 시청이 완료 처리되었습니다. 다음 콘텐츠로 이동하세요.');
      setProgress((prev) => ({
        ...prev,
        isCompleted: true,
        progressPercentage: Math.max(prev.progressPercentage, 100),
        lastWatchedAt: prev.lastWatchedAt || new Date().toISOString()
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        영상 정보를 불러오는 중...
      </div>
    );
  }

  if (error || !block || !videoId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 text-gray-600">
        <p>{error || '재생 가능한 동영상을 찾을 수 없습니다.'}</p>
        <button
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
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        <div>
          <p className="text-sm text-primary-600 font-medium">{courseTitle}</p>
          <h1 className="text-2xl font-bold text-gray-900">{block.title}</h1>
          <p className="text-sm text-gray-500">유형: 동영상 · {progress.progressPercentage.toFixed(2)}% 진행</p>
        </div>

        <div className="bg-black rounded-lg overflow-hidden shadow">
          <YouTubePlayer
            videoId={videoId}
            autoplay
            onProgress={handleProgress}
            onComplete={handleComplete}
          />
        </div>

        {statusMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-start justify-between">
            <span>{statusMessage}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="ml-4 text-xs font-medium text-green-700 hover:underline"
            >
              닫기
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <h2 className="text-lg font-semibold">진행 상황</h2>
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-blue-600 rounded-full transition-all"
                style={{ width: `${Math.min(100, progress.progressPercentage)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              시청 시간: {Math.floor(progress.watchedDuration)}초 / {Math.floor(progress.totalDuration)}초 ·
              완료 상태: {progress.isCompleted ? '완료' : '진행 중'}
            </p>
            {progress.lastWatchedAt && (
              <p className="text-xs text-gray-400">
                마지막 업데이트: {new Date(progress.lastWatchedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentVideoPage;
