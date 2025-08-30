import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  password?: string;
  is_approved?: boolean;
  status?: 'active' | 'pending' | 'suspended';
  created_at?: string;
  updated_at?: string;
  classIds?: number[];
  classNames?: string[];
}

interface Class {
  id: number;
  name: string;
  grade: string;
  subject: string;
  teacherIds: number[];
  students: any[];
  studentIds?: number[];
}

interface IntegratedUserManagementProps {
  onBack: () => void;
}

const IntegratedUserManagement: React.FC<IntegratedUserManagementProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState<User>({
    id: 0,
    username: '',
    name: '',
    email: '',
    phone: '',
    role: 'student',
    password: '',
    classIds: []
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, selectedRole, searchTerm]);

  const loadData = async () => {
    try {
      let allUsers: User[] = [];
      
      // 토큰 가져오기
      const token = localStorage.getItem('token');
      if (token) {
        // 서버에서 사용자 목록 가져오기
        try {
          const response = await fetch('/api/auth/users', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Fetched users from server:', data);
            allUsers = data.users.map((user: any) => ({
              ...user,
              status: user.is_approved ? 'active' : 'pending'
            }));
          }
        } catch (error) {
          console.error('Failed to fetch from server:', error);
        }
      }
      
      // 서버에서 가져오지 못했으면 localStorage 사용 (fallback)
      if (allUsers.length === 0) {
        const usersData = JSON.parse(localStorage.getItem('users') || '[]');
        allUsers = usersData.map((user: any) => ({
          ...user,
          status: user.status || (user.is_approved === false ? 'pending' : 'active')
        }));
      }
    
    // Load classes
    const classesData = JSON.parse(localStorage.getItem('classes') || '[]');
    setClasses(classesData);
    
    // Map class names to users
    const usersWithClasses = allUsers.map(user => {
      const userClasses: string[] = [];
      const userClassIds: number[] = [];
      
      // Check if user is a student
      if (user.role === 'student') {
        // Check in classes.students array
        classesData.forEach((cls: Class) => {
          const isInClass = cls.students?.some((s: any) => 
            s.id === user.id || 
            s.username === user.username || 
            s.name === user.name
          ) || cls.studentIds?.includes(user.id);
          
          if (isInClass && !userClassIds.includes(cls.id)) {
            userClasses.push(cls.name);
            userClassIds.push(cls.id);
          }
        });
        
        // Also check student's classIds
        const studentRecord = JSON.parse(localStorage.getItem('students') || '[]').find((s: any) => 
          s.id === user.id || s.username === user.username
        );
        if (studentRecord?.classIds) {
          studentRecord.classIds.forEach((classId: number) => {
            const cls = classesData.find((c: Class) => c.id === classId);
            if (cls && !userClassIds.includes(cls.id)) {
              userClasses.push(cls.name);
              userClassIds.push(cls.id);
            }
          });
        }
      }
      // Check if user is a teacher
      else if (user.role === 'teacher') {
        classesData.forEach((cls: Class) => {
          if (cls.teacherIds?.includes(user.id)) {
            userClasses.push(cls.name);
            userClassIds.push(cls.id);
          }
        });
      }
      
      return {
        ...user,
        classIds: userClassIds,
        classNames: userClasses
      };
    });
    
    setUsers(usersWithClasses);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(u => u.role === selectedRole);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.name || !newUser.password) {
      alert('아이디, 이름, 비밀번호는 필수입니다.');
      return;
    }
    
    // Check for duplicate username
    if (users.some(u => u.username === newUser.username)) {
      alert('이미 존재하는 아이디입니다.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 서버 API 호출
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: newUser.username,
          email: newUser.email || `${newUser.username}@example.com`,
          password: newUser.password,
          name: newUser.name,
          phone: newUser.phone || '',
          role: newUser.role
        })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || '사용자 생성에 실패했습니다.');
        return;
      }

      const data = await response.json();
      
      setShowCreateModal(false);
      setNewUser({
        id: 0,
        username: '',
        name: '',
        email: '',
        phone: '',
        role: 'student',
        password: '',
        classIds: []
      });
      await loadData();
      alert(data.message || '사용자가 생성되었습니다.');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('사용자 생성 중 오류가 발생했습니다.');
    }
  };

  const handleEditUser = () => {
    if (!editingUser) return;
    
    // Update users
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = existingUsers.findIndex((u: User) => u.id === editingUser.id);
    
    if (userIndex !== -1) {
      existingUsers[userIndex] = {
        ...existingUsers[userIndex],
        ...editingUser
      };
    } else {
      // User doesn't exist in users, add it
      existingUsers.push(editingUser);
    }
    localStorage.setItem('users', JSON.stringify(existingUsers));
    
    // Update students if role is student
    if (editingUser.role === 'student') {
      const students = JSON.parse(localStorage.getItem('students') || '[]');
      const studentIndex = students.findIndex((s: any) => s.id === editingUser.id);
      
      const studentData = {
        id: editingUser.id,
        username: editingUser.username,
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        classIds: editingUser.classIds || [],
        classNames: editingUser.classIds?.map(id => 
          classes.find(c => c.id === id)?.name || ''
        ).filter(n => n),
        status: 'active'
      };
      
      if (studentIndex !== -1) {
        students[studentIndex] = studentData;
      } else {
        students.push(studentData);
      }
      localStorage.setItem('students', JSON.stringify(students));
      
      // Update class enrollments
      updateClassEnrollments(
        editingUser.id, 
        editingUser.name, 
        editingUser.username, 
        editingUser.classIds || []
      );
    }
    
    // Update classes if role is teacher
    if (editingUser.role === 'teacher') {
      const updatedClasses = classes.map(cls => {
        const shouldHaveTeacher = editingUser.classIds?.includes(cls.id);
        const hasTeacher = cls.teacherIds?.includes(editingUser.id);
        
        if (shouldHaveTeacher && !hasTeacher) {
          return { ...cls, teacherIds: [...(cls.teacherIds || []), editingUser.id] };
        } else if (!shouldHaveTeacher && hasTeacher) {
          return { ...cls, teacherIds: cls.teacherIds.filter(id => id !== editingUser.id) };
        }
        return cls;
      });
      localStorage.setItem('classes', JSON.stringify(updatedClasses));
    }
    
    // Dispatch event
    window.dispatchEvent(new Event('localStorageChanged'));
    
    setShowEditModal(false);
    setEditingUser(null);
    loadData();
    alert('사용자 정보가 수정되었습니다.');
  };

  const updateClassEnrollments = (userId: number, name: string, username: string, classIds: number[]) => {
    const allClasses = JSON.parse(localStorage.getItem('classes') || '[]');
    const updatedClasses = allClasses.map((cls: Class) => {
      const shouldHaveStudent = classIds.includes(cls.id);
      const studentData = { id: userId, name, username };
      
      // Check in students array
      const hasInStudents = cls.students?.some((s: any) => s.id === userId);
      
      // Check in studentIds array
      const hasInStudentIds = cls.studentIds?.includes(userId);
      
      let updatedClass = { ...cls };
      
      // Update students array
      if (shouldHaveStudent && !hasInStudents) {
        updatedClass.students = [...(cls.students || []), studentData];
      } else if (!shouldHaveStudent && hasInStudents) {
        updatedClass.students = cls.students.filter((s: any) => s.id !== userId);
      }
      
      // Update studentIds array
      if (shouldHaveStudent && !hasInStudentIds) {
        updatedClass.studentIds = [...(cls.studentIds || []), userId];
      } else if (!shouldHaveStudent && hasInStudentIds) {
        updatedClass.studentIds = cls.studentIds?.filter(id => id !== userId);
      }
      
      return updatedClass;
    });
    
    localStorage.setItem('classes', JSON.stringify(updatedClasses));
  };

  const handleDeleteUser = (user: User) => {
    if (!confirm(`정말 ${user.name} 사용자를 삭제하시겠습니까?`)) return;
    
    // Remove from users
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = existingUsers.filter((u: User) => u.id !== user.id);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // Remove from students if exists
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const updatedStudents = students.filter((s: any) => s.id !== user.id);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    
    // Remove from classes
    const updatedClasses = classes.map(cls => ({
      ...cls,
      students: cls.students?.filter((s: any) => s.id !== user.id) || [],
      studentIds: cls.studentIds?.filter(id => id !== user.id) || [],
      teacherIds: cls.teacherIds?.filter(id => id !== user.id) || []
    }));
    localStorage.setItem('classes', JSON.stringify(updatedClasses));
    
    // Dispatch event
    window.dispatchEvent(new Event('localStorageChanged'));
    
    loadData();
    alert('사용자가 삭제되었습니다.');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return { bg: '#fee2e2', color: '#dc2626' };
      case 'teacher': return { bg: '#dcfce7', color: '#16a34a' };
      case 'student': return { bg: '#dbeafe', color: '#2563eb' };
      case 'parent': return { bg: '#fef3c7', color: '#f59e0b' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
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

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>통합 사용자 관리</h2>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          + 새 사용자 추가
        </button>
      </div>

      {/* 필터 및 검색 */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            background: 'white'
          }}
        >
          <option value="all">전체 역할</option>
          <option value="admin">관리자</option>
          <option value="teacher">교사</option>
          <option value="student">학생</option>
          <option value="parent">학부모</option>
        </select>
        <input
          type="text"
          placeholder="이름, 아이디, 이메일로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '0.5rem 1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem'
          }}
        />
      </div>

      {/* 승인 대기 사용자 */}
      {filteredUsers.filter(u => u.status === 'pending').length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid #fbbf24' }}>
          <div className="card-header" style={{ background: '#fef3c7' }}>
            <div className="card-title">⏳ 승인 대기 사용자</div>
          </div>
          <div className="card-body">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>이름</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>아이디</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>역할</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>신청일</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>승인/거부</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.filter(u => u.status === 'pending').map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem' }}>{user.name}</td>
                    <td style={{ padding: '0.5rem' }}>{user.username}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        background: user.role === 'teacher' ? '#dcfce7' : '#dbeafe',
                        color: user.role === 'teacher' ? '#16a34a' : '#2563eb'
                      }}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              if (!token) {
                                alert('로그인이 필요합니다.');
                                return;
                              }
                              
                              const response = await fetch(`/api/auth/users/${user.id}/approval`, {
                                method: 'PUT',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json'
                                }
                              });
                              
                              if (!response.ok) {
                                const error = await response.json();
                                alert(error.error || '승인에 실패했습니다.');
                                return;
                              }
                              
                              const data = await response.json();
                              alert(data.message || `${user.name}님의 가입을 승인했습니다.`);
                              await loadData();
                            } catch (error) {
                              console.error('Error approving user:', error);
                              alert('사용자 승인 중 오류가 발생했습니다.');
                            }
                          }}
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          승인
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`${user.name}님의 가입을 거부하시겠습니까?`)) {
                              const updatedUsers = users.filter(u => u.id !== user.id);
                              localStorage.setItem('users', JSON.stringify(updatedUsers));
                              
                              // Remove from role-specific lists
                              if (user.role === 'student') {
                                const students = JSON.parse(localStorage.getItem('students') || '[]');
                                const filteredStudents = students.filter((s: any) => s.id !== user.id);
                                localStorage.setItem('students', JSON.stringify(filteredStudents));
                                
                                const allStudents = JSON.parse(localStorage.getItem('studylink_all_students') || '[]');
                                const filteredAllStudents = allStudents.filter((s: any) => s.id !== user.id);
                                localStorage.setItem('studylink_all_students', JSON.stringify(filteredAllStudents));
                              } else if (user.role === 'teacher') {
                                const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
                                const filteredTeachers = teachers.filter((t: any) => t.id !== user.id);
                                localStorage.setItem('teachers', JSON.stringify(filteredTeachers));
                              }
                              
                              window.dispatchEvent(new Event('localStorageChanged'));
                              alert(`${user.name}님의 가입을 거부했습니다.`);
                              loadData();
                            }
                          }}
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          거부
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>활성 사용자</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{users.filter(u => u.status === 'active').length}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>관리자</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
              {users.filter(u => u.role === 'admin' && u.status === 'active').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>교사</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
              {users.filter(u => u.role === 'teacher' && u.status === 'active').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>학생</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
              {users.filter(u => u.role === 'student' && u.status === 'active').length}
            </p>
          </div>
        </div>
      </div>

      {/* 사용자 테이블 */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left' }}>이름</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>아이디</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>역할</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>이메일</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>전화번호</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>소속 반</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.filter(u => u.status !== 'pending').map(user => {
                const roleStyle = getRoleBadgeColor(user.role);
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: '500' }}>{user.name}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>{user.username}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: roleStyle.bg,
                        color: roleStyle.color,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{user.email || '-'}</td>
                    <td style={{ padding: '1rem' }}>{user.phone || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {user.classNames && user.classNames.length > 0 ? (
                          user.classNames.map((className, idx) => (
                            <span key={idx} style={{
                              background: '#f0f9ff',
                              color: '#0369a1',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem'
                            }}>
                              {className}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>-</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowEditModal(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 생성 모달 */}
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
          <div className="card" style={{ width: '500px', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="card-header">
              <div className="card-title">새 사용자 추가</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>이름 *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>아이디 *</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>비밀번호 *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>역할 *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as User['role'] })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  >
                    <option value="student">학생</option>
                    <option value="teacher">교사</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>이메일</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>전화번호</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>
                {(newUser.role === 'student' || newUser.role === 'teacher') && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                      {newUser.role === 'student' ? '반 배정' : '담당 반'}
                    </label>
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      padding: '0.5rem',
                      maxHeight: '150px',
                      overflow: 'auto'
                    }}>
                      {classes.map(cls => (
                        <label key={cls.id} style={{ display: 'block', marginBottom: '0.25rem' }}>
                          <input
                            type="checkbox"
                            checked={newUser.classIds?.includes(cls.id) || false}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewUser({
                                  ...newUser,
                                  classIds: [...(newUser.classIds || []), cls.id]
                                });
                              } else {
                                setNewUser({
                                  ...newUser,
                                  classIds: newUser.classIds?.filter(id => id !== cls.id) || []
                                });
                              }
                            }}
                            style={{ marginRight: '0.5rem' }}
                          />
                          {cls.name} ({cls.grade} - {cls.subject})
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button onClick={handleCreateUser} className="btn btn-primary" style={{ flex: 1 }}>
                  생성
                </button>
                <button onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({
                    id: 0,
                    username: '',
                    name: '',
                    email: '',
                    phone: '',
                    role: 'student',
                    password: '',
                    classIds: []
                  });
                }} className="btn btn-secondary" style={{ flex: 1 }}>
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && editingUser && (
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
          <div className="card" style={{ width: '500px', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="card-header">
              <div className="card-title">사용자 정보 수정</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>이름</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>아이디</label>
                  <input
                    type="text"
                    value={editingUser.username}
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      background: '#f3f4f6',
                      color: '#6b7280'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>역할</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as User['role'] })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  >
                    <option value="student">학생</option>
                    <option value="teacher">교사</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>이메일</label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>전화번호</label>
                  <input
                    type="tel"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>
                {(editingUser.role === 'student' || editingUser.role === 'teacher') && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                      {editingUser.role === 'student' ? '반 배정' : '담당 반'}
                    </label>
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      padding: '0.5rem',
                      maxHeight: '150px',
                      overflow: 'auto'
                    }}>
                      {classes.map(cls => (
                        <label key={cls.id} style={{ display: 'block', marginBottom: '0.25rem' }}>
                          <input
                            type="checkbox"
                            checked={editingUser.classIds?.includes(cls.id) || false}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditingUser({
                                  ...editingUser,
                                  classIds: [...(editingUser.classIds || []), cls.id]
                                });
                              } else {
                                setEditingUser({
                                  ...editingUser,
                                  classIds: editingUser.classIds?.filter(id => id !== cls.id) || []
                                });
                              }
                            }}
                            style={{ marginRight: '0.5rem' }}
                          />
                          {cls.name} ({cls.grade} - {cls.subject})
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button onClick={handleEditUser} className="btn btn-primary" style={{ flex: 1 }}>
                  저장
                </button>
                <button onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }} className="btn btn-secondary" style={{ flex: 1 }}>
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

export default IntegratedUserManagement;