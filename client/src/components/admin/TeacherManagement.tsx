import React, { useState, useEffect } from 'react';

interface Teacher {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  subject: string;
  classes: string[];
  createdAt: string;
}

interface TeacherManagementProps {
  onBack: () => void;
}

const TeacherManagement: React.FC<TeacherManagementProps> = ({ onBack }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    subject: '',
    password: ''
  });

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = () => {
    const savedTeachers = localStorage.getItem('studylink_all_teachers');
    if (savedTeachers) {
      setTeachers(JSON.parse(savedTeachers));
    } else {
      // 초기 데이터
      const initialTeachers: Teacher[] = [
        {
          id: 1,
          name: '김선생',
          username: 'teacher1',
          email: 'kim@school.com',
          phone: '010-1234-5678',
          subject: '물리',
          classes: ['중등3 물리A반'],
          createdAt: '2024-01-01'
        },
        {
          id: 2,
          name: '이선생',
          username: 'teacher2',
          email: 'lee@school.com',
          phone: '010-2345-6789',
          subject: '화학',
          classes: ['중등2 화학B반'],
          createdAt: '2024-01-02'
        },
        {
          id: 3,
          name: '박선생',
          username: 'teacher3',
          email: 'park@school.com',
          phone: '010-3456-7890',
          subject: '생물',
          classes: ['중등1 통합과학'],
          createdAt: '2024-01-03'
        }
      ];
      setTeachers(initialTeachers);
      localStorage.setItem('studylink_all_teachers', JSON.stringify(initialTeachers));
    }
  };

  const saveTeachers = (updatedTeachers: Teacher[]) => {
    setTeachers(updatedTeachers);
    localStorage.setItem('studylink_all_teachers', JSON.stringify(updatedTeachers));
    
    // studylink_teachers도 업데이트 (EnhancedClassManagement에서 사용)
    const simpleTeachers = updatedTeachers.map(t => ({
      id: t.id,
      name: t.name,
      username: t.username,
      subject: t.subject
    }));
    localStorage.setItem('studylink_teachers', JSON.stringify(simpleTeachers));
    
    window.dispatchEvent(new Event('localStorageChanged'));
  };

  const createTeacher = () => {
    if (!newTeacher.name || !newTeacher.username || !newTeacher.email || !newTeacher.subject || !newTeacher.password) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    // 중복 체크
    if (teachers.some(t => t.username === newTeacher.username)) {
      alert('이미 존재하는 아이디입니다.');
      return;
    }

    const newTeacherData: Teacher = {
      id: teachers.length > 0 ? Math.max(...teachers.map(t => t.id)) + 1 : 1,
      name: newTeacher.name,
      username: newTeacher.username,
      email: newTeacher.email,
      phone: newTeacher.phone,
      subject: newTeacher.subject,
      classes: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    saveTeachers([...teachers, newTeacherData]);
    
    setNewTeacher({
      name: '',
      username: '',
      email: '',
      phone: '',
      subject: '',
      password: ''
    });
    setShowCreateModal(false);
    alert('교사가 추가되었습니다.');
  };

  const updateTeacher = () => {
    if (!editingTeacher) return;

    const updatedTeachers = teachers.map(t => 
      t.id === editingTeacher.id ? editingTeacher : t
    );
    
    saveTeachers(updatedTeachers);
    setEditingTeacher(null);
    setShowEditModal(false);
    setSelectedTeacher(editingTeacher);
    alert('교사 정보가 수정되었습니다.');
  };

  const deleteTeacher = (teacherId: number) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    if (teacher.classes.length > 0) {
      alert(`이 교사는 ${teacher.classes.length}개의 반을 담당하고 있습니다. 먼저 다른 교사로 변경해주세요.`);
      return;
    }

    if (confirm(`정말 ${teacher.name} 선생님을 삭제하시겠습니까?`)) {
      const updatedTeachers = teachers.filter(t => t.id !== teacherId);
      saveTeachers(updatedTeachers);
      
      if (selectedTeacher?.id === teacherId) {
        setSelectedTeacher(null);
      }
      
      alert('교사가 삭제되었습니다.');
    }
  };

  const subjects = ['물리', '화학', '생물', '지구과학', '통합과학'];

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>교사 관리</h2>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          + 새 교사 추가
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>전체 교사</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{teachers.length}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>물리</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {teachers.filter(t => t.subject === '물리').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>화학</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {teachers.filter(t => t.subject === '화학').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>생물</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {teachers.filter(t => t.subject === '생물').length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: '2rem' }}>
        {/* 교사 목록 */}
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>교사 목록</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {teachers.map(teacher => (
              <div 
                key={teacher.id}
                className="card"
                style={{ 
                  cursor: 'pointer',
                  border: selectedTeacher?.id === teacher.id ? '2px solid #667eea' : '1px solid #e5e7eb'
                }}
                onClick={() => setSelectedTeacher(teacher)}
              >
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{teacher.name}</h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        @{teacher.username} • {teacher.subject}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        담당 반: {teacher.classes.length}개
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTeacher(teacher);
                          setShowEditModal(true);
                        }}
                        className="btn btn-primary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTeacher(teacher.id);
                        }}
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 선택된 교사 상세 */}
        {selectedTeacher && (
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
              교사 상세 정보
            </h3>
            <div className="card">
              <div className="card-body">
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                    {selectedTeacher.name}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>아이디:</strong> {selectedTeacher.username}</p>
                    <p><strong>이메일:</strong> {selectedTeacher.email}</p>
                    <p><strong>전화번호:</strong> {selectedTeacher.phone || '미등록'}</p>
                    <p><strong>담당 과목:</strong> {selectedTeacher.subject}</p>
                    <p><strong>등록일:</strong> {selectedTeacher.createdAt}</p>
                  </div>
                </div>

                <div>
                  <h5 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>담당 반 목록</h5>
                  {selectedTeacher.classes.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>
                      담당하는 반이 없습니다.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedTeacher.classes.map((className, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '0.75rem',
                            background: '#f9fafb',
                            borderRadius: '0.375rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{ fontWeight: '500' }}>{className}</span>
                          <span style={{
                            fontSize: '0.875rem',
                            padding: '0.25rem 0.75rem',
                            background: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '9999px'
                          }}>
                            {selectedTeacher.subject}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 교사 추가 모달 */}
      {showCreateModal && (
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
          <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
            <div className="card-header">
              <div className="card-title">새 교사 추가</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="이름"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <input
                  type="text"
                  placeholder="아이디"
                  value={newTeacher.username}
                  onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <input
                  type="email"
                  placeholder="이메일"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <input
                  type="tel"
                  placeholder="전화번호 (선택)"
                  value={newTeacher.phone}
                  onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <select
                  value={newTeacher.subject}
                  onChange={(e) => setNewTeacher({ ...newTeacher, subject: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                >
                  <option value="">담당 과목 선택</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={createTeacher} className="btn btn-primary">추가</button>
                <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 교사 수정 모달 */}
      {showEditModal && editingTeacher && (
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
          <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
            <div className="card-header">
              <div className="card-title">교사 정보 수정</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    이름
                  </label>
                  <input
                    type="text"
                    value={editingTeacher.name}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    이메일
                  </label>
                  <input
                    type="email"
                    value={editingTeacher.email}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={editingTeacher.phone}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    담당 과목
                  </label>
                  <select
                    value={editingTeacher.subject}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, subject: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                  >
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={updateTeacher} className="btn btn-primary">수정 완료</button>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTeacher(null);
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

export default TeacherManagement;