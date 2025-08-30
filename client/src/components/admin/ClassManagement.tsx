import React, { useState, useEffect } from 'react';
import SubjectManagement from './SubjectManagement';

interface Class {
  id: number;
  name: string;
  subject: string;
  teacher_name: string;
  teacher_id: number;
  student_count: number;
  created_at: string;
}

interface Teacher {
  id: number;
  name: string;
  username: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
}

interface ClassManagementProps {
  onBack: () => void;
}

const ClassManagement: React.FC<ClassManagementProps> = ({ onBack }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentView, setCurrentView] = useState<'classes' | 'subjects'>('classes');

  useEffect(() => {
    loadClasses();
    loadTeachers();
    loadSubjects();
  }, []);

  const loadClasses = () => {
    const savedClasses = localStorage.getItem('classes');
    if (savedClasses) {
      setClasses(JSON.parse(savedClasses));
    } else {
      const defaultClasses = [
        { id: 1, name: '중등3 물리A반', subject: '물리', teacher_name: '김선생님', teacher_id: 2, student_count: 5, created_at: '2024-01-01' },
        { id: 2, name: '중등2 화학B반', subject: '화학', teacher_name: '이선생님', teacher_id: 6, student_count: 8, created_at: '2024-01-02' },
        { id: 3, name: '중등1 통합과학', subject: '통합과학', teacher_name: '박선생님', teacher_id: 2, student_count: 12, created_at: '2024-01-03' },
      ];
      setClasses(defaultClasses);
      localStorage.setItem('classes', JSON.stringify(defaultClasses));
    }
  };

  const loadTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const teacherList = data.users
          .filter((user: any) => user.role === 'teacher')
          .map((user: any) => ({
            id: user.id,
            name: user.name,
            username: user.username
          }));
        setTeachers(teacherList);
      }
    } catch (error) {
      console.error('Load teachers error:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error('Load subjects error:', error);
    }
  };

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    subject: '',
    teacher_id: ''
  });

  const createClass = () => {
    if (!newClass.name || !newClass.subject || !newClass.teacher_id) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const selectedTeacher = teachers.find(t => t.id === parseInt(newClass.teacher_id));
    if (!selectedTeacher) {
      alert('선택한 교사를 찾을 수 없습니다.');
      return;
    }

    const newClassData: Class = {
      id: classes.length > 0 ? Math.max(...classes.map(c => c.id)) + 1 : 1,
      name: newClass.name,
      subject: newClass.subject,
      teacher_name: selectedTeacher.name,
      teacher_id: selectedTeacher.id,
      student_count: 0,
      created_at: new Date().toISOString()
    };

    const updatedClasses = [...classes, newClassData];
    setClasses(updatedClasses);
    localStorage.setItem('classes', JSON.stringify(updatedClasses));
    
    setNewClass({ name: '', subject: '', teacher_id: '' });
    setShowCreateForm(false);
    alert('반이 생성되었습니다.');
  };

  const deleteClass = (classId: number) => {
    if (confirm('정말 이 반을 삭제하시겠습니까?')) {
      const updatedClasses = classes.filter(c => c.id !== classId);
      setClasses(updatedClasses);
      localStorage.setItem('classes', JSON.stringify(updatedClasses));
      alert('반이 삭제되었습니다.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0 }}>반 및 과목 관리</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {currentView === 'classes' && (
            <button 
              onClick={() => setShowCreateForm(true)} 
              className="btn btn-primary"
            >
              + 새 반 만들기
            </button>
          )}
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <button
            onClick={() => setCurrentView('classes')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'none',
              borderBottom: currentView === 'classes' ? '2px solid #2563eb' : '2px solid transparent',
              color: currentView === 'classes' ? '#2563eb' : '#6b7280',
              fontWeight: currentView === 'classes' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            🏫 반 관리
          </button>
          <button
            onClick={() => setCurrentView('subjects')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'none',
              borderBottom: currentView === 'subjects' ? '2px solid #2563eb' : '2px solid transparent',
              color: currentView === 'subjects' ? '#2563eb' : '#6b7280',
              fontWeight: currentView === 'subjects' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            📚 과목 관리
          </button>
        </div>
      </div>

      {/* 새 반 만들기 폼 */}
      {showCreateForm && currentView === 'classes' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <div className="card-title">새 반 만들기</div>
          </div>
          <div className="card-body">
            <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>반 이름</label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  placeholder="예: 중등3 물리A반"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>과목</label>
                <select
                  value={newClass.subject}
                  onChange={(e) => setNewClass({...newClass, subject: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                >
                  <option value="">과목 선택</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.name}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>담당교사</label>
                <select
                  value={newClass.teacher_id}
                  onChange={(e) => setNewClass({...newClass, teacher_id: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                >
                  <option value="">교사 선택</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} (@{teacher.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={createClass} className="btn btn-primary">생성</button>
              <button onClick={() => setShowCreateForm(false)} className="btn btn-secondary">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 반 목록 */}
      {currentView === 'classes' && (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>반 이름</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>과목</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>담당교사</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>학생수</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>생성일</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{cls.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: '#dbeafe',
                        color: '#2563eb',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem'
                      }}>
                        {cls.subject}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{cls.teacher_name}</td>
                    <td style={{ padding: '1rem' }}>{cls.student_count}명</td>
                    <td style={{ padding: '1rem' }}>{new Date(cls.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => alert('학생 관리 기능은 준비 중입니다.')}
                        >
                          학생관리
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => deleteClass(cls.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {classes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏫</div>
                <p>아직 생성된 반이 없습니다.</p>
                <p>새 반 만들기 버튼을 클릭해서 반을 생성해보세요.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 과목 관리 */}
      {currentView === 'subjects' && (
        <SubjectManagement />
      )}
    </div>
  );
};

export default ClassManagement;