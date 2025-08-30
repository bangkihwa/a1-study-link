import React, { useState, useEffect } from 'react';
import StudentLectureView from '../student/StudentLectureView';
import StudentQuestionsView from '../student/StudentQuestionsView';
import ClassBulletinBoard from '../class/ClassBulletinBoard';
import ParentConfirmationModal from '../student/ParentConfirmationModal';
import { loadStudentFeedbacks, loadStudentProgress, loadLectures, loadAssignments, toggleAssignmentComplete } from '../../utils/dataStorage';

interface StudentDashboardProps {
  user: {
    id: number;
    name: string;
    role: string;
  };
  stats?: any;
  recentActivity?: any[];
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, stats, recentActivity }) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'lectures' | 'calendar' | 'assignments' | 'bulletin' | 'questions'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [studyHistory, setStudyHistory] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [studentClasses, setStudentClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [showParentModal, setShowParentModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<{ start: Date; end: Date } | null>(null);
  const [parentConfirmations, setParentConfirmations] = useState<any[]>([]);

  const handleSubjectClick = (className: string) => {
    const selectedCls = studentClasses.find(c => c.name === className);
    if (selectedCls) {
      setSelectedClass(selectedCls);
      setCurrentView('bulletin');
    }
  };

  const handleQuestionSubmit = () => {
    alert('질문을 등록하는 기능은 준비 중입니다.');
  };

  const handleAssignmentView = () => {
    alert('과제 목록을 확인하는 기능은 준비 중입니다.');
  };

  const handleLectureView = () => {
    setCurrentView('lectures');
  };

  useEffect(() => {
    // 학습 기록 로드
    const allProgress = loadStudentProgress();
    const studentProgress = allProgress.filter(p => p.studentId === user.id);
    
    // 학부모 확인 기록 로드
    const confirmations = JSON.parse(localStorage.getItem('parentConfirmations') || '[]');
    setParentConfirmations(confirmations.filter((c: any) => c.studentId === user.id));
    
    const allFeedbacks = loadStudentFeedbacks();
    const studentFeedbacks = allFeedbacks.filter(f => f.studentId === user.id);
    
    const allAssignments = loadAssignments();
    // 학생이 속한 반의 과제만 표시 (여기서는 간단하게 모든 과제 표시)
    setAssignments(allAssignments);
    
    setStudyHistory(studentProgress);
    setFeedbacks(studentFeedbacks);
    
    // 학생이 속한 반 정보 로드
    const studentsData = localStorage.getItem('students') || localStorage.getItem('studylink_students');
    const classesData = localStorage.getItem('classes') || localStorage.getItem('studylink_classes');
    
    if (classesData) {
      const classes = JSON.parse(classesData);
      const enrolledClasses: any[] = [];
      
      // 먼저 students 데이터에서 찾기
      if (studentsData) {
        const students = JSON.parse(studentsData);
        // ID, username, name으로 학생 찾기
        const currentStudent = students.find((s: any) => 
          s.id === user.id || 
          s.username === user.username || 
          s.name === user.name ||
          (user.username && s.username === user.username) ||
          (user.name && s.name === user.name)
        );
        
        if (currentStudent) {
          // classIds가 있으면 해당 반 찾기
          if (currentStudent.classIds && currentStudent.classIds.length > 0) {
            const classesById = classes.filter((c: any) => 
              currentStudent.classIds.includes(c.id)
            );
            enrolledClasses.push(...classesById);
          }
        }
      }
      
      // classes의 students 배열에서도 찾기
      classes.forEach((cls: any) => {
        // students 배열 체크
        if (cls.students && Array.isArray(cls.students)) {
          const isEnrolled = cls.students.some((s: any) => 
            s.id === user.id || 
            s.name === user.name ||
            s.username === user.username ||
            (typeof s === 'number' && s === user.id)
          );
          if (isEnrolled && !enrolledClasses.some(c => c.id === cls.id)) {
            enrolledClasses.push(cls);
          }
        }
        
        // studentIds 배열 체크
        if (cls.studentIds && Array.isArray(cls.studentIds)) {
          const isEnrolled = cls.studentIds.includes(user.id);
          if (isEnrolled && !enrolledClasses.some(c => c.id === cls.id)) {
            enrolledClasses.push(cls);
          }
        }
      });
      
      console.log('Found enrolled classes:', enrolledClasses);
      setStudentClasses(enrolledClasses);
    }
  }, [user.id, user.name, currentView]);

  const getStudyDataForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayStudy = studyHistory.filter(s => 
      s.lastActivity && s.lastActivity.startsWith(dateStr)
    );
    const dayFeedbacks = feedbacks.filter(f => 
      f.completedAt && f.completedAt.startsWith(dateStr)
    );
    return { studies: dayStudy, feedbacks: dayFeedbacks };
  };

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const days = [];
    
    // 주간 확인 여부 체크 함수
    const isWeekConfirmed = (date: Date) => {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return parentConfirmations.some((conf: any) => {
        const confWeekStart = new Date(conf.weekStart);
        return confWeekStart.toDateString() === weekStart.toDateString();
      });
    };
    
    // 빈 칸 추가
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} style={{ padding: '0.5rem' }}></div>);
    }
    
    // 날짜 추가
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayData = getStudyDataForDate(date);
      const hasStudy = dayData.studies.length > 0 || dayData.feedbacks.length > 0;
      const isSunday = date.getDay() === 0;
      const weekConfirmed = isWeekConfirmed(date);
      
      days.push(
        <div
          key={day}
          onClick={() => {
            if (hasStudy) {
              const lectures = loadLectures();
              let message = `📅 ${year}년 ${month + 1}월 ${day}일 학습 기록\n\n`;
              
              dayData.studies.forEach(study => {
                const lecture = lectures.find(l => l.id === study.lectureId);
                if (lecture) {
                  message += `📚 ${lecture.title}\n`;
                  message += `   - 학습시간: ${study.studyTime}분\n`;
                  message += `   - 완료 블록: ${study.completedBlocks.length}개\n\n`;
                }
              });
              
              dayData.feedbacks.forEach(feedback => {
                message += `💬 ${feedback.lectureTitle} 피드백\n`;
                message += `   - 난이도: ${feedback.difficulty === 'too_easy' ? '쉬움' : feedback.difficulty === 'just_right' ? '적당함' : '어려움'}\n`;
                message += `   - 이해도: ${feedback.understanding === 'excellent' ? '매우 좋음' : feedback.understanding === 'good' ? '좋음' : feedback.understanding === 'fair' ? '보통' : '부족'}\n`;
                if (feedback.question) {
                  message += `   - 질문: ${feedback.question}\n`;
                  if (feedback.answer) {
                    message += `   - 답변: ${feedback.answer}\n`;
                  }
                }
                message += '\n';
              });
              
              alert(message);
            }
          }}
          style={{
            padding: '0.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            cursor: hasStudy ? 'pointer' : 'default',
            background: hasStudy ? '#dcfce7' : 'white',
            minHeight: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <div style={{ fontWeight: '500' }}>{day}</div>
          {hasStudy && (
            <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
              ✅ 학습완료
            </div>
          )}
          {isSunday && weekConfirmed && (
            <div style={{ 
              position: 'absolute', 
              top: '2px', 
              right: '2px',
              fontSize: '0.7rem',
              backgroundColor: '#fbbf24',
              color: 'white',
              padding: '1px 4px',
              borderRadius: '3px',
              fontWeight: 'bold'
            }}>
              확인됨
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button 
            onClick={() => setSelectedDate(new Date(year, month - 1))}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            ←
          </button>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            {year}년 {monthNames[month]}
          </h3>
          <button 
            onClick={() => setSelectedDate(new Date(year, month + 1))}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>일</div>
          <div style={{ textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>월</div>
          <div style={{ textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>화</div>
          <div style={{ textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>수</div>
          <div style={{ textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>목</div>
          <div style={{ textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>금</div>
          <div style={{ textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>토</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {days}
        </div>
      </div>
    );
  };



  if (currentView === 'lectures') {
    return <StudentLectureView onBack={() => setCurrentView('dashboard')} studentId={user.id} />;
  }

  if (currentView === 'questions') {
    return <StudentQuestionsView 
      studentId={user.id} 
      studentName={user.name}
      onBack={() => setCurrentView('dashboard')} 
    />;
  }

  if (currentView === 'bulletin' && selectedClass) {
    return (
      <ClassBulletinBoard 
        classId={selectedClass.id}
        className={selectedClass.name}
        userRole="student"
        userId={user.id}
        userName={user.name}
        onBack={() => {
          setCurrentView('dashboard');
          setSelectedClass(null);
        }}
      />
    );
  }

  if (currentView === 'calendar') {
    return (
      <div>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setCurrentView('dashboard')} 
              className="btn btn-secondary"
            >
              ← 뒤로
            </button>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
              📅 학습 달력
            </h2>
          </div>
          <button
            onClick={() => {
              const today = new Date();
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay());
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);
              setSelectedWeek({ start: weekStart, end: weekEnd });
              setShowParentModal(true);
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ✅ 주간 학부모 확인
          </button>
        </div>
        <div className="card">
          <div className="card-body">
            {renderCalendar()}
          </div>
        </div>
        {showParentModal && selectedWeek && (
          <ParentConfirmationModal
            isOpen={showParentModal}
            onClose={() => {
              setShowParentModal(false);
              setSelectedWeek(null);
            }}
            weekStart={selectedWeek.start}
            weekEnd={selectedWeek.end}
            studentId={user.id}
            studentName={user.name}
            onConfirm={(password, comment) => {
              const confirmations = JSON.parse(localStorage.getItem('parentConfirmations') || '[]');
              confirmations.push({
                studentId: user.id,
                studentName: user.name,
                weekStart: selectedWeek.start.toISOString(),
                weekEnd: selectedWeek.end.toISOString(),
                confirmedAt: new Date().toISOString(),
                comment: comment
              });
              localStorage.setItem('parentConfirmations', JSON.stringify(confirmations));
              setParentConfirmations(confirmations.filter((c: any) => c.studentId === user.id));
              alert('학부모 확인이 완료되었습니다.');
              setShowParentModal(false);
              setSelectedWeek(null);
            }}
          />
        )}
      </div>
    );
  }

  if (currentView === 'assignments') {
    return (
      <div>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className="btn btn-secondary"
          >
            ← 뒤로
          </button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            📝 과제 관리
          </h2>
        </div>
        
        <div className="grid grid-1" style={{ gap: '1rem' }}>
          {assignments.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                <p style={{ color: '#6b7280' }}>현재 배부된 과제가 없습니다.</p>
              </div>
            </div>
          ) : (
            assignments.map(assignment => {
              const isCompleted = assignment.completedStudents?.includes(user.id);
              const dueDate = new Date(assignment.dueDate);
              const today = new Date();
              const isOverdue = dueDate < today && !isCompleted;
              
              return (
                <div key={assignment.id} className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                          {assignment.title}
                        </h3>
                        <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                          {assignment.description}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                          <span style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem'
                          }}>
                            🏫 {assignment.className}
                          </span>
                          <span style={{
                            background: '#e0e7ff',
                            color: '#4338ca',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem'
                          }}>
                            👨‍🏫 {assignment.teacherName}
                          </span>
                          <span style={{
                            background: isOverdue ? '#fee2e2' : '#fef3c7',
                            color: isOverdue ? '#dc2626' : '#d97706',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem'
                          }}>
                            📅 마감: {dueDate.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            toggleAssignmentComplete(assignment.id, user.id);
                            setAssignments(loadAssignments());
                          }}
                          className={isCompleted ? "btn btn-success" : "btn btn-secondary"}
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          {isCompleted ? '✅ 완료됨' : '⬜ 미완료'}
                        </button>
                        {isCompleted && (
                          <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                            과제 완료!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          안녕하세요, {user.name}님! 🎓
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
          오늘도 열심히 공부해봐요!
        </p>
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
          onClick={() => setCurrentView('dashboard')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: currentView === 'dashboard' ? '#667eea' : 'transparent',
            color: currentView === 'dashboard' ? 'white' : '#6b7280',
            borderRadius: '0.375rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          📊 대시보드
        </button>
        <button
          onClick={() => setCurrentView('calendar')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: currentView === 'calendar' ? '#667eea' : 'transparent',
            color: currentView === 'calendar' ? 'white' : '#6b7280',
            borderRadius: '0.375rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          📅 학습 달력
        </button>
        <button
          onClick={() => setCurrentView('assignments')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: currentView === 'assignments' ? '#667eea' : 'transparent',
            color: currentView === 'assignments' ? 'white' : '#6b7280',
            borderRadius: '0.375rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          📝 과제 관리
        </button>
        <button
          onClick={() => setCurrentView('lectures')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: currentView === 'lectures' ? '#667eea' : 'transparent',
            color: currentView === 'lectures' ? 'white' : '#6b7280',
            borderRadius: '0.375rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          📚 내 강의
        </button>
      </div>

      {/* 학습 현황 카드들 */}
      <div className="grid grid-4" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        <div 
          className="card"
          style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
          onClick={handleLectureView}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
        >
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>수강 중 강의</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
                  {(() => {
                    const lectures = loadLectures();
                    const progress = loadStudentProgress();
                    const completedIds = progress
                      .filter(p => p.studentId === user.id && p.completedBlocks.length === lectures.find(l => l.id === p.lectureId)?.contentBlocks?.length)
                      .map(p => p.lectureId);
                    return lectures.filter(l => l.isPublished && !completedIds.includes(l.id)).length;
                  })()}
                </p>
              </div>
              <div style={{ fontSize: '2rem' }}>📚</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>완료 강의</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
                  {(() => {
                    const lectures = loadLectures();
                    const progress = loadStudentProgress();
                    return progress.filter(p => {
                      if (p.studentId !== user.id) return false;
                      const lecture = lectures.find(l => l.id === p.lectureId);
                      return lecture && p.completedBlocks.length === lecture.contentBlocks.length;
                    }).length;
                  })()}
                </p>
              </div>
              <div style={{ fontSize: '2rem' }}>✅</div>
            </div>
          </div>
        </div>

        <div 
          className="card"
          style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
          onClick={() => setCurrentView('assignments')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
        >
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>미완료 과제</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
                  {assignments.filter(a => !a.completedStudents?.includes(user.id)).length}
                </p>
              </div>
              <div style={{ fontSize: '2rem' }}>📝</div>
            </div>
          </div>
        </div>

        <div 
          className="card"
          style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
          onClick={() => setCurrentView('questions')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
        >
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>내 질문</p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
                  <div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', marginBottom: '0' }}>
                      {(() => {
                        const teacherQuestions = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
                        return teacherQuestions.filter(
                          (q: any) => q.studentId === user.id && q.isAnswered
                        ).length;
                      })()}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#16a34a' }}>답변완료</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706', marginBottom: '0' }}>
                      {(() => {
                        const teacherQuestions = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
                        return teacherQuestions.filter(
                          (q: any) => q.studentId === user.id && !q.isAnswered
                        ).length;
                      })()}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#d97706' }}>답변대기</p>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '2rem' }}>❓</div>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 활동 및 수강 과목 */}
      <div className="grid grid-2" style={{ gap: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">📚 최근 활동</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(() => {
                // 실제 최근 활동 가져오기
                const activities: any[] = [];
                
                // 학습 진도 활동
                const progress = loadStudentProgress();
                const myProgress = progress.filter(p => p.studentId === user.id)
                  .sort((a, b) => new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime())
                  .slice(0, 2);
                
                myProgress.forEach(p => {
                  const lectures = loadLectures();
                  const lecture = lectures.find(l => l.id === p.lectureId);
                  if (lecture) {
                    activities.push({
                      type: 'lecture',
                      title: `${lecture.title} 학습`,
                      date: p.lastActivity || new Date().toISOString(),
                      icon: '📚'
                    });
                  }
                });
                
                // 질문 활동 및 답변 받은 활동
                const questions = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
                const myQuestions = questions.filter((q: any) => q.studentId === user.id)
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 3);
                
                myQuestions.forEach((q: any) => {
                  if (q.isAnswered && q.answer) {
                    // 답변 받은 활동
                    activities.push({
                      type: 'answer',
                      title: `"${q.question.substring(0, 20)}..."에 대한 답변 도착`,
                      date: q.answeredAt || q.createdAt,
                      icon: '✅'
                    });
                  } else {
                    // 질문한 활동
                    activities.push({
                      type: 'question',
                      title: q.question.substring(0, 30) + (q.question.length > 30 ? '...' : ''),
                      date: q.createdAt,
                      icon: '❓'
                    });
                  }
                });
                
                // 과제 활동
                const assignments = loadAssignments();
                const completedAssignments = assignments.filter(a => 
                  a.completedStudents?.includes(user.id)
                ).slice(0, 1);
                
                completedAssignments.forEach(a => {
                  activities.push({
                    type: 'assignment',
                    title: `${a.title} 제출`,
                    date: a.dueDate,
                    icon: '📝'
                  });
                });
                
                // 날짜순 정렬 후 최근 3개만
                const sortedActivities = activities
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 3);
                
                if (sortedActivities.length > 0) {
                  return sortedActivities.map((activity, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '1.5rem' }}>
                        {activity.icon}
                      </div>
                      <div>
                        <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{activity.title}</p>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          {(() => {
                            const date = new Date(activity.date);
                            const now = new Date();
                            const diffMs = now.getTime() - date.getTime();
                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                            
                            if (diffHours < 1) return '방금 전';
                            if (diffHours < 24) return `${diffHours}시간 전`;
                            if (diffDays < 7) return `${diffDays}일 전`;
                            return date.toLocaleDateString();
                          })()}
                        </p>
                      </div>
                    </div>
                  ));
                }
                
                // 기본 데모 데이터
                return (
                  <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '1.5rem' }}>📚</div>
                    <div>
                      <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>중등3 물리 - 힘과 운동</p>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>오늘 완료</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '1.5rem' }}>❓</div>
                    <div>
                      <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>속도와 가속도의 차이점은?</p>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>1시간 전 질문</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#dbeafe', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '1.5rem' }}>📝</div>
                    <div>
                      <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>물리 문제집 1-10번</p>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>2시간 전 제출</p>
                    </div>
                  </div>
                </>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🎯 수강 과목</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {studentClasses.length > 0 ? (
                studentClasses.map((cls: any) => (
                  <div
                    key={cls.id}
                    style={{ 
                      padding: '1rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => handleSubjectClick(cls.name)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontWeight: '600' }}>{cls.name}</h3>
                      <span style={{ fontSize: '1.5rem' }}>
                        {cls.subject === '물리' ? '⚡' : cls.subject === '화학' ? '🧪' : cls.subject === '생물' ? '🧬' : '📚'}
                      </span>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                      담당교사: {cls.teacherNames ? cls.teacherNames.join(', ') : '미배정'}
                    </p>
                    {cls.schedule && (
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                        수업시간: {cls.schedule}
                      </p>
                    )}
                    <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '8px', marginBottom: '0.5rem' }}>
                      <div style={{ 
                        background: '#16a34a', 
                        width: `${Math.floor(Math.random() * 40) + 50}%`, 
                        height: '8px', 
                        borderRadius: '9999px' 
                      }}></div>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#16a34a' }}>
                      진도율: {Math.floor(Math.random() * 40) + 50}%
                    </p>
                  </div>
                ))
              ) : (
                <div 
                style={{ 
                  padding: '1rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleSubjectClick('중등3 물리A반')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <p>수강 중인 과목이 없습니다.</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>관리자에게 문의해주세요.</p>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 완료한 강의 목록 */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <div className="card-title">✅ 완료한 강의</div>
        </div>
        <div className="card-body">
          {(() => {
            const lectures = loadLectures();
            const progress = loadStudentProgress();
            const completedLectures = lectures.filter(l => {
              const p = progress.find((prog: any) => 
                prog.studentId === user.id && prog.lectureId === l.id
              );
              return p && p.completedBlocks && l.contentBlocks && 
                     p.completedBlocks.length === l.contentBlocks.length;
            });

            if (completedLectures.length === 0) {
              return (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  아직 완료한 강의가 없습니다.
                </p>
              );
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {completedLectures.map(lecture => {
                  const p = progress.find((prog: any) => 
                    prog.studentId === user.id && prog.lectureId === lecture.id
                  );
                  return (
                    <div 
                      key={lecture.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        background: '#f0fdf4',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => alert(`${lecture.title} 강의를 다시 보시려면 '내 강의' 메뉴를 이용해주세요.`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{lecture.title}</h4>
                        <span style={{ fontSize: '1.25rem' }}>🏆</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                        {lecture.subject} • {lecture.duration}분
                      </p>
                      {p && p.lastActivity && (
                        <p style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                          완료일: {new Date(p.lastActivity).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 다음 수업 일정 */}
      {studentClasses.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-header">
            <div className="card-title">📅 다음 수업</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {studentClasses.slice(0, 2).map((cls: any, index: number) => {
                const colors = [
                  { bg: '#dbeafe', border: '#bfdbfe', text: '#1e40af' },
                  { bg: '#dcfce7', border: '#bbf7d0', text: '#16a34a' }
                ];
                const color = colors[index % 2];
                const schedules = ['내일 14:00', '목요일 16:00', '금요일 15:00', '수요일 14:30'];
                
                return (
                  <div 
                    key={cls.id}
                    style={{ 
                      flex: 1, 
                      minWidth: '250px', 
                      padding: '1rem', 
                      background: color.bg, 
                      borderRadius: '0.5rem', 
                      border: `1px solid ${color.border}` 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>🕒</span>
                      <span style={{ fontWeight: '600', color: color.text }}>
                        {cls.schedule || schedules[index % 4]}
                      </span>
                    </div>
                    <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{cls.name}</h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>다음 수업 준비</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;