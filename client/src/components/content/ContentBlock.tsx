import React, { useState } from 'react';
import { LectureContent, CONTENT_TYPE_LABELS } from '../../types';
import { 
  PlayIcon, 
  QuestionMarkCircleIcon,
  MapIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ContentBlockProps {
  content: LectureContent;
  onComplete?: (contentId: number, score?: number) => void;
  onAskQuestion?: (contentId: number) => void;
  isStudent?: boolean;
}

const ContentBlock: React.FC<ContentBlockProps> = ({
  content,
  onComplete,
  onAskQuestion,
  isStudent = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [testScore, setTestScore] = useState<number | undefined>();
  const [isCompleting, setIsCompleting] = useState(false);

  const getIcon = () => {
    switch (content.type) {
      case 'video':
        return <PlayIcon className="w-6 h-6" />;
      case 'ox_test':
      case 'smo_test':
        return <QuestionMarkCircleIcon className="w-6 h-6" />;
      case 'mindmap':
        return <MapIcon className="w-6 h-6" />;
      case 'assignment':
        return <DocumentTextIcon className="w-6 h-6" />;
      default:
        return <DocumentTextIcon className="w-6 h-6" />;
    }
  };

  const getBackgroundColor = () => {
    if (content.is_completed) {
      return 'bg-green-50 border-green-200';
    }
    switch (content.type) {
      case 'video':
        return 'bg-blue-50 border-blue-200';
      case 'ox_test':
      case 'smo_test':
        return 'bg-yellow-50 border-yellow-200';
      case 'mindmap':
        return 'bg-purple-50 border-purple-200';
      case 'assignment':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleComplete = async () => {
    if (!onComplete) return;
    
    setIsCompleting(true);
    try {
      await onComplete(content.id, testScore);
    } finally {
      setIsCompleting(false);
    }
  };

  const renderContent = () => {
    switch (content.type) {
      case 'video':
        if (content.content_url) {
          const videoId = extractYouTubeId(content.content_url);
          if (videoId) {
            return (
              <div className="mt-4">
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    className="w-full h-64 rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            );
          }
        }
        break;
      
      case 'ox_test':
      case 'smo_test':
        if (content.content_url) {
          return (
            <div className="mt-4">
              <iframe
                src={content.content_url}
                className="w-full h-64 rounded-lg border"
                frameBorder="0"
              ></iframe>
              {isStudent && (
                <div className="mt-4 flex items-center space-x-4">
                  <input
                    type="number"
                    placeholder="점수"
                    min="0"
                    max="100"
                    value={testScore || ''}
                    onChange={(e) => setTestScore(parseInt(e.target.value) || undefined)}
                    className="input-field w-24"
                  />
                  <span className="text-sm text-gray-600">/ 100점</span>
                </div>
              )}
            </div>
          );
        }
        break;
      
      case 'mindmap':
        if (content.content_url) {
          return (
            <div className="mt-4">
              <iframe
                src={content.content_url}
                className="w-full h-64 rounded-lg border"
                frameBorder="0"
              ></iframe>
            </div>
          );
        }
        break;
      
      default:
        if (content.content_data) {
          return (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(content.content_data, null, 2)}
              </pre>
            </div>
          );
        }
    }
    
    return null;
  };

  return (
    <div className={`card ${getBackgroundColor()} transition-all duration-200`}>
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-gray-600">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {content.title}
              </h3>
              <p className="text-sm text-gray-600">
                {CONTENT_TYPE_LABELS[content.type]}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {content.is_completed && (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircleIcon className="w-5 h-5" />
                <span className="text-sm">완료</span>
                {content.score && (
                  <span className="text-sm font-medium">({content.score}점)</span>
                )}
              </div>
            )}
            
            {content.attempts && content.attempts > 0 && (
              <div className="flex items-center space-x-1 text-gray-500">
                <ClockIcon className="w-4 h-4" />
                <span className="text-sm">{content.attempts}회 시도</span>
              </div>
            )}
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="btn-secondary text-sm"
            >
              {showDetails ? '접기' : '열기'}
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4">
            {renderContent()}
            
            {isStudent && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => onAskQuestion?.(content.id)}
                  className="btn-secondary text-sm"
                >
                  질문하기
                </button>
                
                {!content.is_completed && (
                  <button
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="btn-primary text-sm"
                  >
                    {isCompleting ? '완료 중...' : '완료 표시'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// YouTube URL에서 비디오 ID 추출
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
};

export default ContentBlock;