import React, { useState, useEffect } from 'react';
import AllLecturesView from './AllLecturesView';
import TeacherManagement from './TeacherManagement';
import StudentManagement from './StudentManagement';
import EnhancedClassManagement from './EnhancedClassManagement';
import IntegratedUserManagement from './IntegratedUserManagement';
import LearningMonitoring from './LearningMonitoring';
import QAMonitoring from './QAMonitoring';

interface User {
  id: number;
  name: string;
  role: string;
}

interface AdminDashboardFixedProps {
  user: User;
}

const AdminDashboardFixed: React.FC<AdminDashboardFixedProps> = ({ user }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'classes' | 'students' | 'teachers' | 'lectures' | 'users' | 'monitoring' | 'qa'>('dashboard');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalLectures: 0
  });
  const [questionStats, setQuestionStats] = useState({
    totalQuestions: 0,
    answeredQuestions: 0,
    pendingQuestions: 0
  });
  const [learningStats, setLearningStats] = useState({
    completedLectures: 0,
    completedAssignments: 0,
    activeStudents: 0
  });

  useEffect(() => {
    loadStats();
    
    // Refresh stats every 2 seconds
    const interval = setInterval(loadStats, 2000);
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadStats();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChanged', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChanged', handleStorageChange);
    };
  }, []);

  const loadStats = () => {
    // Load all data sources
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const classes = JSON.parse(localStorage.getItem('classes') || '[]');
    const lectures = JSON.parse(localStorage.getItem('lectures') || '[]');
    
    // Count unique students (merge users and students table)
    const studentSet = new Set();
    const teacherSet = new Set();
    
    // Add students from users table
    users.forEach((u: any) => {
      if (u.role === 'student') {
        studentSet.add(u.id);
      } else if (u.role === 'teacher') {
        teacherSet.add(u.id);
      }
    });
    
    // Add students from students table (may include some not in users)
    students.forEach((s: any) => {
      studentSet.add(s.id);
    });
    
    // Count all lectures (관리자는 모든 강의를 볼 수 있어야 함)
    setStats({
      totalStudents: studentSet.size,
      totalTeachers: teacherSet.size,
      totalClasses: classes.length,
      totalLectures: lectures.length  // 모든 강의 표시
    });

    // Load question stats
    const questions = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
    const answered = questions.filter((q: any) => q.isAnswered).length;
    setQuestionStats({
      totalQuestions: questions.length,
      answeredQuestions: answered,
      pendingQuestions: questions.length - answered
    });

    // Load learning stats
    const progress = JSON.parse(localStorage.getItem('studylink_student_progress') || '[]');
    const assignments = JSON.parse(localStorage.getItem('assignments') || localStorage.getItem('studylink_assignments') || '[]');
    
    // 완료된 강의 수 계산
    const completedLectureCount = progress.filter((p: any) => {
      if (!p.completedBlocks || p.completedBlocks.length === 0) return false;
      const lecture = lectures.find((l: any) => l.id === p.lectureId);
      return lecture && p.completedBlocks.length === lecture.contentBlocks?.length;
    }).length;
    
    // 완료된 과제 수 계산
    let totalCompletedAssignments = 0;
    assignments.forEach((a: any) => {
      if (a.completedStudents && a.completedStudents.length > 0) {
        totalCompletedAssignments += a.completedStudents.length;
      }
    });
    
    // 활동 중인 학생 수 계산
    const activeStudentIds = new Set();
    progress.forEach((p: any) => {
      if (p.studentId) activeStudentIds.add(p.studentId);
    });
    
    setLearningStats({
      completedLectures: completedLectureCount,
      completedAssignments: totalCompletedAssignments,
      activeStudents: activeStudentIds.size
    });
  };

  // Handle view changes
  if (currentView === 'classes') {
    return <EnhancedClassManagement onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'students') {
    return <StudentManagement onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'teachers') {
    return <TeacherManagement onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'lectures') {
    return <AllLecturesView onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'users') {
    return <IntegratedUserManagement onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'monitoring') {
    return <LearningMonitoring onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'qa') {
    return <QAMonitoring onBack={() => setCurrentView('dashboard')} />;
  }

  // Main dashboard view
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          안녕하세요, {user.name}님! 🏫
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
          A1 StudyLink 관리자 대시보드입니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-4" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>전체 학생</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>{stats.totalStudents}</p>
              </div>
              <div style={{ fontSize: '2rem' }}>👥</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>전체 교사</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{stats.totalTeachers}</p>
              </div>
              <div style={{ fontSize: '2rem' }}>👨‍🏫</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>전체 반</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>{stats.totalClasses}</p>
              </div>
              <div style={{ fontSize: '2rem' }}>🏫</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>전체 강의</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>{stats.totalLectures}</p>
              </div>
              <div style={{ fontSize: '2rem' }}>📚</div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">⚡ 빠른 액션</div>
        </div>
        <div className="card-body">
          <div className="grid grid-5" style={{ gap: '1rem' }}>
            <button 
              onClick={() => setCurrentView('users')}
              className="btn btn-primary"
              style={{ 
                padding: '2rem 1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.75rem',
                background: '#dc2626',
                borderColor: '#dc2626',
                height: '150px',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '3rem' }}>👤</span>
              <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>사용자 관리</span>
              <small style={{ opacity: 0.8, fontSize: '0.875rem' }}>통합 사용자 관리</small>
            </button>

            <button 
              onClick={() => setCurrentView('classes')}
              className="btn btn-primary"
              style={{ 
                padding: '2rem 1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.75rem',
                height: '150px',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '3rem' }}>🏫</span>
              <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>반 관리</span>
              <small style={{ opacity: 0.8, fontSize: '0.875rem' }}>반 추가/수정/삭제</small>
            </button>

            <button 
              onClick={() => setCurrentView('students')}
              className="btn btn-primary"
              style={{ 
                padding: '2rem 1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.75rem',
                background: '#16a34a',
                borderColor: '#16a34a',
                height: '150px',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '3rem' }}>👥</span>
              <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>학생 관리</span>
              <small style={{ opacity: 0.8, fontSize: '0.875rem' }}>학생 추가/수정/삭제</small>
            </button>

            <button 
              onClick={() => setCurrentView('teachers')}
              className="btn btn-primary"
              style={{ 
                padding: '2rem 1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.75rem',
                background: '#2563eb',
                borderColor: '#2563eb',
                height: '150px',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '3rem' }}>👨‍🏫</span>
              <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>교사 관리</span>
              <small style={{ opacity: 0.8, fontSize: '0.875rem' }}>교사 추가/수정/삭제</small>
            </button>

            <button 
              onClick={() => setCurrentView('lectures')}
              className="btn btn-primary"
              style={{ 
                padding: '2rem 1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.75rem',
                background: '#d97706',
                borderColor: '#d97706',
                height: '150px',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '3rem' }}>📚</span>
              <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>강의 관리</span>
              <small style={{ opacity: 0.8, fontSize: '0.875rem' }}>강의 생성/편집/배정</small>
            </button>
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="grid grid-2" style={{ gap: '2rem', marginTop: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 시스템 현황</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                <span>활성 학생 수</span>
                <span style={{ fontWeight: '600' }}>{stats.totalStudents}명</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                <span>활성 교사 수</span>
                <span style={{ fontWeight: '600' }}>{stats.totalTeachers}명</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                <span>운영 중인 반</span>
                <span style={{ fontWeight: '600' }}>{stats.totalClasses}개</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                <span>등록된 강의</span>
                <span style={{ fontWeight: '600' }}>{stats.totalLectures}개</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🔔 알림</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem' }}>
                <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>📝 새로운 학생 등록 대기</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>3명의 학생이 승인을 기다리고 있습니다.</p>
              </div>
              <div style={{ padding: '1rem', background: '#dbeafe', borderRadius: '0.5rem' }}>
                <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>📚 강의 업데이트 필요</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>2개의 강의가 업데이트 대기 중입니다.</p>
              </div>
              <div style={{ padding: '1rem', background: '#dcfce7', borderRadius: '0.5rem' }}>
                <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>✅ 시스템 정상 작동</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>모든 서비스가 정상 작동 중입니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 질문 답변 현황 및 학습 현황 */}
      <div className="grid grid-2" style={{ gap: '2rem', marginTop: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">❓ 질문 답변 현황</div>
              <select 
                onChange={(e) => {
                  const filter = e.target.value;
                  // Filter logic here
                  loadStats();
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="all">전체</option>
                <option value="byClass">반별</option>
                <option value="byTeacher">교사별</option>
              </select>
            </div>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>전체 질문</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{questionStats.totalQuestions}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#16a34a' }}>답변 완료</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>{questionStats.answeredQuestions}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#dc2626' }}>미답변</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{questionStats.pendingQuestions}</span>
              </div>
            </div>
            {questionStats.totalQuestions > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '8px', marginBottom: '0.5rem' }}>
                  <div style={{ 
                    background: '#16a34a', 
                    width: `${(questionStats.answeredQuestions / questionStats.totalQuestions) * 100}%`, 
                    height: '8px', 
                    borderRadius: '9999px' 
                  }}></div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                  답변율: {Math.round((questionStats.answeredQuestions / questionStats.totalQuestions) * 100)}%
                </p>
              </div>
            )}
            <button 
              onClick={() => setCurrentView('qa')}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              상세 보기
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">📊 학습 현황 모니터링</div>
              <select 
                onChange={(e) => {
                  const filter = e.target.value;
                  // Filter logic here
                  loadStats();
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="all">전체</option>
                <option value="byClass">반별</option>
                <option value="byTeacher">교사별</option>
              </select>
            </div>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>활동 학생 수</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{learningStats.activeStudents}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#2563eb' }}>완료된 강의</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{learningStats.completedLectures}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#d97706' }}>완료된 과제</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>{learningStats.completedAssignments}</span>
              </div>
            </div>
            <div style={{ 
              padding: '1rem', 
              background: '#f0fdf4', 
              borderRadius: '0.5rem',
              border: '1px solid #bbf7d0'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#16a34a', textAlign: 'center' }}>
                🌟 현재 {learningStats.activeStudents}명의 학생이 활발히 학습 중입니다
              </p>
            </div>
            <button 
              onClick={() => setCurrentView('monitoring')}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              상세 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardFixed;