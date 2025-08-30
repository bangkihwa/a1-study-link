import React, { useState, useEffect } from 'react';
import { loadStudentFeedbacks, saveStudentFeedbacks, loadStudentProgress, loadLectures } from '../../utils/dataStorage';

interface StudentFeedback {
  id: number;
  lectureId: number;
  lectureTitle: string;
  studentId: number;
  studentName: string;
  teacherId: number;
  difficulty?: string;
  understanding?: string;
  question?: string;
  studyTime?: number;
  updatedAt?: string;
  completedAt?: string;
  isAnswered: boolean;
  answer?: string;
  answeredAt?: string;
}

interface EnhancedStudentFeedbackViewProps {
  onBack: () => void;
  teacherId: number;
}

const EnhancedStudentFeedbackView: React.FC<EnhancedStudentFeedbackViewProps> = ({ onBack, teacherId }) => {
  const [feedbacks, setFeedbacks] = useState<StudentFeedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<StudentFeedback | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unanswered' | 'answered'>('all');

  useEffect(() => {
    loadFeedbacks();
    
    // localStorage 변경 감지
    const handleStorageChange = () => {
      loadFeedbacks();
    };
    
    window.addEventListener('localStorageChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('localStorageChanged', handleStorageChange);
    };
  }, [teacherId]);

  const loadFeedbacks = () => {
    // teacherQuestions에서 질문 가져오기
    const teacherQuestions = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
    const myQuestions = teacherQuestions
      .filter((q: any) => q.teacherId === teacherId)
      .map((q: any) => ({
        id: q.id,
        lectureId: q.lectureId,
        lectureTitle: q.lectureTitle,
        studentId: q.studentId,
        studentName: q.studentName,
        teacherId: q.teacherId,
        question: q.question,
        updatedAt: q.createdAt,
        isAnswered: q.isAnswered || false,
        answer: q.answer,
        answeredAt: q.answeredAt
      }));
    
    // 기존 피드백도 함께 가져오기 (난이도, 이해도 정보용)
    const allFeedbacks = loadStudentFeedbacks();
    const teacherFeedbacks = allFeedbacks.filter(f => f.teacherId === teacherId);
    
    // 질문과 피드백 병합 (질문이 우선)
    const mergedFeedbacks = myQuestions.map((q: any) => {
      const feedback = teacherFeedbacks.find(f => 
        f.studentId === q.studentId && f.lectureId === q.lectureId
      );
      return {
        ...q,
        difficulty: feedback?.difficulty,
        understanding: feedback?.understanding
      };
    });
    
    setFeedbacks(mergedFeedbacks);
  };

  const submitAnswer = () => {
    if (!selectedFeedback || !answerText.trim()) {
      alert('답변을 입력해주세요.');
      return;
    }

    // teacherQuestions 업데이트
    const teacherQuestions = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
    const updatedQuestions = teacherQuestions.map((q: any) => 
      q.id === selectedFeedback.id 
        ? { 
            ...q, 
            answer: answerText.trim(), 
            isAnswered: true, 
            answeredAt: new Date().toISOString() 
          }
        : q
    );
    localStorage.setItem('teacherQuestions', JSON.stringify(updatedQuestions));
    
    // 기존 피드백도 업데이트 (호환성)
    const allFeedbacks = loadStudentFeedbacks();
    const updatedFeedbacks = allFeedbacks.map(f => 
      f.studentId === selectedFeedback.studentId && f.lectureId === selectedFeedback.lectureId
        ? { 
            ...f, 
            answer: answerText.trim(), 
            isAnswered: true, 
            answeredAt: new Date().toISOString() 
          }
        : f
    );
    saveStudentFeedbacks(updatedFeedbacks);
    
    // localStorage 변경 이벤트 발생
    window.dispatchEvent(new Event('localStorageChanged'));
    
    setAnswerText('');
    setSelectedFeedback(null);
    setShowAnswerModal(false);
    loadFeedbacks();
    
    alert('답변이 전송되었습니다.');
  };

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '적당함';
      case 'hard': return '어려움';
      default: return '-';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return '#16a34a';
      case 'medium': return '#d97706';
      case 'hard': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getUnderstandingLabel = (understanding?: string) => {
    switch (understanding) {
      case 'confused': return '잘 모르겠어요';
      case 'partial': return '조금 이해했어요';
      case 'good': return '잘 이해했어요';
      case 'perfect': return '완벽해요';
      default: return '-';
    }
  };

  const getUnderstandingColor = (understanding?: string) => {
    switch (understanding) {
      case 'confused': return '#dc2626';
      case 'partial': return '#d97706';
      case 'good': return '#2563eb';
      case 'perfect': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filterType === 'unanswered') return f.question && !f.isAnswered;
    if (filterType === 'answered') return f.question && f.isAnswered;
    return true;
  });

  const questionsWithAnswers = filteredFeedbacks.filter(f => f.question);
  const feedbacksWithoutQuestions = filteredFeedbacks.filter(f => !f.question);

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>학생 피드백 및 질문</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '0.5rem 1rem',
              border: filterType === 'all' ? '2px solid #667eea' : '1px solid #e5e7eb',
              background: filterType === 'all' ? '#e0e7ff' : 'white',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            전체 ({feedbacks.length})
          </button>
          <button
            onClick={() => setFilterType('unanswered')}
            style={{
              padding: '0.5rem 1rem',
              border: filterType === 'unanswered' ? '2px solid #dc2626' : '1px solid #e5e7eb',
              background: filterType === 'unanswered' ? '#fee2e2' : 'white',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            답변 대기 ({feedbacks.filter(f => f.question && !f.isAnswered).length})
          </button>
          <button
            onClick={() => setFilterType('answered')}
            style={{
              padding: '0.5rem 1rem',
              border: filterType === 'answered' ? '2px solid #16a34a' : '1px solid #e5e7eb',
              background: filterType === 'answered' ? '#dcfce7' : 'white',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            답변 완료 ({feedbacks.filter(f => f.question && f.isAnswered).length})
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>총 피드백</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{feedbacks.length}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>받은 질문</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
              {feedbacks.filter(f => f.question).length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>답변 대기</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
              {feedbacks.filter(f => f.question && !f.isAnswered).length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>답변 완료</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
              {feedbacks.filter(f => f.question && f.isAnswered).length}
            </p>
          </div>
        </div>
      </div>

      {/* 질문 섹션 */}
      {questionsWithAnswers.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <div className="card-title">💬 학생 질문</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {questionsWithAnswers.map(feedback => (
                <div 
                  key={feedback.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    background: feedback.isAnswered ? '#f9fafb' : '#fff7ed'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <div>
                      <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                        {feedback.studentName} - {feedback.lectureTitle}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {new Date(feedback.updatedAt || feedback.completedAt || '').toLocaleString()}
                      </p>
                    </div>
                    {!feedback.isAnswered && (
                      <button
                        onClick={() => {
                          setSelectedFeedback(feedback);
                          setShowAnswerModal(true);
                        }}
                        className="btn btn-primary"
                        style={{ fontSize: '0.875rem' }}
                      >
                        답변하기
                      </button>
                    )}
                  </div>

                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'white', 
                    borderRadius: '0.375rem',
                    marginBottom: '0.75rem'
                  }}>
                    <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>❓ 질문:</p>
                    <p style={{ color: '#374151' }}>{feedback.question}</p>
                  </div>

                  {feedback.isAnswered && feedback.answer && (
                    <div style={{ 
                      padding: '0.75rem', 
                      background: '#f0fdf4', 
                      borderLeft: '4px solid #16a34a',
                      borderRadius: '0.375rem'
                    }}>
                      <p style={{ fontWeight: '500', color: '#16a34a', marginBottom: '0.25rem' }}>
                        ✅ 답변:
                      </p>
                      <p style={{ color: '#374151' }}>{feedback.answer}</p>
                      {feedback.answeredAt && (
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                          답변 시간: {new Date(feedback.answeredAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                    {feedback.difficulty && (
                      <span style={{
                        fontSize: '0.875rem',
                        padding: '0.25rem 0.75rem',
                        background: getDifficultyColor(feedback.difficulty) + '20',
                        color: getDifficultyColor(feedback.difficulty),
                        borderRadius: '9999px'
                      }}>
                        난이도: {getDifficultyLabel(feedback.difficulty)}
                      </span>
                    )}
                    {feedback.understanding && (
                      <span style={{
                        fontSize: '0.875rem',
                        padding: '0.25rem 0.75rem',
                        background: getUnderstandingColor(feedback.understanding) + '20',
                        color: getUnderstandingColor(feedback.understanding),
                        borderRadius: '9999px'
                      }}>
                        이해도: {getUnderstandingLabel(feedback.understanding)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 피드백만 있는 경우 */}
      {feedbacksWithoutQuestions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 학습 피드백</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {feedbacksWithoutQuestions.map(feedback => (
                <div 
                  key={feedback.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                      {feedback.studentName} - {feedback.lectureTitle}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {new Date(feedback.updatedAt || feedback.completedAt || '').toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {feedback.difficulty && (
                      <span style={{
                        fontSize: '0.875rem',
                        padding: '0.25rem 0.75rem',
                        background: getDifficultyColor(feedback.difficulty) + '20',
                        color: getDifficultyColor(feedback.difficulty),
                        borderRadius: '9999px'
                      }}>
                        {getDifficultyLabel(feedback.difficulty)}
                      </span>
                    )}
                    {feedback.understanding && (
                      <span style={{
                        fontSize: '0.875rem',
                        padding: '0.25rem 0.75rem',
                        background: getUnderstandingColor(feedback.understanding) + '20',
                        color: getUnderstandingColor(feedback.understanding),
                        borderRadius: '9999px'
                      }}>
                        {getUnderstandingLabel(feedback.understanding)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {filteredFeedbacks.length === 0 && (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
              {filterType === 'unanswered' 
                ? '답변 대기 중인 질문이 없습니다.' 
                : filterType === 'answered'
                ? '답변 완료된 질문이 없습니다.'
                : '아직 받은 피드백이 없습니다.'}
            </p>
          </div>
        </div>
      )}

      {/* 답변 모달 */}
      {showAnswerModal && selectedFeedback && (
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
          <div className="card" style={{ width: '600px', maxWidth: '90%' }}>
            <div className="card-header">
              <div className="card-title">답변 작성</div>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                  학생: {selectedFeedback.studentName}
                </p>
                <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                  강의: {selectedFeedback.lectureTitle}
                </p>
                <div style={{ 
                  padding: '0.75rem', 
                  background: '#f9fafb', 
                  borderRadius: '0.375rem',
                  marginBottom: '1rem'
                }}>
                  <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>질문:</p>
                  <p>{selectedFeedback.question}</p>
                </div>
              </div>
              
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="답변을 입력해주세요..."
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  marginBottom: '1rem',
                  resize: 'vertical'
                }}
              />
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={submitAnswer}
                  className="btn btn-primary"
                >
                  답변 전송
                </button>
                <button 
                  onClick={() => {
                    setShowAnswerModal(false);
                    setSelectedFeedback(null);
                    setAnswerText('');
                  }}
                  className="btn btn-secondary"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedStudentFeedbackView;