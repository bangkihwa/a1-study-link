import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  autoplay?: boolean;
  onProgress?: (watched: number, total: number) => void;
  onReady?: () => void;
  onComplete?: () => void;
}

const loadYouTubeApi = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('youtube-iframe-api');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) {
        previousCallback();
      }
      resolve();
    };
  });
};

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  autoplay = false,
  onProgress,
  onReady,
  onComplete
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);
  const lastReportedRef = useRef<number>(0);
  const hasCompletedRef = useRef<boolean>(false);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const clearProgressTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reportProgress = React.useCallback(() => {
    const player = playerRef.current;
    if (!player || typeof player.getDuration !== 'function') {
      return;
    }
    const duration = player.getDuration ? player.getDuration() : 0;
    const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
    if (!duration || Number.isNaN(duration) || Number.isNaN(currentTime)) {
      return;
    }

    const total = Math.max(1, Math.floor(duration));
    const watched = Math.min(total, Math.max(0, Math.floor(currentTime)));

    if (watched === lastReportedRef.current && watched !== total) {
      return;
    }

    lastReportedRef.current = watched;

    if (onProgress) {
      onProgress(watched, total);
    }

    if (watched >= total) {
      if (!hasCompletedRef.current && onComplete) {
        hasCompletedRef.current = true;
        onComplete();
      }
    } else if (hasCompletedRef.current) {
      hasCompletedRef.current = false;
    }
  }, [onComplete, onProgress]);

  const handleStateChange = React.useCallback((event: any) => {
    switch (event.data) {
      case window.YT.PlayerState.PLAYING:
        setErrorMessage(null);
        reportProgress();
        clearProgressTimer();
        intervalRef.current = window.setInterval(reportProgress, 5000);
        break;
      case window.YT.PlayerState.PAUSED:
      case window.YT.PlayerState.BUFFERING:
        reportProgress();
        clearProgressTimer();
        break;
      case window.YT.PlayerState.ENDED:
        reportProgress();
        clearProgressTimer();
        break;
      default:
        break;
    }
  }, [reportProgress]);

  const handleError = React.useCallback((event: any) => {
    let message = '영상 재생 중 오류가 발생했습니다.';
    switch (event.data) {
      case 2:
        message = '잘못된 동영상 URL입니다.';
        break;
      case 5:
        message = '재생에 필요한 HTML5 지원이 필요합니다.';
        break;
      case 100:
      case 101:
      case 150:
        message = '해당 동영상을 재생할 수 없습니다. (권한 또는 삭제)';
        break;
      default:
        break;
    }
    setErrorMessage(message);
    clearProgressTimer();
  }, []);

  const setIframeAllow = React.useCallback(() => {
    try {
      const iframe: any = (playerRef.current && typeof playerRef.current.getIframe === 'function')
        ? playerRef.current.getIframe()
        : containerRef.current?.querySelector('iframe');
      if (iframe) {
        // keep fullscreen permission without triggering chrome's allowfullscreen precedence warning
        const featureSet = new Set(
          (iframe.getAttribute('allow') || '')
            .split(';')
            .map((token: string) => token.trim())
            .filter(Boolean)
        );
        ['accelerometer', 'autoplay', 'clipboard-write', 'encrypted-media', 'gyroscope', 'picture-in-picture', 'web-share', 'fullscreen'].forEach((token) => featureSet.add(token));
        iframe.setAttribute('allow', Array.from(featureSet).join('; '));
        iframe.removeAttribute('allowfullscreen');
        // ensure iframe fills the container
        (iframe as HTMLIFrameElement).style.width = '100%';
        (iframe as HTMLIFrameElement).style.height = '100%';
        (iframe as HTMLIFrameElement).style.display = 'block';
        (iframe as HTMLIFrameElement).style.border = '0';
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const setupPlayer = async () => {
      await loadYouTubeApi();
      if (!isMounted || !containerRef.current) {
        return;
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          fs: 1,
          playsinline: 1
        },
        events: {
          onReady: () => {
            setIsReady(true);
            setIframeAllow();
            setTimeout(setIframeAllow, 0);
            if (onReady) {
              onReady();
            }
            if (autoplay) {
              playerRef.current.playVideo();
            }
          },
          onStateChange: handleStateChange,
          onError: handleError
        }
      });
    };

    setupPlayer();

    return () => {
      isMounted = false;
      clearProgressTimer();
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
      playerRef.current = null;
      hasCompletedRef.current = false;
      lastReportedRef.current = 0;
    };
  }, [videoId, autoplay, handleStateChange, handleError, onReady, setIframeAllow]);

  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    reportProgress();
  }, [isReady, reportProgress]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        reportProgress();
      }
    };

    const handlePageHide = () => {
      reportProgress();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, [reportProgress]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (playerRef.current && videoId) {
      setErrorMessage(null);
      playerRef.current.cueVideoById(videoId);
      if (autoplay) {
        playerRef.current.playVideo();
      }
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black">
      <div className="absolute inset-0" ref={containerRef} />
      {(isOffline || errorMessage) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white space-y-3 px-4 text-center">
          <p className="text-sm">
            {isOffline ? '오프라인 상태입니다. 네트워크 연결을 확인한 후 다시 시도하세요.' : errorMessage}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="px-4 py-2 text-sm border border-white rounded-md hover:bg-white hover:text-black"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;
