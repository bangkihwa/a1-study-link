import React, { useState } from 'react';

interface LectureFeedbackProps {
  lectureId: number;
  lectureTitle: string;
  studentId: number;
  teacherId: number;
  onSubmit: (feedback: LectureFeedback) => void;
  onClose: () => void;
}

interface LectureFeedback {
  lectureId: number;
  studentId: number;
  teacherId: number;
  difficulty: 'too_easy' | 'just_right' | 'too_hard';
  understanding: 'poor' | 'fair' | 'good' | 'excellent';
  question?: string;
  studyTime: number; // 분 단위
  completedAt: string;
}

const LectureFeedback: React.FC<LectureFeedbackProps> = ({
  lectureId,
  lectureTitle,
  studentId,
  teacherId,
  onSubmit,
  onClose
}) => {
  const [difficulty, setDifficulty] = useState<'too_easy' | 'just_right' | 'too_hard' | ''>('');
  const [understanding, setUnderstanding] = useState<'poor' | 'fair' | 'good' | 'excellent' | ''>('');
  const [question, setQuestion] = useState<string>('');
  const [studyTime, setStudyTime] = useState<number>(0);

  const handleSubmit = () => {
    if (!difficulty || !understanding) {
      alert('난이도와 이해도를 선택해주세요.');
      return;
    }

    const feedback: LectureFeedback = {
      lectureId,
      studentId,
      teacherId,
      difficulty: difficulty as 'too_easy' | 'just_right' | 'too_hard',
      understanding: understanding as 'poor' | 'fair' | 'good' | 'excellent',
      question: question.trim() || undefined,
      studyTime,
      completedAt: new Date().toISOString()
    };

    onSubmit(feedback);
  };

  const getDifficultyLabel = (value: string) => {
    switch (value) {
      case 'too_easy': return '너무 쉬워요';
      case 'just_right': return '적당해요';
      case 'too_hard': return '너무 어려워요';
      default: return '';
    }
  };

  const getUnderstandingLabel = (value: string) => {
    switch (value) {
      case 'poor': return '잘 모르겠어요';
      case 'fair': return '조금 이해했어요';
      case 'good': return '잘 이해했어요';
      case 'excellent': return '완전히 이해했어요';
      default: return '';
    }
  };

  const getDifficultyColor = (value: string) => {
    switch (value) {
      case 'too_easy': return '#16a34a';
      case 'just_right': return '#d97706';
      case 'too_hard': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getUnderstandingColor = (value: string) => {
    switch (value) {
      case 'poor': return '#dc2626';
      case 'fair': return '#d97706';
      case 'good': return '#16a34a';
      case 'excellent': return '#059669';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
        <div className="card-header">
          <div className="card-title">
            🎯 강의 완료! 피드백을 남겨주세요
          </div>
        </div>
        <div className="card-body">
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ color: '#16a34a', marginBottom: '0.5rem' }}>
              축하합니다! 🎉
            </h3>
            <p style={{ color: '#6b7280' }}>
              <strong>{lectureTitle}</strong> 강의를 완주하셨습니다!
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 학습 시간 입력 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                ⏱️ 학습 시간
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  value={studyTime}
                  onChange={(e) => setStudyTime(parseInt(e.target.value) || 0)}
                  min="1"
                  max="300"
                  style={{
                    width: '100px',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem'
                  }}
                />
                <span style={{ color: '#6b7280' }}>분</span>
                <small style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                  (실제 학습에 소요된 시간을 입력해주세요)
                </small>
              </div>
            </div>

            {/* 난이도 평가 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500' }}>
                📊 이 강의의 난이도는 어떠셨나요?
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['too_easy', 'just_right', 'too_hard'].map((value) => (
                  <label key={value} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: difficulty === value ? `2px solid ${getDifficultyColor(value)}` : '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    background: difficulty === value ? getDifficultyColor(value) + '10' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="radio"
                      name="difficulty"
                      value={value}
                      checked={difficulty === value}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{
                      fontWeight: '500',
                      color: difficulty === value ? getDifficultyColor(value) : '#374151'
                    }}>
                      {getDifficultyLabel(value)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 이해도 평가 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500' }}>
                🧠 강의 내용을 얼마나 이해하셨나요?
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['poor', 'fair', 'good', 'excellent'].map((value) => (
                  <label key={value} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: understanding === value ? `2px solid ${getUnderstandingColor(value)}` : '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    background: understanding === value ? getUnderstandingColor(value) + '10' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="radio"
                      name="understanding"
                      value={value}
                      checked={understanding === value}
                      onChange={(e) => setUnderstanding(e.target.value as any)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{
                      fontWeight: '500',
                      color: understanding === value ? getUnderstandingColor(value) : '#374151'
                    }}>
                      {getUnderstandingLabel(value)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 질문 입력 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                💬 선생님께 질문이 있으시나요? (선택사항)
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="강의와 관련된 질문을 자유롭게 남겨주세요. 선생님께서 확인하고 답변해드릴게요!"
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  resize: 'vertical',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {/* 버튼 */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem' }}>
              <button 
                onClick={onClose}
                className="btn btn-secondary"
              >
                나중에
              </button>
              <button 
                onClick={handleSubmit}
                className="btn btn-primary"
                style={{ background: '#16a34a', borderColor: '#16a34a' }}
              >
                피드백 제출
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LectureFeedback;