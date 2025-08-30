import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentDashboard from '../components/dashboard/StudentDashboard';
import TeacherDashboard from '../components/dashboard/TeacherDashboard';
import AdminDashboardFixed from '../components/admin/AdminDashboardFixed';
import EnhancedUserManagement from '../components/admin/EnhancedUserManagement';
import EnhancedClassManagement from '../components/admin/EnhancedClassManagement';
import SystemSettings from '../components/admin/SystemSettings';
import AllLecturesView from '../components/admin/AllLecturesView';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [userStats, setUserStats] = useState({
    total_users: 0,
    admin_count: 0,
    teacher_count: 0,
    student_count: 0,
    parent_count: 0,
    approved_count: 0,
    pending_count: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'classes' | 'lectures' | 'settings'>('dashboard');
  const navigate = useNavigate();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentUserStr = localStorage.getItem('currentUser');
    
    console.log('Dashboard useEffect - isLoggedIn:', isLoggedIn, 'currentUser:', !!currentUserStr);
    
    if (!isLoggedIn || !currentUserStr) {
      console.log('No login status or user data, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(currentUserStr);
      console.log('Parsed user data:', userData);
      setUser(userData);
      setIsLoading(false);
      
      // 사용자 역할에 따른 데이터 로드 (API 호출 대신 localStorage 사용)
      if (userData.role === 'admin') {
        // Admin dashboard data from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const classes = JSON.parse(localStorage.getItem('classes') || '[]');
        const lectures = JSON.parse(localStorage.getItem('lectures') || '[]');
        
        setUserStats({
          total_users: users.length,
          admin_count: users.filter((u: any) => u.role === 'admin').length,
          teacher_count: users.filter((u: any) => u.role === 'teacher').length,
          student_count: users.filter((u: any) => u.role === 'student').length,
          parent_count: users.filter((u: any) => u.role === 'parent').length,
          approved_count: users.filter((u: any) => u.status === 'active').length,
          pending_count: users.filter((u: any) => u.status === 'pending').length
        });
      }
    } catch (error) {
      console.error('User data parse error:', error);
      navigate('/login');
    }
  }, []);

  const loadStudentDashboard = async (token: string) => {
    try {
      const response = await fetch('/api/student/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserStats = async (token: string) => {
    try {
      const response = await fetch('/api/auth/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserStats(data.stats);
      } else {
        console.error('Failed to load user stats');
      }
    } catch (error) {
      console.error('User stats load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'teacher': return '교사';
      case 'student': return '학생';
      case 'parent': return '학부모';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '1.125rem', marginBottom: '1rem' }}>
            사용자 정보를 불러올 수 없습니다.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 학생과 교사는 단순한 대시보드만 표시
  if (user.role === 'student') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        {/* 헤더 */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                A1 과학학원 스터디링크
              </h1>
              <span style={{
                background: '#dbeafe',
                color: '#1e40af',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {getRoleLabel(user.role)}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#6b7280' }}>{user.name}님</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                로그아웃
              </button>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main style={{ padding: '2rem' }}>
          <StudentDashboard 
            user={user} 
            stats={dashboardData?.stats}
            recentActivity={dashboardData?.recentActivity}
          />
        </main>
      </div>
    );
  }

  if (user.role === 'teacher') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        {/* 헤더 */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                A1 과학학원 스터디링크
              </h1>
              <span style={{
                background: '#dcfce7',
                color: '#16a34a',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {getRoleLabel(user.role)}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#6b7280' }}>{user.name}님</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                로그아웃
              </button>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main style={{ padding: '2rem' }}>
          <TeacherDashboard user={user} />
        </main>
      </div>
    );
  }

  // 관리자용 풀 대시보드
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* 헤더 */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
              A1 과학학원 스터디링크
            </h1>
            <span style={{
              background: '#fef3c7',
              color: '#d97706',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {getRoleLabel(user.role)}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#6b7280' }}>{user.name}님</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 네비게이션 */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 2rem'
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <button
            onClick={() => setCurrentView('dashboard')}
            style={{
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              borderBottom: currentView === 'dashboard' ? '2px solid #667eea' : '2px solid transparent',
              color: currentView === 'dashboard' ? '#667eea' : '#6b7280',
              fontWeight: currentView === 'dashboard' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📊 대시보드
          </button>
          <button
            onClick={() => setCurrentView('users')}
            style={{
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              borderBottom: currentView === 'users' ? '2px solid #667eea' : '2px solid transparent',
              color: currentView === 'users' ? '#667eea' : '#6b7280',
              fontWeight: currentView === 'users' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            👥 사용자 관리
          </button>
          <button
            onClick={() => setCurrentView('classes')}
            style={{
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              borderBottom: currentView === 'classes' ? '2px solid #667eea' : '2px solid transparent',
              color: currentView === 'classes' ? '#667eea' : '#6b7280',
              fontWeight: currentView === 'classes' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🏫 반 관리
          </button>
          <button
            onClick={() => setCurrentView('lectures')}
            style={{
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              borderBottom: currentView === 'lectures' ? '2px solid #667eea' : '2px solid transparent',
              color: currentView === 'lectures' ? '#667eea' : '#6b7280',
              fontWeight: currentView === 'lectures' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📚 강의 관리
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            style={{
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              borderBottom: currentView === 'settings' ? '2px solid #667eea' : '2px solid transparent',
              color: currentView === 'settings' ? '#667eea' : '#6b7280',
              fontWeight: currentView === 'settings' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ⚙️ 시스템 설정
          </button>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main style={{ padding: '2rem' }}>
        {currentView === 'dashboard' && <AdminDashboardFixed user={user} />}

        {currentView === 'users' && (
          <EnhancedUserManagement onBack={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'classes' && (
          <EnhancedClassManagement onBack={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'lectures' && (
          <AllLecturesView onBack={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'settings' && (
          <SystemSettings onBack={() => setCurrentView('dashboard')} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;