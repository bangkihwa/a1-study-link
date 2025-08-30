import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  is_approved: boolean;
  created_at: string;
}

interface UserManagementProps {
  onBack: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'student'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
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
        setUsers(data.users || []);
      } else {
        setError('사용자 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('Load users error:', err);
      setError('사용자 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.name) {
      alert('모든 필수 필드를 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        const data = await response.json();
        setUsers([...users, data.user]);
        setNewUser({
          username: '',
          email: '',
          password: '',
          name: '',
          phone: '',
          role: 'student'
        });
        setShowCreateForm(false);
        alert('사용자가 성공적으로 생성되었습니다.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '사용자 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('Create user error:', err);
      alert('사용자 생성에 실패했습니다.');
    }
  };

  const toggleApproval = async (userId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/users/${userId}/approval`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_approved: !currentStatus })
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, is_approved: !currentStatus }
            : user
        ));
        alert(data.message);
      } else {
        alert('승인 상태 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error('Toggle approval error:', err);
      alert('승인 상태 변경에 실패했습니다.');
    }
  };

  const changeRole = async (userId: number, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, role: newRole as User['role'] }
            : user
        ));
        alert(data.message);
      } else {
        alert('역할 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error('Change role error:', err);
      alert('역할 변경에 실패했습니다.');
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0 }}>사용자 관리</h2>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)} 
          className="btn btn-primary"
        >
          + 새 사용자 추가
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <div className="card-title">새 사용자 추가</div>
          </div>
          <div className="card-body">
            <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>사용자명</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="사용자명 입력"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>이메일</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="이메일 입력"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>비밀번호</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="비밀번호 입력"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </div>
            </div>
            <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>이름</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="실명 입력"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>전화번호 (선택)</label>
                <input
                  type="text"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="전화번호 입력"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>역할</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                >
                  <option value="student">학생</option>
                  <option value="teacher">교사</option>
                  <option value="parent">학부모</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={createUser} className="btn btn-primary">생성</button>
              <button onClick={() => setShowCreateForm(false)} className="btn btn-secondary">취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left' }}>사용자명</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>이름</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>이메일</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>역할</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>승인상태</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>가입일</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem' }}>{user.username}</td>
                  <td style={{ padding: '1rem' }}>{user.name}</td>
                  <td style={{ padding: '1rem' }}>{user.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      style={{ padding: '0.25rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                    >
                      <option value="admin">관리자</option>
                      <option value="teacher">교사</option>
                      <option value="student">학생</option>
                      <option value="parent">학부모</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      background: user.is_approved ? '#dcfce7' : '#fee2e2',
                      color: user.is_approved ? '#16a34a' : '#dc2626',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem'
                    }}>
                      {user.is_approved ? '승인됨' : '대기중'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => toggleApproval(user.id, user.is_approved)}
                      className={`btn ${user.is_approved ? 'btn-danger' : 'btn-primary'}`}
                      style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                    >
                      {user.is_approved ? '승인취소' : '승인'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;