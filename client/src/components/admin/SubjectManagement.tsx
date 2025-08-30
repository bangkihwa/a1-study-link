import React, { useState, useEffect } from 'react';

interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    description: ''
  });

  useEffect(() => {
    loadSubjects();
  }, []);

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

  const createSubject = async () => {
    if (!newSubject.name || !newSubject.code) {
      alert('과목명과 과목코드를 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSubject)
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setNewSubject({ name: '', code: '', description: '' });
        setShowCreateForm(false);
        loadSubjects();
      } else {
        const error = await response.json();
        alert(error.error || '과목 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Create subject error:', error);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const updateSubject = async () => {
    if (!editingSubject || !editingSubject.name || !editingSubject.code) {
      alert('과목명과 과목코드를 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/subjects/${editingSubject.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingSubject.name,
          code: editingSubject.code,
          description: editingSubject.description
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setEditingSubject(null);
        loadSubjects();
      } else {
        const error = await response.json();
        alert(error.error || '과목 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Update subject error:', error);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const deleteSubject = async (subjectId: number, subjectName: string) => {
    if (!confirm(`정말 "${subjectName}" 과목을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        loadSubjects();
      } else {
        const error = await response.json();
        alert(error.error || '과목 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete subject error:', error);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const startEdit = (subject: Subject) => {
    setEditingSubject({ ...subject });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingSubject(null);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>과목 관리</h3>
        <button 
          onClick={() => {
            setShowCreateForm(true);
            setEditingSubject(null);
          }} 
          className="btn btn-primary"
        >
          + 새 과목 추가
        </button>
      </div>

      {/* 새 과목 추가 폼 */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <div className="card-title">새 과목 추가</div>
          </div>
          <div className="card-body">
            <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>과목명</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  placeholder="예: 중등3"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>과목코드</label>
                <input
                  type="text"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                  placeholder="예: M3"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>설명</label>
                <input
                  type="text"
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                  placeholder="과목 설명 (선택사항)"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={createSubject} className="btn btn-primary">추가</button>
              <button onClick={() => setShowCreateForm(false)} className="btn btn-secondary">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 과목 수정 폼 */}
      {editingSubject && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <div className="card-title">과목 수정</div>
          </div>
          <div className="card-body">
            <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>과목명</label>
                <input
                  type="text"
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>과목코드</label>
                <input
                  type="text"
                  value={editingSubject.code}
                  onChange={(e) => setEditingSubject({...editingSubject, code: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>설명</label>
                <input
                  type="text"
                  value={editingSubject.description}
                  onChange={(e) => setEditingSubject({...editingSubject, description: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={updateSubject} className="btn btn-primary">수정 완료</button>
              <button onClick={cancelEdit} className="btn btn-secondary">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 과목 목록 */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left' }}>과목명</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>코드</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>설명</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>생성일</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{subject.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      background: '#fef3c7',
                      color: '#d97706',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem'
                    }}>
                      {subject.code}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>{subject.description || '설명 없음'}</td>
                  <td style={{ padding: '1rem' }}>{new Date(subject.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => startEdit(subject)}
                      >
                        수정
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => deleteSubject(subject.id, subject.name)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {subjects.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
              <p>아직 등록된 과목이 없습니다.</p>
              <p>새 과목 추가 버튼을 클릭해서 과목을 등록해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectManagement;