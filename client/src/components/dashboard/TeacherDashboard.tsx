import React, { useState, useEffect } from 'react';
import MyClassManagement from '../teacher/MyClassManagement';
import LectureManagement from '../teacher/LectureManagement';
import EnhancedStudentFeedbackView from '../teacher/EnhancedStudentFeedbackView';
import StudentReportGenerator from '../teacher/StudentReportGenerator';
import { loadStudentFeedbacks } from '../../utils/dataStorage';

interface TeacherDashboardProps {
  user: {
    id: number;
    name: string;
    role: string;
  };
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'classes' | 'lectures' | 'feedback' | 'reports'>('dashboard');
  const [pendingQuestions, setPendingQuestions] = useState(0);

  const loadPendingQuestions = () => {
    // teacherQuestions에서 직접 질문 가져오기
    const teacherQuestions = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
    const myQuestions = teacherQuestions.filter(
      (q: any) => q.teacherId === user.id && !q.isAnswered
    );
    setPendingQuestions(myQuestions.length);
  };

  useEffect(() => {
    loadPendingQuestions();
    
    // localStorage 변경 감지
    const handleStorageChange = () => {
      loadPendingQuestions();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChanged', handleStorageChange);
    
    // 1초마다 체크 (같은 탭에서의 변경사항 감지)
    const interval = setInterval(loadPendingQuestions, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChanged', handleStorageChange);
      clearInterval(interval);
    };
  }, [user.id]);

  const handleBackToDashboard = () => {
    console.log('Teacher dashboard - going back to dashboard, current view:', currentView);
    setCurrentView('dashboard');
    console.log('Teacher dashboard - view set to dashboard');
  };

  if (currentView === 'classes') {
    return (
      <MyClassManagement 
        onBack={handleBackToDashboard}
        teacherId={user.id}
      />
    );
  }

  if (currentView === 'lectures') {
    return (
      <LectureManagement 
        onBack={handleBackToDashboard}
        teacherId={user.id}
      />
    );
  }

  if (currentView === 'feedback') {
    return (
      <EnhancedStudentFeedbackView 
        onBack={handleBackToDashboard}
        teacherId={user.id}
      />
    );
  }

  if (currentView === 'reports') {
    return (
      <StudentReportGenerator
        teacherId={user.id}
        teacherName={user.name}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          안녕하세요, {user.name}님! 👨‍🏫
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
          오늘도 학생들과 함께 과학의 즐거움을 나누세요.
        </p>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-4" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>내 반</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>3</p>
              </div>
              <div style={{ fontSize: '2rem' }}>🏫</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>총 학생</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>25</p>
              </div>
              <div style={{ fontSize: '2rem' }}>👥</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>진행중인 강의</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>8</p>
              </div>
              <div style={{ fontSize: '2rem' }}>📚</div>
            </div>
          </div>
        </div>

        <div 
          className="card"
          style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
          onClick={() => setCurrentView('feedback')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
        >
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>답변 대기 질문</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: pendingQuestions > 0 ? '#dc2626' : '#16a34a' }}>
                  {pendingQuestions}
                </p>
              </div>
              <div style={{ fontSize: '2rem' }}>❓</div>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 활동 및 내 반 관리 */}
      <div className="grid grid-2" style={{ gap: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 최근 활동</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem' }}>📚</div>
                <div>
                  <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>중등3 물리A반 - 뉴턴의 법칙</p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>2시간 전 강의 완료</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem' }}>✅</div>
                <div>
                  <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>중등2 화학B반 과제 채점</p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>5시간 전 완료</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem' }}>❓</div>
                <div>
                  <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>학생 질문 답변</p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>어제 3개 답변 완료</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🏫 내 반 관리</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                <div>
                  <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>중등3 물리A반</p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>학생 8명 • 진도율 75%</p>
                </div>
                <button 
                  onClick={() => setCurrentView('classes')}
                  className="btn btn-primary" 
                  style={{ fontSize: '0.875rem' }}
                >
                  관리
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                <div>
                  <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>중등2 화학B반</p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>학생 12명 • 진도율 60%</p>
                </div>
                <button 
                  onClick={() => setCurrentView('classes')}
                  className="btn btn-primary" 
                  style={{ fontSize: '0.875rem' }}
                >
                  관리
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                <div>
                  <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>중등1 통합과학</p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>학생 5명 • 진도율 85%</p>
                </div>
                <button 
                  onClick={() => setCurrentView('classes')}
                  className="btn btn-primary" 
                  style={{ fontSize: '0.875rem' }}
                >
                  관리
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <div className="card-title">⚡ 빠른 액션</div>
        </div>
        <div className="card-body">
          <div className="grid grid-4" style={{ gap: '1rem' }}>
            <button 
              onClick={() => setCurrentView('classes')}
              className="btn btn-primary"
              style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
            >
              <span style={{ fontSize: '2rem' }}>🏫</span>
              <span>반 관리하기</span>
              <small style={{ opacity: 0.8 }}>학생 관리, 출석체크, 과제내기</small>
            </button>
            <button 
              onClick={() => setCurrentView('lectures')}
              className="btn btn-primary"
              style={{ 
                padding: '1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: '#16a34a',
                borderColor: '#16a34a'
              }}
            >
              <span style={{ fontSize: '2rem' }}>📚</span>
              <span>강의 관리하기</span>
              <small style={{ opacity: 0.8 }}>강의 생성, 반 배정, 자료 업로드</small>
            </button>
            <button 
              onClick={() => setCurrentView('feedback')}
              className="btn btn-primary"
              style={{ 
                padding: '1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: '#059669',
                borderColor: '#059669'
              }}
            >
              <span style={{ fontSize: '2rem' }}>💬</span>
              <span>학생 피드백</span>
              <small style={{ opacity: 0.8 }}>질문답변, 학습현황, 진도관리</small>
            </button>
            <button 
              onClick={() => setCurrentView('reports')}
              className="btn btn-primary"
              style={{ 
                padding: '1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: '#7c3aed',
                borderColor: '#7c3aed'
              }}
            >
              <span style={{ fontSize: '2rem' }}>📊</span>
              <span>성적표 생성</span>
              <small style={{ opacity: 0.8 }}>학생별 학습 보고서 생성</small>
            </button>
            <button 
              className="btn btn-secondary"
              style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => alert('성적 관리 기능은 준비 중입니다.')}
            >
              <span style={{ fontSize: '2rem' }}>📊</span>
              <span>성적 관리하기</span>
              <small style={{ opacity: 0.8 }}>시험 점수, 진도율, 리포트</small>
            </button>
          </div>
        </div>
      </div>

      {/* 오늘의 일정 */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <div className="card-title">📅 오늘의 일정</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px', padding: '1rem', background: '#dbeafe', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🕒</span>
                <span style={{ fontWeight: '600', color: '#1e40af' }}>14:00 - 15:30</span>
              </div>
              <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>중등3 물리A반</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>운동량과 충격 단원</p>
            </div>

            <div style={{ flex: 1, minWidth: '250px', padding: '1rem', background: '#dcfce7', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🕕</span>
                <span style={{ fontWeight: '600', color: '#16a34a' }}>16:00 - 17:30</span>
              </div>
              <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>중등2 화학B반</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>산과 염기의 성질</p>
            </div>

            <div style={{ flex: 1, minWidth: '250px', padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🕗</span>
                <span style={{ fontWeight: '600', color: '#d97706' }}>18:00 - 19:30</span>
              </div>
              <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>중등1 통합과학</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>물질의 구성 입자</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;