import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'teacher' | 'student';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  additionalInfo?: any;
}

interface EnhancedUserManagementProps {
  onBack: () => void;
}

const EnhancedUserManagement: React.FC<EnhancedUserManagementProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'teacher' | 'student'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'student' as 'admin' | 'teacher' | 'student'
  });

  useEffect(() => {
    loadAllUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, roleFilter, statusFilter, searchTerm]);

  const loadAllUsers = () => {
    const allUsers: User[] = [];
    
    // Load all users from main users list (includes pending users)
    const mainUsers = localStorage.getItem('users');
    if (mainUsers) {
      const users = JSON.parse(mainUsers);
      users.forEach((user: any) => {
        // Skip default admin user if already added
        if (user.username === 'admin' && allUsers.some(u => u.username === 'admin')) {
          return;
        }
        
        allUsers.push({
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role as 'admin' | 'teacher' | 'student',
          status: user.status || 'active',
          createdAt: user.createdAt || new Date().toISOString().split('T')[0]
        });
      });
    }
    
    // Add default admin if not exists
    if (!allUsers.some(u => u.username === 'admin')) {
      allUsers.push({
        id: 1,
        username: 'admin',
        name: '관리자',
        email: 'admin@school.com',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-01'
      });
    }
    
    // Load additional teacher data
    const teacherData = localStorage.getItem('studylink_all_teachers');
    if (teacherData) {
      const teachers = JSON.parse(teacherData);
      teachers.forEach((teacher: any) => {
        const existingUser = allUsers.find(u => u.id === teacher.id);
        if (existingUser) {
          existingUser.additionalInfo = { subject: teacher.subject, classes: teacher.classes };
        }
      });
    }
    
    // Load additional student data
    const studentData = localStorage.getItem('studylink_all_students');
    if (studentData) {
      const students = JSON.parse(studentData);
      students.forEach((student: any) => {
        const existingUser = allUsers.find(u => u.id === student.id);
        if (existingUser) {
          existingUser.additionalInfo = { 
            classIds: student.classIds, 
            classNames: student.classNames 
          };
        }
      });
    }
    
    setUsers(allUsers);
  };

  const filterUsers = () => {
    let filtered = users;
    
    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  };

  const createUser = () => {
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
      alert('모든 필수 필드를 입력해주세요.');
      return;
    }

    // Check for duplicate username
    if (users.some(u => u.username === newUser.username)) {
      alert('이미 존재하는 아이디입니다.');
      return;
    }

    const newUserData: User = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Save to appropriate localStorage
    if (newUser.role === 'admin') {
      const admins = JSON.parse(localStorage.getItem('studylink_admins') || '[]');
      admins.push(newUserData);
      localStorage.setItem('studylink_admins', JSON.stringify(admins));
    } else if (newUser.role === 'teacher') {
      const teachers = JSON.parse(localStorage.getItem('studylink_all_teachers') || '[]');
      teachers.push({ ...newUserData, subject: '', classes: [] });
      localStorage.setItem('studylink_all_teachers', JSON.stringify(teachers));
      
      // Also add to teachers list for class management
      const classTeachers = JSON.parse(localStorage.getItem('studylink_teachers') || '[]');
      classTeachers.push({ ...newUserData, subject: '' });
      localStorage.setItem('studylink_teachers', JSON.stringify(classTeachers));
    } else {
      const students = JSON.parse(localStorage.getItem('studylink_all_students') || '[]');
      students.push({ ...newUserData, classIds: [], classNames: [] });
      localStorage.setItem('studylink_all_students', JSON.stringify(students));
      
      // Also add to students list for class management
      const classStudents = JSON.parse(localStorage.getItem('students') || '[]');
      classStudents.push({ ...newUserData, classIds: [], classNames: [] });
      localStorage.setItem('students', JSON.stringify(classStudents));
      
      // Add to users list for login
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      users.push({
        id: newUserData.id,
        username: newUser.username,
        password: newUser.password,
        name: newUserData.name,
        role: 'student',
        status: 'active'
      });
      localStorage.setItem('users', JSON.stringify(users));
    }

    window.dispatchEvent(new Event('localStorageChanged'));
    loadAllUsers();
    
    setNewUser({
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      role: 'student'
    });
    setShowCreateModal(false);
    alert('사용자가 추가되었습니다. 승인 대기 중입니다.');
  };

  const updateUserStatus = (userId: number, newStatus: 'active' | 'inactive' | 'pending') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Update main users list first
    const mainUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const mainUserIndex = mainUsers.findIndex((u: any) => u.id === userId);
    if (mainUserIndex >= 0) {
      mainUsers[mainUserIndex].status = newStatus;
      localStorage.setItem('users', JSON.stringify(mainUsers));
    }

    // Update in appropriate role-specific localStorage
    if (user.role === 'teacher') {
      const teachers = JSON.parse(localStorage.getItem('studylink_all_teachers') || '[]');
      const teacherIndex = teachers.findIndex((t: any) => t.id === userId);
      if (teacherIndex >= 0) {
        teachers[teacherIndex].status = newStatus;
        localStorage.setItem('studylink_all_teachers', JSON.stringify(teachers));
      }
      
      // Also update teachers list for class management
      const classTeachers = JSON.parse(localStorage.getItem('teachers') || '[]');
      const classTeacherIndex = classTeachers.findIndex((t: any) => t.id === userId);
      if (classTeacherIndex >= 0) {
        classTeachers[classTeacherIndex].status = newStatus;
        localStorage.setItem('teachers', JSON.stringify(classTeachers));
      }
    } else if (user.role === 'student') {
      const students = JSON.parse(localStorage.getItem('studylink_all_students') || '[]');
      const studentIndex = students.findIndex((s: any) => s.id === userId);
      if (studentIndex >= 0) {
        students[studentIndex].status = newStatus;
        localStorage.setItem('studylink_all_students', JSON.stringify(students));
      }
      
      // Also update students list for class management
      const classStudents = JSON.parse(localStorage.getItem('students') || '[]');
      const classStudentIndex = classStudents.findIndex((s: any) => s.id === userId);
      if (classStudentIndex >= 0) {
        classStudents[classStudentIndex].status = newStatus;
        localStorage.setItem('students', JSON.stringify(classStudents));
      }
    }

    window.dispatchEvent(new Event('localStorageChanged'));
    loadAllUsers();
  };

  const deleteUser = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.role === 'admin') {
      alert('관리자 계정은 삭제할 수 없습니다.');
      return;
    }

    if (confirm(`정말 ${user.name} 사용자를 삭제하시겠습니까?`)) {
      // Delete from appropriate localStorage
      if (user.role === 'teacher') {
        const teachers = JSON.parse(localStorage.getItem('studylink_all_teachers') || '[]');
        const filtered = teachers.filter((t: any) => t.id !== userId);
        localStorage.setItem('studylink_all_teachers', JSON.stringify(filtered));
      } else if (user.role === 'student') {
        const students = JSON.parse(localStorage.getItem('studylink_all_students') || '[]');
        const filtered = students.filter((s: any) => s.id !== userId);
        localStorage.setItem('studylink_all_students', JSON.stringify(filtered));
      }

      window.dispatchEvent(new Event('localStorageChanged'));
      loadAllUsers();
      alert('사용자가 삭제되었습니다.');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'teacher': return '교사';
      case 'student': return '학생';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return { bg: '#fef3c7', color: '#d97706' };
      case 'teacher': return { bg: '#dbeafe', color: '#2563eb' };
      case 'student': return { bg: '#dcfce7', color: '#16a34a' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', color: '#16a34a' };
      case 'inactive': return { bg: '#fee2e2', color: '#dc2626' };
      case 'pending': return { bg: '#fef3c7', color: '#d97706' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>사용자 관리</h2>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          + 새 사용자 추가
        </button>
      </div>

      {/* 필터 및 검색 */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
            >
              <option value="all">모든 역할</option>
              <option value="admin">관리자</option>
              <option value="teacher">교사</option>
              <option value="student">학생</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
            >
              <option value="all">모든 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="pending">승인 대기</option>
            </select>
            
            <input
              type="text"
              placeholder="이름, 아이디, 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                flex: 1, 
                padding: '0.5rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.375rem' 
              }}
            />
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>전체 사용자</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{users.length}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>관리자</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>교사</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
              {users.filter(u => u.role === 'teacher').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>학생</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
              {users.filter(u => u.role === 'student').length}
            </p>
          </div>
        </div>
      </div>

      {/* 사용자 목록 테이블 */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left' }}>이름</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>아이디</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>이메일</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>역할</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>추가 정보</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>상태</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>등록일</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const roleStyle = getRoleColor(user.role);
                const statusStyle = getStatusColor(user.status);
                
                return (
                  <tr key={`${user.role}-${user.id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: '500' }}>{user.name}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>{user.username}</td>
                    <td style={{ padding: '1rem' }}>{user.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: roleStyle.bg,
                        color: roleStyle.color,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem'
                      }}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {user.role === 'teacher' && user.additionalInfo?.subject && (
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          과목: {user.additionalInfo.subject}
                        </span>
                      )}
                      {user.role === 'student' && user.additionalInfo?.classNames && (
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          반: {user.additionalInfo.classNames.join(', ') || '미배정'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => {
                          const newStatus = user.status === 'active' ? 'inactive' : 
                                          user.status === 'inactive' ? 'pending' : 'active';
                          updateUserStatus(user.id, newStatus);
                        }}
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {user.status === 'active' ? '활성' : 
                         user.status === 'inactive' ? '비활성' : '승인 대기'}
                      </button>
                    </td>
                    <td style={{ padding: '1rem' }}>{user.createdAt}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {user.status === 'pending' && (
                          <button
                            onClick={() => updateUserStatus(user.id, 'active')}
                            className="btn btn-success"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            승인
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          disabled={user.role === 'admin'}
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
          
          {filteredUsers.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              조건에 맞는 사용자가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 사용자 추가 모달 */}
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
              <div className="card-title">새 사용자 추가</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                >
                  <option value="student">학생</option>
                  <option value="teacher">교사</option>
                  <option value="admin">관리자</option>
                </select>
                <input
                  type="text"
                  placeholder="이름 *"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <input
                  type="text"
                  placeholder="아이디 *"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <input
                  type="password"
                  placeholder="비밀번호 *"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <input
                  type="email"
                  placeholder="이메일 *"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
                <input
                  type="tel"
                  placeholder="전화번호 (선택)"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={createUser} className="btn btn-primary">추가</button>
                <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedUserManagement;