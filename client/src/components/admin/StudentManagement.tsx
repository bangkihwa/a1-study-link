import React, { useState, useEffect } from 'react';

interface Student {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  classIds: number[];
  classNames: string[];
  createdAt: string;
  status: 'active' | 'inactive';
}

interface Class {
  id: number;
  name: string;
}

interface StudentManagementProps {
  onBack: () => void;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [filterClass, setFilterClass] = useState<string>('all');
  
  const [newStudent, setNewStudent] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    classIds: [] as number[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load students
    const savedStudents = localStorage.getItem('studylink_all_students');
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    } else {
      const initialStudents: Student[] = [
        {
          id: 1,
          name: '김민수',
          username: 'student1',
          email: 'kim@student.com',
          phone: '010-1111-1111',
          classId: 1,
          className: '중등3 물리A반',
          createdAt: '2024-01-01',
          status: 'active'
        },
        {
          id: 2,
          name: '이영희',
          username: 'student2',
          email: 'lee@student.com',
          phone: '010-2222-2222',
          classId: 1,
          className: '중등3 물리A반',
          createdAt: '2024-01-02',
          status: 'active'
        },
        {
          id: 3,
          name: '박철수',
          username: 'student3',
          email: 'park@student.com',
          phone: '010-3333-3333',
          classId: 2,
          className: '중등2 화학B반',
          createdAt: '2024-01-03',
          status: 'active'
        }
      ];
      setStudents(initialStudents);
      localStorage.setItem('studylink_all_students', JSON.stringify(initialStudents));
    }

    // Load classes
    const savedClasses = localStorage.getItem('studylink_classes');
    if (savedClasses) {
      const parsedClasses = JSON.parse(savedClasses);
      setClasses(parsedClasses.map((c: any) => ({ id: c.id, name: c.name })));
    }
  };

  const saveStudents = (updatedStudents: Student[]) => {
    setStudents(updatedStudents);
    localStorage.setItem('studylink_all_students', JSON.stringify(updatedStudents));
    
    // Also update studylink_students for other components
    localStorage.setItem('studylink_students', JSON.stringify(updatedStudents));
    
    window.dispatchEvent(new Event('localStorageChanged'));
  };

  const createStudent = () => {
    if (!newStudent.name || !newStudent.username || !newStudent.password || newStudent.classIds.length === 0) {
      alert('필수 필드를 모두 입력하고 최소 1개의 반을 선택해주세요.');
      return;
    }

    // Check for duplicate username
    if (students.some(s => s.username === newStudent.username)) {
      alert('이미 존재하는 아이디입니다.');
      return;
    }

    const selectedClasses = classes.filter(c => newStudent.classIds.includes(c.id));
    
    const newStudentData: Student = {
      id: students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1,
      name: newStudent.name,
      username: newStudent.username,
      email: newStudent.email,
      phone: newStudent.phone,
      classIds: newStudent.classIds,
      classNames: selectedClasses.map(c => c.name),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    saveStudents([...students, newStudentData]);
    
    setNewStudent({
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      classIds: []
    });
    setShowCreateModal(false);
    alert('학생이 추가되었습니다.');
  };

  const updateStudent = () => {
    if (!editingStudent) return;

    const selectedClasses = classes.filter(c => editingStudent.classIds?.includes(c.id));
    
    const updatedStudent = {
      ...editingStudent,
      classNames: selectedClasses.map(c => c.name)
    };

    const updatedStudents = students.map(s => 
      s.id === editingStudent.id ? updatedStudent : s
    );
    
    saveStudents(updatedStudents);
    
    // Update classes to include/remove student
    const updatedClasses = classes.map(cls => {
      const studentData = {
        id: editingStudent.id,
        name: editingStudent.name,
        username: editingStudent.username,
        classId: cls.id,
        className: cls.name
      };
      
      if (editingStudent.classIds?.includes(cls.id)) {
        // Add student if not already there
        if (!cls.students?.some(s => s.id === editingStudent.id)) {
          return { ...cls, students: [...(cls.students || []), studentData] };
        }
      } else {
        // Remove student if deselected
        return { ...cls, students: cls.students?.filter(s => s.id !== editingStudent.id) || [] };
      }
      return cls;
    });
    
    localStorage.setItem('classes', JSON.stringify(updatedClasses));
    
    setEditingStudent(null);
    setShowEditModal(false);
    setSelectedStudent(updatedStudent);
    alert('학생 정보가 수정되었습니다.');
  };

  const deleteStudent = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (confirm(`정말 ${student.name} 학생을 삭제하시겠습니까?`)) {
      const updatedStudents = students.filter(s => s.id !== studentId);
      saveStudents(updatedStudents);
      
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(null);
      }
      
      alert('학생이 삭제되었습니다.');
    }
  };

  const toggleStudentStatus = (studentId: number) => {
    const updatedStudents = students.map(s => 
      s.id === studentId 
        ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive' }
        : s
    );
    saveStudents(updatedStudents);
  };

  const filteredStudents = filterClass === 'all' 
    ? students 
    : students.filter(s => s.classIds?.includes(parseInt(filterClass)) || s.classId === parseInt(filterClass));

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>학생 관리</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem'
            }}
          >
            <option value="all">전체 반</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + 새 학생 추가
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>전체 학생</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{students.length}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>활성 학생</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
              {students.filter(s => s.status === 'active').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>비활성 학생</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
              {students.filter(s => s.status === 'inactive').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>등록된 반</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
              {classes.length}
            </p>
          </div>
        </div>
      </div>

      {/* 학생 목록 테이블 */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left' }}>이름</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>아이디</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>이메일</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>전화번호</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>반</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>상태</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>등록일</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontWeight: '500' }}>{student.name}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>{student.username}</td>
                  <td style={{ padding: '1rem' }}>{student.email || '-'}</td>
                  <td style={{ padding: '1rem' }}>{student.phone || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {student.classNames?.length > 0 ? (
                        student.classNames.map((className, idx) => (
                          <span key={idx} style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem'
                          }}>
                            {className}
                          </span>
                        ))
                      ) : student.className ? (
                        <span style={{
                          background: '#dbeafe',
                          color: '#1e40af',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem'
                        }}>
                          {student.className}
                        </span>
                      ) : (
                        <span style={{
                          background: '#f3f4f6',
                          color: '#6b7280',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem'
                        }}>
                          미배정
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => toggleStudentStatus(student.id)}
                      style={{
                        background: student.status === 'active' ? '#dcfce7' : '#fee2e2',
                        color: student.status === 'active' ? '#16a34a' : '#dc2626',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {student.status === 'active' ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td style={{ padding: '1rem' }}>{student.createdAt}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        보기
                      </button>
                      <button
                        onClick={() => {
                          setEditingStudent(student);
                          setShowEditModal(true);
                        }}
                        className="btn btn-primary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredStudents.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              등록된 학생이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 학생 추가 모달 */}
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
              <div className="card-title">새 학생 추가</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="이름 *"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <input
                  type="text"
                  placeholder="아이디 *"
                  value={newStudent.username}
                  onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <input
                  type="password"
                  placeholder="비밀번호 *"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <input
                  type="email"
                  placeholder="이메일 (선택)"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <input
                  type="tel"
                  placeholder="전화번호 (선택)"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    반 선택 * (여러 개 선택 가능)
                  </label>
                  <div style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem', 
                    padding: '0.5rem',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {classes.map(cls => (
                      <label key={cls.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          value={cls.id}
                          checked={newStudent.classIds.includes(cls.id)}
                          onChange={(e) => {
                            const classId = parseInt(e.target.value);
                            if (e.target.checked) {
                              setNewStudent({ ...newStudent, classIds: [...newStudent.classIds, classId] });
                            } else {
                              setNewStudent({ ...newStudent, classIds: newStudent.classIds.filter(id => id !== classId) });
                            }
                          }}
                          style={{ marginRight: '0.5rem' }}
                        />
                        {cls.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={createStudent} className="btn btn-primary">추가</button>
                <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 학생 수정 모달 */}
      {showEditModal && editingStudent && (
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
              <div className="card-title">학생 정보 수정</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    이름
                  </label>
                  <input
                    type="text"
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    이메일
                  </label>
                  <input
                    type="email"
                    value={editingStudent.email}
                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={editingStudent.phone}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    반 배정 (여러 개 선택 가능)
                  </label>
                  <div style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem', 
                    padding: '0.5rem',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    {classes.map(cls => (
                      <label key={cls.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editingStudent.classIds?.includes(cls.id) || false}
                          onChange={(e) => {
                            const currentIds = editingStudent.classIds || [];
                            if (e.target.checked) {
                              setEditingStudent({ ...editingStudent, classIds: [...currentIds, cls.id] });
                            } else {
                              setEditingStudent({ ...editingStudent, classIds: currentIds.filter(id => id !== cls.id) });
                            }
                          }}
                          style={{ marginRight: '0.5rem' }}
                        />
                        {cls.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={updateStudent} className="btn btn-primary">수정 완료</button>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStudent(null);
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

      {/* 학생 상세 모달 */}
      {selectedStudent && (
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
        }}
        onClick={() => setSelectedStudent(null)}>
          <div 
            className="card" 
            style={{ width: '500px', maxWidth: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <div className="card-title">학생 상세 정보</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {selectedStudent.name}
                </h3>
                <p><strong>아이디:</strong> {selectedStudent.username}</p>
                <p><strong>이메일:</strong> {selectedStudent.email || '미등록'}</p>
                <p><strong>전화번호:</strong> {selectedStudent.phone || '미등록'}</p>
                <p><strong>소속 반:</strong> {selectedStudent.className || '미배정'}</p>
                <p><strong>상태:</strong> 
                  <span style={{
                    marginLeft: '0.5rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    background: selectedStudent.status === 'active' ? '#dcfce7' : '#fee2e2',
                    color: selectedStudent.status === 'active' ? '#16a34a' : '#dc2626'
                  }}>
                    {selectedStudent.status === 'active' ? '활성' : '비활성'}
                  </span>
                </p>
                <p><strong>등록일:</strong> {selectedStudent.createdAt}</p>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setEditingStudent(selectedStudent);
                    setShowEditModal(true);
                    setSelectedStudent(null);
                  }}
                  className="btn btn-primary"
                >
                  수정
                </button>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="btn btn-secondary"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;