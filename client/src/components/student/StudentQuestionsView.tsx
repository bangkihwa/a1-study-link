import React, { useState, useEffect } from 'react';

interface Question {
  id: number;
  lectureId: number;
  lectureTitle: string;
  studentId: number;
  studentName: string;
  question: string;
  answer?: string;
  isAnswered: boolean;
  createdAt: string;
  answeredAt?: string;
  answeredBy?: string;
}

interface StudentQuestionsViewProps {
  studentId: number;
  studentName: string;
  onBack: () => void;
}

const StudentQuestionsView: React.FC<StudentQuestionsViewProps> = ({ studentId, studentName, onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'answered' | 'pending'>('all');

  useEffect(() => {
    loadQuestions();
    const interval = setInterval(loadQuestions, 2000);
    
    return () => clearInterval(interval);
  }, [studentId]);

  const loadQuestions = () => {
    const storedQuestions = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
    const myQuestions = storedQuestions.filter((q: Question) => q.studentId === studentId);
    setQuestions(myQuestions);
  };

  const filteredQuestions = questions.filter(q => {
    if (filter === 'answered') return q.isAnswered;
    if (filter === 'pending') return !q.isAnswered;
    return true;
  });

  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedQuestion(null);
  };

  const answeredCount = questions.filter(q => q.isAnswered).length;
  const pendingCount = questions.filter(q => !q.isAnswered).length;

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={onBack} 
            className="btn btn-secondary"
          >
            ← 뒤로
          </button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            ❓ 내 질문
          </h2>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ 
            padding: '0.5rem 1rem', 
            background: '#dcfce7', 
            borderRadius: '0.5rem',
            color: '#16a34a',
            fontWeight: '500'
          }}>
            답변 완료: {answeredCount}개
          </div>
          <div style={{ 
            padding: '0.5rem 1rem', 
            background: '#fef3c7', 
            borderRadius: '0.5rem',
            color: '#ca8a04',
            fontWeight: '500'
          }}>
            답변 대기: {pendingCount}개
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: filter === 'all' ? '2px solid #667eea' : '1px solid #e5e7eb',
                background: filter === 'all' ? '#eef2ff' : 'white',
                color: filter === 'all' ? '#667eea' : '#6b7280',
                cursor: 'pointer',
                fontWeight: filter === 'all' ? '600' : '400'
              }}
            >
              전체 ({questions.length})
            </button>
            <button
              onClick={() => setFilter('answered')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: filter === 'answered' ? '2px solid #16a34a' : '1px solid #e5e7eb',
                background: filter === 'answered' ? '#f0fdf4' : 'white',
                color: filter === 'answered' ? '#16a34a' : '#6b7280',
                cursor: 'pointer',
                fontWeight: filter === 'answered' ? '600' : '400'
              }}
            >
              답변 완료 ({answeredCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: filter === 'pending' ? '2px solid #ca8a04' : '1px solid #e5e7eb',
                background: filter === 'pending' ? '#fef3c7' : 'white',
                color: filter === 'pending' ? '#ca8a04' : '#6b7280',
                cursor: 'pointer',
                fontWeight: filter === 'pending' ? '600' : '400'
              }}
            >
              답변 대기 ({pendingCount})
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredQuestions.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {filter === 'answered' ? '✅' : filter === 'pending' ? '⏳' : '❓'}
              </div>
              <p style={{ color: '#6b7280' }}>
                {filter === 'answered' 
                  ? '아직 답변받은 질문이 없습니다.' 
                  : filter === 'pending' 
                    ? '대기 중인 질문이 없습니다.'
                    : '아직 질문이 없습니다.'}
              </p>
            </div>
          </div>
        ) : (
          filteredQuestions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(question => (
              <div 
                key={question.id} 
                className="card"
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: question.isAnswered ? '1px solid #bbf7d0' : '1px solid #fed7aa'
                }}
                onClick={() => handleQuestionClick(question)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>
                          {question.isAnswered ? '✅' : '⏳'}
                        </span>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          background: question.isAnswered ? '#dcfce7' : '#fef3c7',
                          color: question.isAnswered ? '#16a34a' : '#ca8a04'
                        }}>
                          {question.isAnswered ? '답변 완료' : '답변 대기'}
                        </span>
                        {question.isAnswered && question.answeredAt && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {new Date(question.answeredAt).toLocaleDateString()} 답변
                          </span>
                        )}
                      </div>
                      
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        {question.lectureTitle}
                      </h4>
                      
                      <div style={{ 
                        padding: '1rem', 
                        background: '#f9fafb', 
                        borderRadius: '0.5rem',
                        marginBottom: '0.75rem'
                      }}>
                        <p style={{ margin: 0, fontWeight: '500', marginBottom: '0.25rem' }}>
                          Q. {question.question}
                        </p>
                      </div>

                      {question.isAnswered && question.answer && (
                        <div style={{ 
                          padding: '1rem', 
                          background: '#f0fdf4', 
                          borderRadius: '0.5rem',
                          border: '1px solid #bbf7d0'
                        }}>
                          <p style={{ margin: 0, fontSize: '0.875rem' }}>
                            A. {question.answer.length > 100 
                              ? question.answer.substring(0, 100) + '...' 
                              : question.answer}
                          </p>
                          {question.answer.length > 100 && (
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#667eea' }}>
                              클릭해서 전체 답변 보기 →
                            </p>
                          )}
                        </div>
                      )}

                      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        질문일: {new Date(question.createdAt).toLocaleDateString()}
                        {question.answeredBy && ` • 답변: ${question.answeredBy} 선생님`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {showModal && selectedQuestion && (
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
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                질문 상세
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  background: selectedQuestion.isAnswered ? '#dcfce7' : '#fef3c7',
                  color: selectedQuestion.isAnswered ? '#16a34a' : '#ca8a04'
                }}>
                  {selectedQuestion.isAnswered ? '✅ 답변 완료' : '⏳ 답변 대기'}
                </span>
              </div>

              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                📚 {selectedQuestion.lectureTitle}
              </h4>

              <div style={{
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  질문
                </p>
                <p style={{ margin: 0, lineHeight: '1.6' }}>
                  {selectedQuestion.question}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  {new Date(selectedQuestion.createdAt).toLocaleString()}
                </p>
              </div>

              {selectedQuestion.isAnswered && selectedQuestion.answer ? (
                <div style={{
                  padding: '1rem',
                  background: '#f0fdf4',
                  borderRadius: '0.5rem',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: '600', margin: 0, color: '#16a34a' }}>
                      답변
                    </p>
                    {selectedQuestion.answeredBy && (
                      <span style={{ fontSize: '0.875rem', color: '#16a34a' }}>
                        {selectedQuestion.answeredBy} 선생님
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, lineHeight: '1.6' }}>
                    {selectedQuestion.answer}
                  </p>
                  {selectedQuestion.answeredAt && (
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                      {new Date(selectedQuestion.answeredAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  background: '#f9fafb',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                  <p style={{ color: '#6b7280' }}>
                    선생님의 답변을 기다리고 있습니다
                  </p>
                </div>
              )}
            </div>

            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeModal}
                className="btn btn-primary"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentQuestionsView;