import React, { useState, useEffect } from 'react';
import LectureFeedback from './LectureFeedback';
import { loadLectures, loadStudentProgress, updateStudentProgress, getStudentProgressForLecture, saveStudentFeedbacks, loadStudentFeedbacks, getNextFeedbackId, loadQuizzes, Quiz } from '../../utils/dataStorage';
import StudentQuizView from './StudentQuizView';

interface ContentBlock {
  id: string;
  type: 'video' | 'code' | 'test' | 'mindmap' | 'document' | 'quiz' | 'image';
  title: string;
  url: string;
  description?: string;
}

interface Lecture {
  id: number;
  title: string;
  subject: string;
  description: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  materials: string[];
  contentBlocks: ContentBlock[];
  assignedClasses: number[];
  createdAt: string;
  isPublished: boolean;
  teacherId: number;
  teacherName: string;
}

interface StudentLectureViewProps {
  onBack: () => void;
  studentId: number;
}

const StudentLectureView: React.FC<StudentLectureViewProps> = ({ onBack, studentId }) => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [completedBlocks, setCompletedBlocks] = useState<Set<string>>(new Set());
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [lectureProgress, setLectureProgress] = useState<{[key: number]: number}>({});
  const [studyTimes, setStudyTimes] = useState<{[key: number]: number}>({});
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedUnderstanding, setSelectedUnderstanding] = useState<string>('');
  const [questionText, setQuestionText] = useState<string>('');
  const [savedFeedbacks, setSavedFeedbacks] = useState<{[key: number]: any}>({});
  const [lectureQuestions, setLectureQuestions] = useState<any[]>([]);
  const [lectureQuizzes, setLectureQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    loadStudentLectures();
    loadProgress();
    loadSavedFeedbacks();
    loadLectureQuestions();
    
    // localStorage 변경사항을 실시간으로 반영
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'studylink_lectures') {
        loadStudentLectures();
      } else if (e.key === 'studylink_student_progress') {
        loadProgress();
      } else if (e.key === 'studylink_student_feedbacks') {
        loadSavedFeedbacks();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 같은 탭 내에서의 변경사항도 감지하기 위해 커스텀 이벤트 리스너 추가
    const handleLocalStorageChange = () => {
      loadStudentLectures();
      loadProgress();
      loadSavedFeedbacks();
    };
    
    window.addEventListener('localStorageChanged', handleLocalStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChanged', handleLocalStorageChange);
    };
  }, [studentId]);

  // 선택된 강의가 변경될 때 해당 강의의 저장된 피드백 로드
  useEffect(() => {
    if (selectedLecture) {
      const allQuizzes = loadQuizzes();
      setLectureQuizzes(allQuizzes.filter(q => q.lecture_id === selectedLecture.id));
      const feedback = savedFeedbacks[selectedLecture.id];
      if (feedback) {
        setSelectedDifficulty(feedback.difficulty || '');
        setSelectedUnderstanding(feedback.understanding || '');
        setQuestionText(feedback.question || '');
      } else {
        setSelectedDifficulty('');
        setSelectedUnderstanding('');
        setQuestionText('');
      }
    } else {
      setLectureQuizzes([]);
    }
  }, [selectedLecture, savedFeedbacks]);

  const loadStudentLectures = () => {
    // localStorage에서 강의 데이터 로드
    const allLectures = loadLectures();
    
    // 학생이 속한 반의 강의들만 가져와야 함
    // 학생 ID = 1이라고 가정하고 반 ID = 1, 2에 속한다고 가정
    const studentClasses = [1, 2]; // 실제로는 API에서 학생의 반 목록을 가져와야 함

    // 학생이 속한 반에 배정된 강의들만 필터링
    const studentLectures = allLectures.filter(lecture => 
      lecture.isPublished && 
      lecture.assignedClasses.some(classId => studentClasses.includes(classId))
    );

    setLectures(studentLectures);
  };

  const loadProgress = () => {
    // localStorage에서 학생 진도 데이터 로드
    const allProgress = loadStudentProgress();
    
    // 현재 학생의 모든 완료된 블록들을 가져옴
    const studentProgress = allProgress.filter(p => p.studentId === studentId);
    const allCompletedBlocks = new Set<string>();
    
    studentProgress.forEach(progress => {
      progress.completedBlocks.forEach(blockId => {
        allCompletedBlocks.add(blockId);
      });
    });
    
    setCompletedBlocks(allCompletedBlocks);
    
    // 학습 시간도 로드
    const studyTimeMap: {[key: number]: number} = {};
    studentProgress.forEach(progress => {
      studyTimeMap[progress.lectureId] = progress.studyTime;
    });
    setStudyTimes(studyTimeMap);
  };

  const loadLectureQuestions = () => {
    const questions = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
    setLectureQuestions(questions);
  };
  
  const loadSavedFeedbacks = () => {
    const allFeedbacks = loadStudentFeedbacks();
    const studentFeedbacks = allFeedbacks.filter(f => f.studentId === studentId);
    const feedbackMap: {[key: number]: any} = {};
    
    studentFeedbacks.forEach(feedback => {
      feedbackMap[feedback.lectureId] = feedback;
    });
    
    setSavedFeedbacks(feedbackMap);
  };

  const saveFeedbackToStorage = (difficulty?: string, understanding?: string, question?: string) => {
    if (!selectedLecture) return;
    
    const allFeedbacks = loadStudentFeedbacks();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // 기존 피드백 찾기
    const existingIndex = allFeedbacks.findIndex(
      f => f.lectureId === selectedLecture.id && f.studentId === studentId
    );
    
    const feedbackData = {
      id: existingIndex >= 0 ? allFeedbacks[existingIndex].id : getNextFeedbackId(),
      lectureId: selectedLecture.id,
      lectureTitle: selectedLecture.title,
      studentId: studentId,
      studentName: currentUser.name || '학생',
      teacherId: selectedLecture.teacherId,
      teacherName: selectedLecture.teacherName,
      difficulty: difficulty !== undefined ? difficulty : selectedDifficulty,
      understanding: understanding !== undefined ? understanding : selectedUnderstanding,
      question: question !== undefined ? question : questionText,
      updatedAt: new Date().toISOString(),
      isAnswered: false
    };
    
    if (existingIndex >= 0) {
      allFeedbacks[existingIndex] = { ...allFeedbacks[existingIndex], ...feedbackData };
    } else {
      allFeedbacks.push(feedbackData);
    }
    
    saveStudentFeedbacks(allFeedbacks);
    
    // 교사에게 질문 전달을 위한 별도 저장
    if (question || questionText) {
      const teacherQuestions = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
      const questionData = {
        id: Date.now(),
        studentId: studentId,
        studentName: currentUser.name || '학생',
        lectureId: selectedLecture.id,
        lectureTitle: selectedLecture.title,
        teacherId: selectedLecture.teacherId,
        teacherName: selectedLecture.teacherName,
        question: question || questionText,
        createdAt: new Date().toISOString(),
        isAnswered: false,
        answer: ''
      };
      
      // 중복 방지
      const existingQuestionIndex = teacherQuestions.findIndex(
        (q: any) => q.studentId === studentId && q.lectureId === selectedLecture.id && q.question === (question || questionText)
      );
      
      if (existingQuestionIndex === -1) {
        teacherQuestions.push(questionData);
        localStorage.setItem('teacherQuestions', JSON.stringify(teacherQuestions));
      }
    }
    
    // 로컬 상태 업데이트
    setSavedFeedbacks(prev => ({
      ...prev,
      [selectedLecture.id]: feedbackData
    }));
    
    // localStorage 변경 이벤트 발생
    window.dispatchEvent(new Event('localStorageChanged'));
  };

  const toggleBlockCompletion = (blockId: string) => {
    const newCompleted = new Set(completedBlocks);
    if (newCompleted.has(blockId)) {
      newCompleted.delete(blockId);
    } else {
      newCompleted.add(blockId);
    }
    setCompletedBlocks(newCompleted);
    
    // localStorage에 진도 업데이트
    if (selectedLecture) {
      const lectureCompletedBlocks = selectedLecture.contentBlocks
        .filter(block => newCompleted.has(block.id))
        .map(block => block.id);
      
      const currentTime = studyTimes[selectedLecture.id] || 0;
      updateStudentProgress(studentId, selectedLecture.id, lectureCompletedBlocks, currentTime);
      
      // 모든 콘텐츠 블록을 완료했을 때 피드백 모달 표시
      const completedCount = lectureCompletedBlocks.length;
      if (completedCount === selectedLecture.contentBlocks.length && completedCount > 0) {
        setShowFeedback(true);
      }
    }
  };

  const openContentBlock = (block: ContentBlock) => {
    // 새 창에서 콘텐츠 열기
    window.open(block.url, '_blank');
    // 완료 상태 토글
    if (!completedBlocks.has(block.id)) {
      toggleBlockCompletion(block.id);
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '기초';
      case 'intermediate': return '중급';
      case 'advanced': return '고급';
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#16a34a';
      case 'intermediate': return '#d97706';
      case 'advanced': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getBlockTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return '🎥 동영상';
      case 'code': return '💻 코드';
      case 'test': return '📝 테스트';
      case 'mindmap': return '🗺️ 마인드맵';
      case 'document': return '📄 문서';
      case 'quiz': return '❓ 퀴즈';
      case 'image': return '🖼️ 이미지';
      default: return type;
    }
  };

  const calculateProgress = (lecture: Lecture) => {
    if (lecture.contentBlocks.length === 0) return 0;
    const completedCount = lecture.contentBlocks.filter(block => completedBlocks.has(block.id)).length;
    return Math.round((completedCount / lecture.contentBlocks.length) * 100);
  };

  const handleLectureStart = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setStartTime(new Date());
  };

  const handleFeedbackSubmit = (feedback: any) => {
    console.log('Feedback submitted:', feedback);
    
    // 학습 시간 저장
    if (selectedLecture && startTime) {
      const endTime = new Date();
      const actualStudyTime = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      const finalStudyTime = feedback.studyTime || actualStudyTime;
      
      setStudyTimes({
        ...studyTimes,
        [selectedLecture.id]: finalStudyTime
      });
      
      // localStorage에 진도 업데이트 (학습 시간 포함)
      const lectureCompletedBlocks = selectedLecture.contentBlocks
        .filter(block => completedBlocks.has(block.id))
        .map(block => block.id);
      
      updateStudentProgress(studentId, selectedLecture.id, lectureCompletedBlocks, finalStudyTime);
      
      // 피드백을 localStorage에 저장
      const allFeedbacks = loadStudentFeedbacks();
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      const newFeedback = {
        id: getNextFeedbackId(),
        lectureId: selectedLecture.id,
        lectureTitle: selectedLecture.title,
        studentId: studentId,
        studentName: currentUser.name || '학생',
        teacherId: selectedLecture.teacherId,
        difficulty: feedback.difficulty,
        understanding: feedback.understanding,
        question: feedback.question,
        studyTime: finalStudyTime,
        completedAt: new Date().toISOString(),
        isAnswered: false
      };
      
      const updatedFeedbacks = [...allFeedbacks, newFeedback];
      saveStudentFeedbacks(updatedFeedbacks);
    }
    
    setShowFeedback(false);
    alert('피드백이 성공적으로 제출되었습니다! 선생님께서 확인하시고 답변해드릴게요. 📚');
    setSelectedLecture(null);
    setStartTime(null);
  };

  const handleFeedbackClose = () => {
    setShowFeedback(false);
    setSelectedLecture(null);
    setStartTime(null);
  };

  const filteredLectures = lectures.filter(lecture => 
    filterSubject === '' || lecture.subject === filterSubject
  );

  const subjects = [...new Set(lectures.map(l => l.subject))];

  if (selectedQuiz) {
    return (
      <StudentQuizView
        quiz={selectedQuiz}
        studentId={studentId}
        onBack={() => setSelectedQuiz(null)}
      />
    );
  }

  if (selectedLecture) {
    const progress = calculateProgress(selectedLecture);
    return (
      <div>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setSelectedLecture(null)} 
            className="btn btn-secondary"
          >
            ← 뒤로
          </button>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            {selectedLecture.title}
          </h2>
          <span style={{
            background: progress === 100 ? '#dcfce7' : progress > 0 ? '#fef3c7' : '#fee2e2',
            color: progress === 100 ? '#16a34a' : progress > 0 ? '#d97706' : '#dc2626',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {progress}% 완료
          </span>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-body">
            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '1.125rem', lineHeight: '1.6' }}>
              {selectedLecture.description}
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{
                background: '#dbeafe',
                color: '#1e40af',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.875rem'
              }}>
                👨‍🏫 {selectedLecture.teacherName}
              </span>
              <span style={{
                background: '#dbeafe',
                color: '#1e40af',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.875rem'
              }}>
                {selectedLecture.subject}
              </span>
              <span style={{
                background: getDifficultyColor(selectedLecture.difficulty) + '20',
                color: getDifficultyColor(selectedLecture.difficulty),
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.875rem'
              }}>
                {getDifficultyLabel(selectedLecture.difficulty)}
              </span>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                ⏱️ {selectedLecture.duration}분
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              📚 학습 콘텐츠 ({selectedLecture.contentBlocks.length}개)
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedLecture.contentBlocks.map((block, index) => {
                const isCompleted = completedBlocks.has(block.id);
                return (
                  <div 
                    key={block.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1.5rem',
                      border: isCompleted ? '2px solid #16a34a' : '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      background: isCompleted ? '#f0fdf4' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => openContentBlock(block)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem',
                      flex: 1 
                    }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        background: isCompleted ? '#16a34a' : '#f3f4f6',
                        color: isCompleted ? 'white' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                      }}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{
                            background: '#f3f4f6',
                            color: '#374151',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            {getBlockTypeLabel(block.type)}
                          </span>
                          {isCompleted && (
                            <span style={{
                              background: '#dcfce7',
                              color: '#16a34a',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              완료됨
                            </span>
                          )}
                        </div>
                        <h3 style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '600', 
                          marginBottom: '0.25rem',
                          color: isCompleted ? '#16a34a' : '#1f2937'
                        }}>
                          {block.title}
                        </h3>
                        {block.description && (
                          <p style={{ 
                            color: '#6b7280', 
                            fontSize: '0.875rem', 
                            margin: 0 
                          }}>
                            {block.description}
                          </p>
                        )}
                      </div>
                      
                      <div style={{ fontSize: '1.5rem', color: '#6b7280' }}>
                        →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedLecture.contentBlocks.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                <p>아직 등록된 학습 콘텐츠가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 퀴즈 섹션 */}
        {lectureQuizzes.length > 0 && (
            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <div className="card-title">
                    📝 퀴즈
                    </div>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {lectureQuizzes.map(quiz => (
                            <div 
                                key={quiz.id} 
                                className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                onClick={() => setSelectedQuiz(quiz)}
                            >
                                <div>
                                    <h4 className="font-semibold">{quiz.title}</h4>
                                    <p className="text-sm text-gray-500">{quiz.quiz_type === 'multiple_choice' ? '객관식' : 'OX 퀴즈'}</p>
                                </div>
                                <button className="btn btn-primary btn-sm">퀴즈 풀기</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* 강의별 질문 (진행중에도 표시) */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-header">
            <div className="card-title">
              💬 선생님께 질문하기
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  난이도는 어떠셨나요?
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    style={{ 
                      flex: 1,
                      padding: '0.75rem',
                      border: selectedDifficulty === 'easy' ? '2px solid #16a34a' : '1px solid #e5e7eb',
                      background: selectedDifficulty === 'easy' ? '#dcfce7' : 'white',
                      color: selectedDifficulty === 'easy' ? '#16a34a' : '#6b7280',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontWeight: selectedDifficulty === 'easy' ? '600' : '400',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      setSelectedDifficulty('easy');
                      saveFeedbackToStorage('easy', undefined, undefined);
                    }}
                  >
                    😊 쉬움
                  </button>
                  <button 
                    style={{ 
                      flex: 1,
                      padding: '0.75rem',
                      border: selectedDifficulty === 'medium' ? '2px solid #d97706' : '1px solid #e5e7eb',
                      background: selectedDifficulty === 'medium' ? '#fef3c7' : 'white',
                      color: selectedDifficulty === 'medium' ? '#d97706' : '#6b7280',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontWeight: selectedDifficulty === 'medium' ? '600' : '400',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      setSelectedDifficulty('medium');
                      saveFeedbackToStorage('medium', undefined, undefined);
                    }}
                  >
                    😐 적당함
                  </button>
                  <button 
                    style={{ 
                      flex: 1,
                      padding: '0.75rem',
                      border: selectedDifficulty === 'hard' ? '2px solid #dc2626' : '1px solid #e5e7eb',
                      background: selectedDifficulty === 'hard' ? '#fee2e2' : 'white',
                      color: selectedDifficulty === 'hard' ? '#dc2626' : '#6b7280',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontWeight: selectedDifficulty === 'hard' ? '600' : '400',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      setSelectedDifficulty('hard');
                      saveFeedbackToStorage('hard', undefined, undefined);
                    }}
                  >
                    😰 어려움
                  </button>
                </div>
                {selectedDifficulty && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#16a34a' }}>
                    ✓ 선생님께 전달되었습니다
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  이해도는 어떠셨나요?
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    style={{ 
                      flex: 1,
                      padding: '0.75rem',
                      border: selectedUnderstanding === 'confused' ? '2px solid #dc2626' : '1px solid #e5e7eb',
                      background: selectedUnderstanding === 'confused' ? '#fee2e2' : 'white',
                      color: selectedUnderstanding === 'confused' ? '#dc2626' : '#6b7280',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontWeight: selectedUnderstanding === 'confused' ? '600' : '400',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      setSelectedUnderstanding('confused');
                      saveFeedbackToStorage(undefined, 'confused', undefined);
                    }}
                  >
                    😕 잘 모르겠어요
                  </button>
                  <button 
                    style={{ 
                      flex: 1,
                      padding: '0.75rem',
                      border: selectedUnderstanding === 'partial' ? '2px solid #d97706' : '1px solid #e5e7eb',
                      background: selectedUnderstanding === 'partial' ? '#fef3c7' : 'white',
                      color: selectedUnderstanding === 'partial' ? '#d97706' : '#6b7280',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontWeight: selectedUnderstanding === 'partial' ? '600' : '400',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      setSelectedUnderstanding('partial');
                      saveFeedbackToStorage(undefined, 'partial', undefined);
                    }}
                  >
                    🙂 조금 이해했어요
                  </button>
                  <button 
                    style={{ 
                      flex: 1,
                      padding: '0.75rem',
                      border: selectedUnderstanding === 'good' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                      background: selectedUnderstanding === 'good' ? '#dbeafe' : 'white',
                      color: selectedUnderstanding === 'good' ? '#2563eb' : '#6b7280',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontWeight: selectedUnderstanding === 'good' ? '600' : '400',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      setSelectedUnderstanding('good');
                      saveFeedbackToStorage(undefined, 'good', undefined);
                    }}
                  >
                    😊 잘 이해했어요
                  </button>
                  <button 
                    style={{ 
                      flex: 1,
                      padding: '0.75rem',
                      border: selectedUnderstanding === 'perfect' ? '2px solid #16a34a' : '1px solid #e5e7eb',
                      background: selectedUnderstanding === 'perfect' ? '#dcfce7' : 'white',
                      color: selectedUnderstanding === 'perfect' ? '#16a34a' : '#6b7280',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontWeight: selectedUnderstanding === 'perfect' ? '600' : '400',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      setSelectedUnderstanding('perfect');
                      saveFeedbackToStorage(undefined, 'perfect', undefined);
                    }}
                  >
                    🤩 완벽해요
                  </button>
                </div>
                {selectedUnderstanding && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#16a34a' }}>
                    ✓ 선생님께 전달되었습니다
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  📝 새로운 질문 작성
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="궁금한 점을 입력해주세요..."
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      if (questionText.trim()) {
                        // Add question to teacherQuestions
                        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                        const teacherQuestions = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
                        const questionData = {
                          id: Date.now(),
                          studentId: studentId,
                          studentName: currentUser.name || '학생',
                          lectureId: selectedLecture.id,
                          lectureTitle: selectedLecture.title,
                          teacherId: selectedLecture.teacherId,
                          teacherName: selectedLecture.teacherName,
                          question: questionText,
                          createdAt: new Date().toISOString(),
                          isAnswered: false,
                          answer: ''
                        };
                        
                        teacherQuestions.push(questionData);
                        localStorage.setItem('teacherQuestions', JSON.stringify(teacherQuestions));
                        
                        // Update local state
                        setLectureQuestions([...teacherQuestions]);
                        
                        // Clear question input
                        setQuestionText('');
                        alert('질문이 선생님께 전송되었습니다. 답변을 기다려주세요! 📚');
                        
                        // Refresh the page to show new question
                        loadLectureQuestions();
                      } else {
                        alert('질문을 입력해주세요.');
                      }
                    }}
                  >
                    전송
                  </button>
                </div>
                
                {/* 질문 및 답변 목록 */}
                {selectedLecture && lectureQuestions
                  .filter(q => q.lectureId === selectedLecture.id && q.studentId === studentId)
                  .length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                      💬 나의 질문 기록
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {lectureQuestions
                        .filter(q => q.lectureId === selectedLecture.id && q.studentId === studentId)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((q, index) => (
                          <div key={q.id} style={{
                            padding: '1rem',
                            background: '#f9fafb',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                질문 #{lectureQuestions.filter(lq => lq.lectureId === selectedLecture.id && lq.studentId === studentId).length - index}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                {new Date(q.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#1f2937' }}>
                              Q: {q.question}
                            </p>
                            {q.isAnswered && q.answer ? (
                              <div style={{
                                marginTop: '0.5rem',
                                padding: '0.75rem',
                                background: '#f0fdf4',
                                borderLeft: '3px solid #16a34a',
                                borderRadius: '0.25rem'
                              }}>
                                <p style={{ fontSize: '0.875rem', color: '#16a34a', marginBottom: '0.25rem', fontWeight: '500' }}>
                                  A: 선생님 답변
                                </p>
                                <p style={{ fontSize: '0.875rem', color: '#374151' }}>
                                  {q.answer}
                                </p>
                              </div>
                            ) : (
                              <p style={{ fontSize: '0.875rem', color: '#d97706', fontStyle: 'italic', marginTop: '0.5rem' }}>
                                ⏳ 답변 대기 중...
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {savedFeedbacks[selectedLecture?.id || 0]?.answer && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#f0fdf4',
                    borderLeft: '4px solid #16a34a',
                    borderRadius: '0.375rem'
                  }}>
                    <p style={{ fontWeight: '500', color: '#16a34a', marginBottom: '0.5rem' }}>
                      🎓 선생님 답변:
                    </p>
                    <p style={{ color: '#374151', margin: 0 }}>
                      {savedFeedbacks[selectedLecture.id].answer}
                    </p>
                  </div>
                )}
              </div>

              {/* 피드백 상태 요약 - 제거됨 */}
              {false && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    📋 현재 피드백 상태:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    {selectedDifficulty && (
                      <li>난이도: {selectedDifficulty === 'easy' ? '쉬움' : selectedDifficulty === 'medium' ? '적당함' : '어려움'}</li>
                    )}
                    {selectedUnderstanding && (
                      <li>이해도: {
                        selectedUnderstanding === 'confused' ? '잘 모르겠어요' :
                        selectedUnderstanding === 'partial' ? '조금 이해했어요' :
                        selectedUnderstanding === 'good' ? '잘 이해했어요' : '완벽해요'
                      }</li>
                    )}
                    {questionText && (
                      <li>질문: {questionText}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            📚 내 강의
          </h2>
        </div>
        <div style={{ color: '#6b7280', fontSize: '1rem' }}>
          총 {filteredLectures.length}개 강의
        </div>
      </div>

      {/* 필터 */}
      {subjects.length > 1 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ fontWeight: '500', fontSize: '0.875rem' }}>과목 필터:</label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">전체 과목</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 강의 목록 */}
      <div className="grid grid-1" style={{ gap: '1.5rem' }}>
        {filteredLectures.map((lecture, index) => {
          const progress = calculateProgress(lecture);
          // 이전 강의가 완료되었는지 확인
          const previousLecture = index > 0 ? filteredLectures[index - 1] : null;
          const isPreviousCompleted = !previousLecture || calculateProgress(previousLecture) === 100;
          const isLocked = !isPreviousCompleted;
          
          return (
            <div 
              key={lecture.id} 
              className="card" 
              style={{ 
                cursor: 'pointer',
                opacity: isLocked ? 0.8 : 1,
                position: 'relative'
              }}
              onClick={() => {
                // 잠금 해제 - 완료된 강의도 다시 볼 수 있도록
                setSelectedLecture(lecture);
              }}
            >
              {isLocked && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255, 255, 255, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.5rem',
                  zIndex: 10
                }}>
                  <div style={{
                    background: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
                    <p style={{ fontWeight: '600', color: '#dc2626', marginBottom: '0.25rem' }}>
                      강의 잠김
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      이전 강의를 먼저 완료하세요
                    </p>
                  </div>
                </div>
              )}
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                        {lecture.title}
                      </h3>
                      <span style={{
                        background: progress === 100 ? '#dcfce7' : progress > 0 ? '#fef3c7' : '#fee2e2',
                        color: progress === 100 ? '#16a34a' : progress > 0 ? '#d97706' : '#dc2626',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {progress}% 완료
                      </span>
                    </div>

                    <p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
                      {lecture.description}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      <span style={{
                        background: '#dbeafe',
                        color: '#1e40af',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem'
                      }}>
                        👨‍🏫 {lecture.teacherName}
                      </span>
                      <span style={{
                        background: '#dbeafe',
                        color: '#1e40af',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem'
                      }}>
                        {lecture.subject}
                      </span>
                      <span style={{
                        background: getDifficultyColor(lecture.difficulty) + '20',
                        color: getDifficultyColor(lecture.difficulty),
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem'
                      }}>
                        {getDifficultyLabel(lecture.difficulty)}
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        ⏱️ {lecture.duration}분
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        📚 {lecture.contentBlocks.length}개 콘텐츠
                      </span>
                    </div>

                    {/* 진도 바 */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>진도율</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: progress === 100 ? '#16a34a' : '#6b7280' }}>
                          {progress}%
                        </span>
                      </div>
                      <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '8px' }}>
                        <div style={{
                          background: progress === 100 ? '#16a34a' : '#2563eb',
                          width: `${progress}%`,
                          height: '8px',
                          borderRadius: '9999px',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        등록일: {lecture.createdAt}
                      </span>
                      <button 
                        className="btn btn-primary"
                        style={{ fontSize: '0.875rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLectureStart(lecture);
                        }}
                      >
                        📚 학습하기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLectures.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
          <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
            {filterSubject 
              ? '해당 과목의 강의가 없습니다.' 
              : '아직 배정된 강의가 없습니다.'
            }
          </p>
        </div>
      )}

      {/* 피드백 모달 */}
      {showFeedback && selectedLecture && (
        <LectureFeedback
          lectureId={selectedLecture.id}
          lectureTitle={selectedLecture.title}
          studentId={studentId}
          teacherId={selectedLecture.teacherId}
          onSubmit={handleFeedbackSubmit}
          onClose={handleFeedbackClose}
        />
      )}
    </div>
  );
};

export default StudentLectureView;