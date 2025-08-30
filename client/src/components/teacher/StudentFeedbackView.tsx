import React, { useState, useEffect } from 'react';
import { loadStudentFeedbacks as loadFeedbacksFromStorage, saveStudentFeedbacks, loadStudentProgress as loadProgressFromStorage, loadLectures } from '../../utils/dataStorage';

interface StudentFeedback {
  id: number;
  lectureId: number;
  lectureTitle: string;
  studentId: number;
  studentName: string;
  difficulty: 'too_easy' | 'just_right' | 'too_hard';
  understanding: 'poor' | 'fair' | 'good' | 'excellent';
  question?: string;
  studyTime: number;
  completedAt: string;
  isAnswered: boolean;
  answer?: string;
  answeredAt?: string;
}

interface StudentProgress {
  studentId: number;
  studentName: string;
  lectureId: number;
  lectureTitle: string;
  completedBlocks: number;
  totalBlocks: number;
  progressPercentage: number;
  studyTime: number;
  lastActivity: string;
}

interface StudentFeedbackViewProps {
  onBack: () => void;
  teacherId: number;
}

const StudentFeedbackView: React.FC<StudentFeedbackViewProps> = ({ onBack, teacherId }) => {
  const [feedbacks, setFeedbacks] = useState<StudentFeedback[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [currentView, setCurrentView] = useState<'questions' | 'progress'>('questions');
  const [selectedQuestion, setSelectedQuestion] = useState<StudentFeedback | null>(null);
  const [answerText, setAnswerText] = useState<string>('');
  const [filterLecture, setFilterLecture] = useState<string>('');
  const [filterAnswered, setFilterAnswered] = useState<string>('');

  useEffect(() => {
    loadStudentFeedbacks();
    loadStudentProgress();
  }, [teacherId]);

  const loadStudentFeedbacks = () => {
    // localStorage에서 피드백 데이터 로드 - 해당 교사의 강의에 대한 피드백만
    const allFeedbacks = loadFeedbacksFromStorage();
    const allLectures = loadLectures();
    
    // 현재 교사의 강의들 가져오기
    const teacherLectures = allLectures.filter(lecture => lecture.teacherId === teacherId);
    const teacherLectureIds = teacherLectures.map(lecture => lecture.id);
    
    // 해당 교사의 강의에 대한 피드백만 필터링
    const teacherFeedbacks = allFeedbacks.filter(feedback => 
      teacherLectureIds.includes(feedback.lectureId)
    );
    
    setFeedbacks(teacherFeedbacks);
  };

  const loadStudentProgress = () => {
    // localStorage에서 진도 데이터 로드
    const allProgress = loadProgressFromStorage();
    const allLectures = loadLectures();
    
    // 현재 교사의 강의들 가져오기
    const teacherLectures = allLectures.filter(lecture => lecture.teacherId === teacherId);
    const teacherLectureIds = teacherLectures.map(lecture => lecture.id);
    
    // 해당 교사의 강의에 대한 진도만 필터링하고 변환
    const teacherProgress = allProgress
      .filter(progress => teacherLectureIds.includes(progress.lectureId))
      .map(progress => {
        const lecture = teacherLectures.find(l => l.id === progress.lectureId);
        if (!lecture) return null;
        
        // 학생 이름 가져오기 (실제로는 API에서 학생 정보 조회)
        const studentName = getStudentName(progress.studentId);
        
        const progressPercentage = lecture.contentBlocks.length > 0 
          ? Math.round((progress.completedBlocks.length / lecture.contentBlocks.length) * 100)
          : 0;
        
        return {
          studentId: progress.studentId,
          studentName: studentName,
          lectureId: progress.lectureId,
          lectureTitle: lecture.title,
          completedBlocks: progress.completedBlocks.length,
          totalBlocks: lecture.contentBlocks.length,
          progressPercentage: progressPercentage,
          studyTime: progress.studyTime,
          lastActivity: progress.lastActivity
        };
      })
      .filter(item => item !== null) as StudentProgress[];
    
    setStudentProgress(teacherProgress);
  };
  
  const getStudentName = (studentId: number): string => {
    // 실제로는 API에서 학생 정보를 가져와야 함
    // 임시로 하드코딩된 학생 이름 반환
    const studentNames: {[key: number]: string} = {
      1: '김학생',
      2: '이학생', 
      3: '박학생'
    };
    return studentNames[studentId] || `학생${studentId}`;
  };

  const handleAnswerSubmit = () => {
    if (!selectedQuestion || !answerText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    // localStorage에서 모든 피드백 로드
    const allFeedbacks = loadFeedbacksFromStorage();
    
    // 답변 업데이트
    const updatedAllFeedbacks = allFeedbacks.map(feedback => 
      feedback.id === selectedQuestion.id 
        ? { 
            ...feedback, 
            isAnswered: true, 
            answer: answerText.trim(),
            answeredAt: new Date().toISOString()
          }
        : feedback
    );
    
    // localStorage에 저장
    saveStudentFeedbacks(updatedAllFeedbacks);
    
    // 현재 화면의 feedbacks 상태도 업데이트
    setFeedbacks(feedbacks.map(feedback => 
      feedback.id === selectedQuestion.id 
        ? { 
            ...feedback, 
            isAnswered: true, 
            answer: answerText.trim(),
            answeredAt: new Date().toISOString()
          }
        : feedback
    ));

    setSelectedQuestion(null);
    setAnswerText('');
    alert('답변이 성공적으로 저장되었습니다!');
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'too_easy': return '너무 쉬워요';
      case 'just_right': return '적당해요';
      case 'too_hard': return '너무 어려워요';
      default: return difficulty;
    }
  };

  const getUnderstandingLabel = (understanding: string) => {
    switch (understanding) {
      case 'poor': return '잘 모르겠어요';
      case 'fair': return '조금 이해했어요';
      case 'good': return '잘 이해했어요';
      case 'excellent': return '완전히 이해했어요';
      default: return understanding;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'too_easy': return '#16a34a';
      case 'just_right': return '#d97706';
      case 'too_hard': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getUnderstandingColor = (understanding: string) => {
    switch (understanding) {
      case 'poor': return '#dc2626';
      case 'fair': return '#d97706';
      case 'good': return '#16a34a';
      case 'excellent': return '#059669';
      default: return '#6b7280';
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesLecture = filterLecture === '' || feedback.lectureTitle === filterLecture;
    const matchesAnswered = filterAnswered === '' || 
      (filterAnswered === 'answered' && feedback.isAnswered) ||
      (filterAnswered === 'unanswered' && !feedback.isAnswered);
    return matchesLecture && matchesAnswered;
  });

  const lectures = [...new Set(feedbacks.map(f => f.lectureTitle))];
  const students = [...new Set(studentProgress.map(p => p.studentName))];

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            📊 학생 학습 현황
          </h2>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setCurrentView('questions')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: currentView === 'questions' ? '#667eea' : 'transparent',
            color: currentView === 'questions' ? 'white' : '#6b7280',
            borderRadius: '0.375rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          💬 학생 질문 & 피드백
        </button>
        <button
          onClick={() => setCurrentView('progress')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: currentView === 'progress' ? '#667eea' : 'transparent',
            color: currentView === 'progress' ? 'white' : '#6b7280',
            borderRadius: '0.375rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          📈 학습 진도율
        </button>
      </div>

      {currentView === 'questions' && (
        <div>
          {/* 필터 */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    강의 필터
                  </label>
                  <select
                    value={filterLecture}
                    onChange={(e) => setFilterLecture(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">전체 강의</option>
                    {lectures.map(lecture => (
                      <option key={lecture} value={lecture}>
                        {lecture}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    답변 상태
                  </label>
                  <select
                    value={filterAnswered}
                    onChange={(e) => setFilterAnswered(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">전체</option>
                    <option value="unanswered">미답변</option>
                    <option value="answered">답변완료</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 피드백 목록 */}
          <div className="grid grid-1" style={{ gap: '1.5rem' }}>
            {filteredFeedbacks.map((feedback) => (
              <div key={feedback.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                          👨‍🎓 {feedback.studentName}
                        </h3>
                        <span style={{
                          background: feedback.isAnswered ? '#dcfce7' : '#fef3c7',
                          color: feedback.isAnswered ? '#16a34a' : '#d97706',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {feedback.isAnswered ? '답변완료' : '미답변'}
                        </span>
                      </div>

                      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                        📚 {feedback.lectureTitle} • ⏱️ {feedback.studyTime}분 학습 • 
                        📅 {new Date(feedback.completedAt).toLocaleDateString()}
                      </p>

                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <span style={{
                          background: getDifficultyColor(feedback.difficulty) + '20',
                          color: getDifficultyColor(feedback.difficulty),
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem'
                        }}>
                          📊 {getDifficultyLabel(feedback.difficulty)}
                        </span>
                        <span style={{
                          background: getUnderstandingColor(feedback.understanding) + '20',
                          color: getUnderstandingColor(feedback.understanding),
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem'
                        }}>
                          🧠 {getUnderstandingLabel(feedback.understanding)}
                        </span>
                      </div>

                      {feedback.question && (
                        <div style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          marginBottom: '1rem'
                        }}>
                          <p style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#1f2937' }}>
                            💬 학생 질문:
                          </p>
                          <p style={{ color: '#374151', lineHeight: '1.6', margin: 0 }}>
                            {feedback.question}
                          </p>
                        </div>
                      )}

                      {feedback.isAnswered && feedback.answer && (
                        <div style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          marginBottom: '1rem'
                        }}>
                          <p style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#16a34a' }}>
                            ✅ 선생님 답변:
                          </p>
                          <p style={{ color: '#374151', lineHeight: '1.6', margin: 0, marginBottom: '0.5rem' }}>
                            {feedback.answer}
                          </p>
                          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                            답변일시: {new Date(feedback.answeredAt!).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {feedback.question && !feedback.isAnswered && (
                        <button
                          onClick={() => setSelectedQuestion(feedback)}
                          className="btn btn-primary"
                          style={{ fontSize: '0.875rem' }}
                        >
                          💬 답변하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredFeedbacks.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
              <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
                조건에 맞는 학생 피드백이 없습니다.
              </p>
            </div>
          )}
        </div>
      )}

      {currentView === 'progress' && (
        <div>
          {/* 학생별 진도 현황 */}
          <div className="grid grid-1" style={{ gap: '1rem' }}>
            {students.map(studentName => {
              const studentProgressData = studentProgress.filter(p => p.studentName === studentName);
              const totalStudyTime = studentProgressData.reduce((sum, p) => sum + p.studyTime, 0);
              const avgProgress = Math.round(studentProgressData.reduce((sum, p) => sum + p.progressPercentage, 0) / studentProgressData.length);
              
              return (
                <div key={studentName} className="card">
                  <div className="card-header">
                    <div className="card-title">
                      👨‍🎓 {studentName} - 학습 현황
                    </div>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>
                          {studentProgressData.length}
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>수강 강의</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>
                          {avgProgress}%
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>평균 진도율</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706', margin: 0 }}>
                          {totalStudyTime}분
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>총 학습시간</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {studentProgressData.map(progress => (
                        <div key={`${progress.studentId}-${progress.lectureId}`} 
                             style={{
                               display: 'flex',
                               justifyContent: 'space-between',
                               alignItems: 'center',
                               padding: '1rem',
                               background: '#f8fafc',
                               borderRadius: '0.5rem',
                               border: '1px solid #e2e8f0'
                             }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, marginBottom: '0.25rem' }}>
                              {progress.lectureTitle}
                            </h4>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                              {progress.completedBlocks}/{progress.totalBlocks} 블록 완료 • {progress.studyTime}분 학습
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              fontSize: '1.25rem',
                              fontWeight: '700',
                              color: progress.progressPercentage === 100 ? '#16a34a' : '#6b7280'
                            }}>
                              {progress.progressPercentage}%
                            </span>
                            <div style={{
                              width: '100px',
                              height: '6px',
                              background: '#e5e7eb',
                              borderRadius: '3px',
                              overflow: 'hidden',
                              marginTop: '0.25rem'
                            }}>
                              <div style={{
                                width: `${progress.progressPercentage}%`,
                                height: '100%',
                                background: progress.progressPercentage === 100 ? '#16a34a' : '#2563eb',
                                borderRadius: '3px'
                              }}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 답변 모달 */}
      {selectedQuestion && (
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
              <div className="card-title">
                💬 {selectedQuestion.studentName} 학생 질문에 답변하기
              </div>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  📚 강의: {selectedQuestion.lectureTitle}
                </p>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <p style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#1f2937' }}>
                    학생 질문:
                  </p>
                  <p style={{ color: '#374151', lineHeight: '1.6', margin: 0 }}>
                    {selectedQuestion.question}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  답변 내용
                </label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="학생의 질문에 대한 답변을 작성해주세요..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => {
                    setSelectedQuestion(null);
                    setAnswerText('');
                  }}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button 
                  onClick={handleAnswerSubmit}
                  className="btn btn-primary"
                >
                  답변 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeedbackView;