import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Class {
  id: number;
  name: string;
  grade: string;
  subject: string;
  teacherIds: number[];
  teacherNames: string[];
  students: Student[];
  maxStudents: number;
  schedule?: string;
  createdAt: string;
}

interface Student {
  id: number;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  classId: number;
  className?: string;
}

interface Teacher {
  id: number;
  name: string;
  username: string;
  subject: string;
}

interface EnhancedClassManagementProps {
  onBack: () => void;
}

const EnhancedClassManagement: React.FC<EnhancedClassManagementProps> = ({ onBack }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [newClass, setNewClass] = useState({
    name: '',
    grade: '',
    subject: '',
    teacherIds: [] as string[],
    maxStudents: 20,
    schedule: ''
  });

  const [newStudent, setNewStudent] = useState<{
    name: string;
    username: string;
    email: string;
    phone: string;
    isNewStudent?: boolean;
    selectedStudentId?: number | null;
  }>({
    name: '',
    username: '',
    email: '',
    phone: '',
    isNewStudent: true,
    selectedStudentId: null
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll for changes
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [classesRes, teachersRes, studentsRes] = await Promise.all([
        axios.get('/api/admin/classes', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/quizzes/users/all', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const allClasses = classesRes.data.classes || [];
      const allUsers = teachersRes.data.users || [];
      
      const teacherList = allUsers.filter((u: any) => u.role === 'teacher');
      const studentList = allUsers.filter((u: any) => u.role === 'student');

      // Populate students in each class
      const populatedClasses = allClasses.map((cls: Class) => {
        const studentDetails = (cls.studentIds || []).map(studentId => {
          return studentList.find((s: Student) => s.id === studentId);
        }).filter(Boolean); // Filter out undefined students
        return { ...cls, students: studentDetails };
      });
      
      setClasses(populatedClasses);
      setTeachers(teacherList);
      setAllStudents(studentList);
      
      // If a class is selected, update its details
      if(selectedClass) {
        const updatedSelectedClass = populatedClasses.find((c: Class) => c.id === selectedClass.id);
        if(updatedSelectedClass) {
          setSelectedClass(updatedSelectedClass);
        }
      }

    } catch (error) {
      console.error("Failed to load class management data:", error);
    }
  };

  const saveClasses = (updatedClasses: Class[]) => {
    setClasses(updatedClasses);
    localStorage.setItem('studylink_classes', JSON.stringify(updatedClasses));
    window.dispatchEvent(new Event('localStorageChanged'));
  };

  const saveStudents = (updatedStudents: Student[]) => {
    setAllStudents(updatedStudents);
    localStorage.setItem('studylink_students', JSON.stringify(updatedStudents));
    window.dispatchEvent(new Event('localStorageChanged'));
  };

  const createClass = async () => {
    if (!newClass.name || !newClass.grade || !newClass.subject || newClass.teacherIds.length === 0) {
      alert('모든 필드를 입력하고 최소 1명의 교사를 선택해주세요.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/classes', {
        ...newClass,
        teacher_ids: newClass.teacherIds.map(id => parseInt(id))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 201) {
        alert('반이 생성되었습니다.');
        setShowCreateForm(false);
        setNewClass({ name: '', grade: '', subject: '', teacherIds: [], maxStudents: 20, schedule: '' });
        loadData();
      } else {
        alert('반 생성에 실패했습니다.');
      }
    } catch(e) {
      console.error("Failed to create class:", e);
      alert('반 생성 중 오류가 발생했습니다.');
    }
  };

  const updateClass = async () => {
    if (!editingClass) return;

    try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`/api/admin/classes/${editingClass.id}`, {
            ...editingClass,
            teacher_ids: editingClass.teacherIds.map(id => parseInt(String(id)))
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
            alert('반 정보가 수정되었습니다.');
            setShowEditModal(false);
            setEditingClass(null);
            loadData();
        } else {
            alert('반 정보 수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error updating class:', error);
        alert('반 정보 수정 중 오류가 발생했습니다.');
    }
  };

  const deleteClass = async (classId: number) => {
    if (confirm('정말 이 반을 삭제하시겠습니까? 소속 학생들은 반 배정이 해제됩니다.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`/api/admin/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
          alert('반이 삭제되었습니다.');
          if (selectedClass?.id === classId) {
            setSelectedClass(null);
          }
          loadData();
        } else {
          alert('반 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('반 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const addStudentToClass = async () => {
    if (!selectedClass) return;

    let studentIdToAdd: number | null = null;

    if (newStudent.isNewStudent) {
        // Create new student first
        if (!newStudent.name || !newStudent.username) {
            alert('새 학생의 이름과 아이디를 입력해주세요.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/admin/users', {
                name: newStudent.name,
                username: newStudent.username,
                email: newStudent.email,
                phone: newStudent.phone,
                role: 'student',
                password: 'password123' // default password
            }, { headers: { Authorization: `Bearer ${token}` }});
            
            if (response.status === 201) {
                studentIdToAdd = response.data.user.id;
            } else {
                alert('학생 생성에 실패했습니다.');
                return;
            }
        } catch(e) {
            alert('학생 생성 중 오류가 발생했습니다.');
            return;
        }
    } else {
        studentIdToAdd = newStudent.selectedStudentId;
    }
    
    if (!studentIdToAdd) {
        alert('추가할 학생을 선택해주세요.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`/api/admin/classes/${selectedClass.id}/students`, {
            student_ids: [studentIdToAdd]
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (response.status === 200) {
            alert('학생이 반에 추가되었습니다.');
            setShowAddStudentModal(false);
            setNewStudent({ name: '', username: '', email: '', phone: '', isNewStudent: true, selectedStudentId: null });
            loadData();
        } else {
            alert('학생 추가에 실패했습니다.');
        }

    } catch (e) {
        alert('학생 추가 중 오류가 발생했습니다.');
    }
  };

  const removeStudentFromClass = async (studentId: number) => {
    if (!selectedClass) return;
    
    if (confirm('이 학생을 반에서 제외하시겠습니까?')) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`/api/admin/classes/${selectedClass.id}/students`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { student_ids: [studentId] }
            });

            if(response.status === 200) {
                alert('학생이 반에서 제외되었습니다.');
                loadData();
            } else {
                alert('학생 제외에 실패했습니다.');
            }
        } catch (e) {
            alert('학생 제외 중 오류가 발생했습니다.');
        }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>반 관리</h2>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          + 새 반 만들기
        </button>
      </div>

      {/* 새 반 만들기 폼 */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <div className="card-title">새 반 만들기</div>
          </div>
          <div className="card-body">
            <div className="grid grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="반 이름 (예: 중등3 물리A반)"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
              />
              <select
                value={newClass.grade}
                onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
              >
                <option value="">학년 선택</option>
                <option value="중등1">중등1</option>
                <option value="중등2">중등2</option>
                <option value="중등3">중등3</option>
                <option value="고등1">고등1</option>
                <option value="고등2">고등2</option>
                <option value="고등3">고등3</option>
              </select>
              <select
                value={newClass.subject}
                onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
              >
                <option value="">과목 선택</option>
                <option value="물리">물리</option>
                <option value="화학">화학</option>
                <option value="생물">생물</option>
                <option value="지구과학">지구과학</option>
                <option value="통합과학">통합과학</option>
              </select>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                  담당 교사 선택 (여러 명 선택 가능)
                </label>
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.375rem', 
                  padding: '0.5rem',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {teachers.map(teacher => (
                    <label key={teacher.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        value={teacher.id}
                        checked={newClass.teacherIds.includes(String(teacher.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewClass({ ...newClass, teacherIds: [...newClass.teacherIds, e.target.value] });
                          } else {
                            setNewClass({ ...newClass, teacherIds: newClass.teacherIds.filter(id => id !== e.target.value) });
                          }
                        }}
                        style={{ marginRight: '0.5rem' }}
                      />
                      {teacher.name} ({teacher.subject})
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="수업 시간 (예: 월,수,금 14:00-16:00)"
                value={newClass.schedule}
                onChange={(e) => setNewClass({ ...newClass, schedule: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={createClass} className="btn btn-primary">생성</button>
              <button onClick={() => setShowCreateForm(false)} className="btn btn-secondary">취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-2" style={{ gap: '2rem' }}>
        {/* 반 목록 */}
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>반 목록</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {classes.map(cls => (
              <div 
                key={cls.id}
                className="card"
                style={{ 
                  cursor: 'pointer',
                  border: selectedClass?.id === cls.id ? '2px solid #667eea' : '1px solid #e5e7eb'
                }}
                onClick={() => setSelectedClass(cls)}
              >
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{cls.name}</h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        담당: {cls.teacherNames?.join(', ') || cls.teacherName || '미배정'} • {cls.subject}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        학생: {cls.students.length}명 / {cls.maxStudents}명
                      </p>
                      {cls.schedule && (
                        <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                          🕐 {cls.schedule}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClass(cls);
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
                          deleteClass(cls.id);
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

        {/* 선택된 반 상세 */}
        {selectedClass && (
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
              {selectedClass.name} 상세 정보
            </h3>
            <div className="card">
              <div className="card-body">
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ marginBottom: '0.5rem' }}>
                    <strong>학년:</strong> {selectedClass.grade}
                  </p>
                  <p style={{ marginBottom: '0.5rem' }}>
                    <strong>과목:</strong> {selectedClass.subject}
                  </p>
                  <p style={{ marginBottom: '0.5rem' }}>
                    <strong>담당 교사:</strong> {selectedClass.teacherName}
                  </p>
                  <p>
                    <strong>학생 수:</strong> {selectedClass.students.length} / {selectedClass.maxStudents}명
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontWeight: '600' }}>학생 목록</h4>
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.875rem' }}
                  >
                    + 학생 추가
                  </button>
                </div>

                {selectedClass.students.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                    아직 등록된 학생이 없습니다.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedClass.students.map(student => (
                      <div
                        key={student.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: '#f9fafb',
                          borderRadius: '0.375rem'
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: '500' }}>{student.name}</p>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            @{student.username} • {student.email || '이메일 없음'}
                          </p>
                        </div>
                        <button
                          onClick={() => removeStudentFromClass(student.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          제외
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 학생 추가 모달 */}
      {showAddStudentModal && selectedClass && (
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
          <div className="card" style={{ width: '600px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="card-header">
              <div className="card-title">학생 추가 - {selectedClass.name}</div>
            </div>
            <div className="card-body">
              {/* 탭 선택 */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                <button
                  style={{
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: newStudent.isNewStudent ? '#2563eb' : 'transparent',
                    color: newStudent.isNewStudent ? 'white' : '#6b7280',
                    borderRadius: '0.375rem 0.375rem 0 0',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                  onClick={() => setNewStudent({ ...newStudent, isNewStudent: true })}
                >
                  새 학생 등록
                </button>
                <button
                  style={{
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: !newStudent.isNewStudent ? '#2563eb' : 'transparent',
                    color: !newStudent.isNewStudent ? 'white' : '#6b7280',
                    borderRadius: '0.375rem 0.375rem 0 0',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                  onClick={() => setNewStudent({ ...newStudent, isNewStudent: false })}
                >
                  기존 학생 선택
                </button>
              </div>

              {newStudent.isNewStudent ? (
                /* 새 학생 등록 폼 */
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      placeholder="학생 이름"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                    />
                    <input
                      type="text"
                      placeholder="아이디"
                      value={newStudent.username}
                      onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
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
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={addStudentToClass} className="btn btn-primary">추가</button>
                    <button onClick={() => setShowAddStudentModal(false)} className="btn btn-secondary">취소</button>
                  </div>
                </div>
              ) : (
                /* 기존 학생 선택 */
                <div>
                  <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                    반에 추가할 학생을 선택하세요:
                  </p>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                    {(() => {
                      const allStudents = JSON.parse(localStorage.getItem('students') || localStorage.getItem('studylink_students') || '[]');
                      const classStudentIds = selectedClass.students.map(s => s.id);
                      const availableStudents = allStudents.filter((s: any) => !classStudentIds.includes(s.id));
                      
                      if (availableStudents.length === 0) {
                        return (
                          <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                            추가 가능한 학생이 없습니다.
                          </p>
                        );
                      }
                      
                      return availableStudents.map((student: any) => (
                        <div
                          key={student.id}
                          style={{
                            padding: '1rem',
                            borderBottom: '1px solid #f3f4f6',
                            cursor: 'pointer',
                            background: newStudent.selectedStudentId === student.id ? '#f0f9ff' : 'white',
                            transition: 'background 0.2s'
                          }}
                          onClick={() => setNewStudent({ ...newStudent, selectedStudentId: student.id })}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = newStudent.selectedStudentId === student.id ? '#f0f9ff' : 'white'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                              type="radio"
                              checked={newStudent.selectedStudentId === student.id}
                              onChange={() => setNewStudent({ ...newStudent, selectedStudentId: student.id })}
                              style={{ width: '20px', height: '20px' }}
                            />
                            <div>
                              <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{student.name}</p>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                @{student.username} • {student.email || '이메일 없음'}
                              </p>
                              {student.classNames && student.classNames.length > 0 && (
                                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                  현재 반: {student.classNames.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      onClick={() => {
                        if (!newStudent.selectedStudentId) {
                          alert('학생을 선택해주세요.');
                          return;
                        }
                        
                        const allStudents = JSON.parse(localStorage.getItem('students') || '[]');
                        const selectedStudent = allStudents.find((s: any) => s.id === newStudent.selectedStudentId);
                        
                        if (selectedStudent) {
                          // 학생을 반에 추가
                          const updatedClass = {
                            ...selectedClass,
                            students: [...selectedClass.students, {
                              id: selectedStudent.id,
                              name: selectedStudent.name,
                              username: selectedStudent.username,
                              email: selectedStudent.email,
                              phone: selectedStudent.phone
                            }]
                          };
                          
                          // localStorage 업데이트
                          const allClasses = JSON.parse(localStorage.getItem('classes') || localStorage.getItem('studylink_classes') || '[]');
                          const index = allClasses.findIndex((c: any) => c.id === selectedClass.id);
                          if (index !== -1) {
                            allClasses[index] = updatedClass;
                            localStorage.setItem('classes', JSON.stringify(allClasses));
                            localStorage.setItem('studylink_classes', JSON.stringify(allClasses));
                          }
                          
                          // 학생 데이터에도 반 정보 추가
                          selectedStudent.classIds = selectedStudent.classIds || [];
                          selectedStudent.classNames = selectedStudent.classNames || [];
                          if (!selectedStudent.classIds.includes(selectedClass.id)) {
                            selectedStudent.classIds.push(selectedClass.id);
                            selectedStudent.classNames.push(selectedClass.name);
                          }
                          
                          const studentIndex = allStudents.findIndex((s: any) => s.id === selectedStudent.id);
                          if (studentIndex !== -1) {
                            allStudents[studentIndex] = selectedStudent;
                            localStorage.setItem('students', JSON.stringify(allStudents));
                            localStorage.setItem('studylink_students', JSON.stringify(allStudents));
                          }
                          
                          loadClasses();
                          setShowAddStudentModal(false);
                          setNewStudent({ name: '', username: '', email: '', phone: '', isNewStudent: true, selectedStudentId: null });
                        }
                      }} 
                      className="btn btn-primary"
                    >
                      선택한 학생 추가
                    </button>
                    <button onClick={() => setShowAddStudentModal(false)} className="btn btn-secondary">취소</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 반 수정 모달 */}
      {showEditModal && editingClass && (
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
              <div className="card-title">반 정보 수정</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    반 이름
                  </label>
                  <input
                    type="text"
                    value={editingClass.name}
                    onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    학년
                  </label>
                  <select
                    value={editingClass.grade}
                    onChange={(e) => setEditingClass({ ...editingClass, grade: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                  >
                    <option value="중등1">중등1</option>
                    <option value="중등2">중등2</option>
                    <option value="중등3">중등3</option>
                    <option value="고등1">고등1</option>
                    <option value="고등2">고등2</option>
                    <option value="고등3">고등3</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    과목
                  </label>
                  <select
                    value={editingClass.subject}
                    onChange={(e) => setEditingClass({ ...editingClass, subject: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                  >
                    <option value="물리">물리</option>
                    <option value="화학">화학</option>
                    <option value="생물">생물</option>
                    <option value="지구과학">지구과학</option>
                    <option value="통합과학">통합과학</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    담당 교사 (여러 명 선택 가능)
                  </label>
                  <div style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem', 
                    padding: '0.5rem',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    {teachers.map(teacher => (
                      <label key={teacher.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editingClass.teacherIds?.includes(teacher.id) || false}
                          onChange={(e) => {
                            const currentIds = editingClass.teacherIds || [];
                            if (e.target.checked) {
                              setEditingClass({ ...editingClass, teacherIds: [...currentIds, teacher.id] });
                            } else {
                              setEditingClass({ ...editingClass, teacherIds: currentIds.filter(id => id !== teacher.id) });
                            }
                          }}
                          style={{ marginRight: '0.5rem' }}
                        />
                        {teacher.name} ({teacher.subject})
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    최대 학생 수
                  </label>
                  <input
                    type="number"
                    value={editingClass.maxStudents}
                    onChange={(e) => setEditingClass({ ...editingClass, maxStudents: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    수업 시간
                  </label>
                  <input
                    type="text"
                    placeholder="예: 월,수,금 14:00-16:00"
                    value={editingClass.schedule || ''}
                    onChange={(e) => setEditingClass({ ...editingClass, schedule: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={updateClass} className="btn btn-primary">수정 완료</button>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingClass(null);
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

export default EnhancedClassManagement;