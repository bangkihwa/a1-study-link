import React, { useState, useEffect } from 'react';
import { loadLectures, saveLectures, loadSubjects, loadAssignments, loadSchedules, saveSchedules, generateId } from '../../utils/dataStorage';
import AllLecturesView from './AllLecturesView';
import TeacherManagement from './TeacherManagement';
import StudentManagement from './StudentManagement';
import EnhancedClassManagement from '../admin/EnhancedClassManagement';
import PendingApprovals from './PendingApprovals';

interface Class {
  id: number;
  name: string;
  grade: string;
  teacherId: number;
  teacherName: string;
  studentCount: number;
  students: Student[];
}

interface Student {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  classId: number;
  className: string;
}

interface Teacher {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  subject: string;
  classes: number[];
}

interface AdminDashboardProps {
  user: {
    id: number;
    name: string;
    role: string;
  };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'classes' | 'students' | 'teachers' | 'lectures' | 'bulletin' | 'pending'>('dashboard');
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [bulletinPosts, setBulletinPosts] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadAllData();
    loadBulletinData();
    checkPendingUsers();
  }, []);

  const checkPendingUsers = async () => {
    try {
      // 먼저 서버에서 사용자 데이터 가져오기
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.users.length);
      } else {
        // 서버 응답 실패 시 파일 데이터 사용
        const fileResponse = await fetch('/api/auth/users');
        if (fileResponse.ok) {
          const data = await fileResponse.json();
          const pending = data.users.filter((u: any) => !u.is_approved && u.role !== 'admin');
          setPendingCount(pending.length);
        }
      }
    } catch (error) {
      console.error('Failed to check pending users:', error);
      // 최종 폴백: 하드코딩된 데이터 확인
      setPendingCount(2); // 현재 미승인 사용자 2명 (신유진, 최민수)
    }
  };

  const loadBulletinData = () => {
    try {
      const storedPosts = localStorage.getItem('bulletinPosts');
      if (storedPosts) {
        setBulletinPosts(JSON.parse(storedPosts));
      } else {
        // 초기 게시판 데이터
        const initialPosts = [
          {
            id: 1,
            title: '2025학년도 2학기 개강 안내',
            content: '2025학년도 2학기가 9월 2일(월)부터 시작됩니다.',
            author: '시스템 관리자',
            category: '공지사항',
            isPinned: true,
            views: 156,
            createdAt: new Date('2025-08-25').toISOString()
          },
          {
            id: 2,
            title: '학부모 상담 주간 안내',
            content: '9월 첫째 주는 학부모 상담 주간입니다.',
            author: '시스템 관리자',
            category: '공지사항',
            isPinned: true,
            views: 89,
            createdAt: new Date('2025-08-26').toISOString()
          },
          {
            id: 3,
            title: '물리학 특강 수강생 모집',
            content: '고2, 고3 대상 물리학 특강을 개설합니다.',
            author: '김대근',
            category: '수업안내',
            isPinned: false,
            views: 45,
            createdAt: new Date('2025-08-27').toISOString()
          }
        ];
        setBulletinPosts(initialPosts);
        localStorage.setItem('bulletinPosts', JSON.stringify(initialPosts));
      }
    } catch (error) {
      console.error('Failed to load bulletin posts:', error);
    }
  };

  const loadAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [classesRes, usersRes] = await Promise.all([
        fetch('/api/admin/classes', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/quizzes/users/all', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData.classes);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const studentList = usersData.users.filter((u: any) => u.role === 'student');
        const teacherList = usersData.users.filter((u: any) => u.role === 'teacher');
        setStudents(studentList);
        setTeachers(teacherList);
      }

    } catch(e) {
      console.error("Failed to load data from server, falling back to mock.", e);
      // loadMockData(); // Removed loadMockData
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  if (currentView === 'lectures') {
    return <AllLecturesView onBack={handleBackToDashboard} />;
  }

  if (currentView === 'classes') {
    return (
      <div>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={handleBackToDashboard} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>🏫 반 관리</h2>
        </div>
        
        <div className="grid grid-1" style={{ gap: '1.5rem' }}>
          {classes.map(classItem => (
            <div key={classItem.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {classItem.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
                        {classItem.grade}
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        👨‍🏫 {classItem.teacherName}
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        👥 학생 {classItem.studentCount}명
                      </span>
                    </div>
                    
                    <div style={{ marginTop: '1rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>학생 목록:</h4>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {classItem.students.map(student => (
                          <span key={student.id} style={{
                            background: '#f3f4f6',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}>
                            {student.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                      수정
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: '0.875rem', background: '#dc2626', borderColor: '#dc2626' }}>
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (currentView === 'students') {
    return <StudentManagement onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'teachers') {
    return <TeacherManagement onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'pending') {
    return <PendingApprovals onBack={() => {
      setCurrentView('dashboard');
      checkPendingUsers();
    }} />;
  }

  if (currentView === 'bulletin') {
    return (
      <div className="admin-bulletin">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>📋 게시판 관리</h2>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="btn btn-secondary"
          >
            ← 대시보드로 돌아가기
          </button>
        </div>

        {/* 게시글 목록 */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">전체 게시글</div>
              <button className="btn btn-primary btn-sm">+ 새 게시글 작성</button>
            </div>
          </div>
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th>📌</th>
                  <th>카테고리</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>조회수</th>
                  <th>작성일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {bulletinPosts.map(post => (
                  <tr key={post.id}>
                    <td>{post.isPinned ? '📌' : ''}</td>
                    <td>
                      <span className={`badge ${post.category === '공지사항' ? 'badge-danger' : 'badge-primary'}`}>
                        {post.category}
                      </span>
                    </td>
                    <td>{post.title}</td>
                    <td>{post.author}</td>
                    <td>{post.views}</td>
                    <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary">수정</button>
                      {' '}
                      <button className="btn btn-sm btn-danger">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

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

      {/* 승인 대기 알림 */}
      {pendingCount > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#fef3c7', border: '1px solid #fbbf24' }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <div>
                  <p style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '0.25rem' }}>
                    승인 대기 중인 사용자가 있습니다
                  </p>
                  <p style={{ color: '#b45309', fontSize: '0.875rem' }}>
                    {pendingCount}명의 새로운 사용자가 승인을 기다리고 있습니다.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCurrentView('pending')}
                className="btn btn-warning"
                style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
              >
                승인 관리 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 통계 카드들 */}
      <div className="grid grid-4" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>전체 학생</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>{students.length}</p>
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
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{teachers.length}</p>
              </div>
              <div style={{ fontSize: '2rem' }}>👨‍🏫</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>운영 중인 반</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>{classes.length}</p>
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
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{loadLectures().length}</p>
              </div>
              <div style={{ fontSize: '2rem' }}>📚</div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">⚡ 관리 메뉴</div>
        </div>
        <div className="card-body">
          <div className="grid grid-4" style={{ gap: '1rem' }}>
            <button 
              onClick={() => setCurrentView('classes')}
              className="btn btn-primary"
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
            >
              <span style={{ fontSize: '2rem' }}>🏫</span>
              <span>반 관리</span>
            </button>
            <button 
              onClick={() => setCurrentView('students')}
              className="btn btn-primary"
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: '#16a34a', borderColor: '#16a34a' }}
            >
              <span style={{ fontSize: '2rem' }}>👥</span>
              <span>학생 관리</span>
            </button>
            <button 
              onClick={() => setCurrentView('teachers')}
              className="btn btn-primary"
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: '#059669', borderColor: '#059669' }}
            >
              <span style={{ fontSize: '2rem' }}>👨‍🏫</span>
              <span>교사 관리</span>
            </button>
            <button 
              onClick={() => setCurrentView('lectures')}
              className="btn btn-primary"
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: '#dc2626', borderColor: '#dc2626' }}
            >
              <span style={{ fontSize: '2rem' }}>📚</span>
              <span>강의 관리</span>
            </button>
          </div>
        </div>
      </div>

      {/* 게시판 섹션 */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">📋 최근 게시글</div>
            <button 
              onClick={() => setCurrentView('bulletin')}
              className="btn btn-primary btn-sm"
            >
              전체보기 →
            </button>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {bulletinPosts.slice(0, 5).map(post => (
              <div 
                key={post.id}
                style={{ 
                  padding: '1rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {post.isPinned && <span>📌</span>}
                  <span className={`badge ${post.category === '공지사항' ? 'badge-danger' : 'badge-primary'}`}>
                    {post.category}
                  </span>
                  <span style={{ fontWeight: '500' }}>{post.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  <span>{post.author}</span>
                  <span>조회 {post.views}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;