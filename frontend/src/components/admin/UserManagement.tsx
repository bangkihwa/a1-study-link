import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';
import { AdminClass, AdminUser } from '../../types';

interface Filters {
  role: string;
  status: string;
  search: string;
}

const defaultFilters: Filters = {
  role: 'all',
  status: 'all',
  search: ''
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<AdminClass[]>([]);

  const fetchUsers = useCallback(async (activeFilters: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getAdminUsers({
        role: activeFilters.role !== 'all' ? activeFilters.role : undefined,
        status: activeFilters.status !== 'all' ? activeFilters.status : undefined,
        search: activeFilters.search || undefined
      });

      if (response.success) {
        setUsers(response.data || []);
      } else {
        setError(response.message || '사용자 목록을 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers(filters);
    }, 300);

    return () => clearTimeout(handler);
  }, [filters, fetchUsers]);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await apiService.getAdminClasses({ includeInactive: false });
        if (response.success) {
          setClasses(response.data || []);
        }
      } catch (err) {
        console.warn('반 목록을 불러오는 중 문제가 발생했습니다.', err);
      }
    };

    loadClasses();
  }, []);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const handleApprove = async (userId: number) => {
    try {
      await apiService.approveAdminUser(userId);
      setFeedback('승인 처리되었습니다.');
      fetchUsers(filters);
    } catch (err) {
      console.error(err);
      setError('승인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleDeactivate = async (userId: number) => {
    try {
      await apiService.deactivateAdminUser(userId);
      setFeedback('사용자가 비활성화되었습니다.');
      fetchUsers(filters);
    } catch (err) {
      console.error(err);
      setError('사용자 비활성화 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`${user.name} 계정을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await apiService.deleteAdminUser(user.id);
      setFeedback('사용자 계정을 삭제했습니다.');
      fetchUsers(filters);
    } catch (err) {
      console.error(err);
      setError('사용자를 삭제하는 중 오류가 발생했습니다.');
    }
  };

  const handleReactivate = async (user: AdminUser) => {
    try {
      await apiService.updateAdminUser(user.id, { isActive: true });
      setFeedback('사용자가 활성화되었습니다.');
      fetchUsers(filters);
    } catch (err) {
      console.error(err);
      setError('사용자 활성화 중 오류가 발생했습니다.');
    }
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser({ ...user });
  };

  const closeEditModal = () => {
    setEditingUser(null);
  };

  const handleEditChange = (key: keyof AdminUser, value: any) => {
    if (!editingUser) return;
    let nextValue = value;

    if (key === 'classId') {
      if (value === '' || value === null || value === undefined) {
        nextValue = null;
      } else if (typeof value === 'string') {
        const parsed = Number(value);
        nextValue = Number.isNaN(parsed) ? null : parsed;
      }
    }

    const updatedUser: AdminUser = {
      ...editingUser,
      [key]: nextValue
    } as AdminUser;

    if (key === 'role' && nextValue !== 'student') {
      updatedUser.classId = null;
    }

    setEditingUser(updatedUser);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, any> = {
        name: editingUser.name,
        email: editingUser.email || null,
        phone: editingUser.phone || null,
        role: editingUser.role,
        isApproved: editingUser.isApproved,
        isActive: editingUser.isActive
      };

      if (editingUser.role === 'student') {
        payload.classId = editingUser.classId ?? null;
      } else {
        payload.classId = null;
      }

      await apiService.updateAdminUser(editingUser.id, payload);
      setFeedback('사용자 정보가 업데이트되었습니다.');
      closeEditModal();
      fetchUsers(filters);
    } catch (err) {
      console.error(err);
      setError('사용자 정보를 저장하는 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const filteredSummary = useMemo(() => {
    const total = users.length;
    const approved = users.filter((user) => user.isApproved).length;
    const active = users.filter((user) => user.isActive).length;
    return { total, approved, active };
  }, [users]);

  const formatDate = (value: string) => new Date(value).toLocaleDateString();

  const renderStudentIdentifier = (user: AdminUser) => {
    if (user.role === 'student') {
      return user.studentNumber || '-';
    }
    if (user.role === 'parent') {
      return user.linkedStudentNumbers || '-';
    }
    return '-';
  };

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <p className="text-gray-600">필터를 활용하여 역할·상태별 사용자를 관리하고, 승인 및 비활성화를 진행하세요.</p>
      </header>

      {feedback && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {feedback}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <section className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">전체</option>
              <option value="admin">관리자</option>
              <option value="teacher">강사</option>
              <option value="student">학생</option>
              <option value="parent">학부모</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="pending">승인 대기</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <input
              type="text"
              placeholder="이름, 아이디, 이메일"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            필터 초기화
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard label="총 사용자" value={filteredSummary.total} />
          <SummaryCard label="승인 완료" value={filteredSummary.approved} />
          <SummaryCard label="활성 사용자" value={filteredSummary.active} />
        </div>
      </section>

      <section className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader>이름</TableHeader>
                <TableHeader>아이디</TableHeader>
                <TableHeader>역할</TableHeader>
                <TableHeader>학생 고유번호 / 연동 학생</TableHeader>
                <TableHeader>이메일</TableHeader>
                <TableHeader>전화번호</TableHeader>
                <TableHeader>승인</TableHeader>
                <TableHeader>활성</TableHeader>
                <TableHeader>가입일</TableHeader>
                <TableHeader>관리</TableHeader>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-sm text-gray-500">목록을 불러오는 중...</td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-sm text-gray-500">조건에 맞는 사용자가 없습니다.</td>
                </tr>
              )}

              {!loading && users.map((user) => (
                <tr key={user.id} className={user.isActive ? '' : 'bg-gray-50'}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{translateRole(user.role)}</TableCell>
                  <TableCell>{renderStudentIdentifier(user)}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <StatusBadge status={user.isApproved ? 'success' : 'warning'}>
                      {user.isApproved ? '승인됨' : '대기'}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={user.isActive ? 'success' : 'error'}>
                      {user.isActive ? '활성' : '비활성'}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {!user.isApproved && (
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          승인
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(user)}
                        className="px-3 py-1 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        수정
                      </button>
                      {user.isActive && (
                        <>
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            className="px-3 py-1 text-xs font-medium border border-amber-300 text-amber-700 rounded-md hover:bg-amber-50"
                          >
                            비활성화
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="px-3 py-1 text-xs font-medium border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                          >
                            삭제
                          </button>
                        </>
                      )}
                      {!user.isActive && (
                        <button
                          onClick={() => handleReactivate(user)}
                          className="px-3 py-1 text-xs font-medium border border-green-300 text-green-600 rounded-md hover:bg-green-50"
                        >
                          활성화
                        </button>
                      )}
                    </div>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          saving={saving}
          classes={classes}
          onChange={handleEditChange}
          onClose={closeEditModal}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  value: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value }) => (
  <div className="border border-gray-100 rounded-lg px-4 py-3">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-gray-900">{value.toLocaleString()}</p>
  </div>
);

interface TableHeaderProps {
  children: React.ReactNode;
}

const TableHeader: React.FC<TableHeaderProps> = ({ children }) => (
  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 tracking-wider">
    {children}
  </th>
);

interface TableCellProps {
  children: React.ReactNode;
}

const TableCell: React.FC<TableCellProps> = ({ children }) => (
  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{children}</td>
);

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  const styles = {
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    error: 'bg-red-50 text-red-600 border border-red-200'
  };

  return (
    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-md ${styles[status]}`}>
      {children}
    </span>
  );
};

const translateRole = (role: string) => {
  switch (role) {
    case 'admin':
      return '관리자';
    case 'teacher':
      return '강사';
    case 'student':
      return '학생';
    case 'parent':
      return '학부모';
    default:
      return role;
  }
};

interface EditUserModalProps {
  user: AdminUser;
  saving: boolean;
  classes: AdminClass[];
  onChange: (key: keyof AdminUser, value: any) => void;
  onClose: () => void;
  onSave: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, saving, classes, onChange, onClose, onSave }) => (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
      <header>
        <h2 className="text-lg font-semibold">사용자 정보 수정</h2>
        <p className="text-sm text-gray-500">사용자의 기본 정보를 업데이트할 수 있습니다.</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <input
            type="text"
            value={user.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            value={user.email || ''}
            onChange={(e) => onChange('email', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
          <input
            type="text"
            value={user.phone || ''}
            onChange={(e) => onChange('phone', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        {user.role === 'student' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">학생 고유번호</label>
            <input
              type="text"
              value={user.studentNumber || ''}
              readOnly
              className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">학생 고유번호는 자동 생성되며 수정할 수 없습니다.</p>
          </div>
        )}
        {user.role === 'student' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">수강 반</label>
            <select
              value={user.classId != null ? String(user.classId) : ''}
              onChange={(e) => onChange('classId', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">배정 없음</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.subjectName ? `- ${cls.subjectName}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">학생이 속할 반을 선택하세요.</p>
          </div>
        )}
        {user.role === 'parent' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연동된 학생</label>
            <textarea
              value={user.linkedStudentNumbers || '연동된 학생이 없습니다.'}
              readOnly
              className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">연동 정보는 사용자 등록을 통해 관리됩니다.</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
          <select
            value={user.role}
            onChange={(e) => onChange('role', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="admin">관리자</option>
              <option value="teacher">강사</option>
            <option value="student">학생</option>
            <option value="parent">학부모</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={user.isApproved}
              onChange={(e) => onChange('isApproved', e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-gray-700">승인 상태</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={user.isActive}
              onChange={(e) => onChange('isActive', e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-gray-700">활성 상태</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={saving}
        >
          취소
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={saving}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  </div>
);

export default UserManagement;
