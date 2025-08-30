import React, { useState, useEffect } from 'react';

interface Post {
  id: number;
  classId: number;
  className: string;
  teacherId: number;
  teacherName: string;
  title: string;
  content: string;
  type: 'notice' | 'assignment' | 'material' | 'objective';
  attachments?: string[];
  createdAt: string;
  dueDate?: string;
  views: number;
  important: boolean;
}

interface ClassBulletinBoardProps {
  classId: number;
  className: string;
  userRole: 'student' | 'teacher' | 'admin';
  userId: number;
  userName: string;
  onBack: () => void;
}

const ClassBulletinBoard: React.FC<ClassBulletinBoardProps> = ({
  classId,
  className,
  userRole,
  userId,
  userName,
  onBack
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'notice' as Post['type'],
    dueDate: '',
    important: false
  });
  const [filter, setFilter] = useState<'all' | Post['type']>('all');

  useEffect(() => {
    loadPosts();
  }, [classId]);

  const loadPosts = () => {
    const allPosts = JSON.parse(localStorage.getItem('classPosts') || '[]');
    const classPosts = allPosts.filter((p: Post) => p.classId === classId);
    setPosts(classPosts.sort((a: Post, b: Post) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const createPost = () => {
    if (!newPost.title || !newPost.content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    const post: Post = {
      id: Date.now(),
      classId,
      className,
      teacherId: userId,
      teacherName: userName,
      title: newPost.title,
      content: newPost.content,
      type: newPost.type,
      dueDate: newPost.dueDate,
      createdAt: new Date().toISOString(),
      views: 0,
      important: newPost.important
    };

    const allPosts = JSON.parse(localStorage.getItem('classPosts') || '[]');
    allPosts.push(post);
    localStorage.setItem('classPosts', JSON.stringify(allPosts));

    setNewPost({
      title: '',
      content: '',
      type: 'notice',
      dueDate: '',
      important: false
    });
    setShowCreateModal(false);
    loadPosts();

    // 이벤트 발생
    window.dispatchEvent(new Event('localStorageChanged'));
    alert('게시물이 등록되었습니다.');
  };

  const deletePost = (postId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const allPosts = JSON.parse(localStorage.getItem('classPosts') || '[]');
    const filtered = allPosts.filter((p: Post) => p.id !== postId);
    localStorage.setItem('classPosts', JSON.stringify(filtered));
    
    loadPosts();
    setSelectedPost(null);
    alert('게시물이 삭제되었습니다.');
  };

  const viewPost = (post: Post) => {
    // 조회수 증가
    const allPosts = JSON.parse(localStorage.getItem('classPosts') || '[]');
    const updated = allPosts.map((p: Post) => 
      p.id === post.id ? { ...p, views: p.views + 1 } : p
    );
    localStorage.setItem('classPosts', JSON.stringify(updated));
    
    setSelectedPost({ ...post, views: post.views + 1 });
  };

  const getTypeLabel = (type: Post['type']) => {
    switch (type) {
      case 'notice': return '공지사항';
      case 'assignment': return '과제';
      case 'material': return '학습자료';
      case 'objective': return '학습목표';
      default: return type;
    }
  };

  const getTypeColor = (type: Post['type']) => {
    switch (type) {
      case 'notice': return '#dc2626';
      case 'assignment': return '#d97706';
      case 'material': return '#2563eb';
      case 'objective': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const filteredPosts = filter === 'all' 
    ? posts 
    : posts.filter(p => p.type === filter);

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            {className} 게시판
          </h2>
        </div>
        {userRole === 'teacher' && (
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="btn btn-primary"
          >
            + 새 게시물 작성
          </button>
        )}
      </div>

      {/* 필터 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: '0.875rem' }}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('notice')}
            className={filter === 'notice' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ 
              fontSize: '0.875rem',
              background: filter === 'notice' ? '#dc2626' : undefined,
              borderColor: filter === 'notice' ? '#dc2626' : undefined
            }}
          >
            공지사항
          </button>
          <button
            onClick={() => setFilter('assignment')}
            className={filter === 'assignment' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ 
              fontSize: '0.875rem',
              background: filter === 'assignment' ? '#d97706' : undefined,
              borderColor: filter === 'assignment' ? '#d97706' : undefined
            }}
          >
            과제
          </button>
          <button
            onClick={() => setFilter('material')}
            className={filter === 'material' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ 
              fontSize: '0.875rem',
              background: filter === 'material' ? '#2563eb' : undefined,
              borderColor: filter === 'material' ? '#2563eb' : undefined
            }}
          >
            학습자료
          </button>
          <button
            onClick={() => setFilter('objective')}
            className={filter === 'objective' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ 
              fontSize: '0.875rem',
              background: filter === 'objective' ? '#16a34a' : undefined,
              borderColor: filter === 'objective' ? '#16a34a' : undefined
            }}
          >
            학습목표
          </button>
        </div>
      </div>

      {/* 게시물 목록 */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'center', width: '80px' }}>번호</th>
                <th style={{ padding: '1rem', textAlign: 'center', width: '100px' }}>구분</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>제목</th>
                <th style={{ padding: '1rem', textAlign: 'center', width: '120px' }}>작성자</th>
                <th style={{ padding: '1rem', textAlign: 'center', width: '100px' }}>작성일</th>
                <th style={{ padding: '1rem', textAlign: 'center', width: '80px' }}>조회수</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ 
                    padding: '3rem', 
                    textAlign: 'center', 
                    color: '#6b7280' 
                  }}>
                    게시물이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post, index) => (
                  <tr 
                    key={post.id} 
                    style={{ 
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      background: post.important ? '#fef3c7' : 'white'
                    }}
                    onClick={() => viewPost(post)}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = post.important ? '#fef3c7' : 'white'}
                  >
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {filteredPosts.length - index}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        background: getTypeColor(post.type),
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {getTypeLabel(post.type)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {post.important && <span style={{ color: '#dc2626' }}>📌</span>}
                        <span style={{ fontWeight: post.important ? '600' : '400' }}>
                          {post.title}
                        </span>
                        {post.dueDate && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#dc2626',
                            background: '#fee2e2',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '0.25rem'
                          }}>
                            ~{new Date(post.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {post.teacherName}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {post.views}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 게시물 상세 모달 */}
      {selectedPost && (
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
          <div className="card" style={{ 
            width: '90%', 
            maxWidth: '800px', 
            maxHeight: '90vh', 
            overflow: 'auto' 
          }}>
            <div className="card-header" style={{ 
              background: getTypeColor(selectedPost.type),
              color: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    marginRight: '1rem'
                  }}>
                    {getTypeLabel(selectedPost.type)}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                    {selectedPost.title}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'white',
                    fontSize: '1.5rem',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="card-body">
              <div style={{ 
                marginBottom: '1.5rem', 
                paddingBottom: '1rem', 
                borderBottom: '1px solid #e5e7eb' 
              }}>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <span>작성자: {selectedPost.teacherName}</span>
                  <span>작성일: {new Date(selectedPost.createdAt).toLocaleString()}</span>
                  <span>조회수: {selectedPost.views}</span>
                  {selectedPost.dueDate && (
                    <span style={{ color: '#dc2626', fontWeight: '500' }}>
                      마감일: {new Date(selectedPost.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ 
                minHeight: '200px',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6'
              }}>
                {selectedPost.content}
              </div>

              {userRole === 'teacher' && selectedPost.teacherId === userId && (
                <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => deletePost(selectedPost.id)}
                    className="btn btn-danger"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 게시물 작성 모달 */}
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
          <div className="card" style={{ width: '600px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="card-header">
              <div className="card-title">새 게시물 작성</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                    구분 *
                  </label>
                  <select
                    value={newPost.type}
                    onChange={(e) => setNewPost({ ...newPost, type: e.target.value as Post['type'] })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  >
                    <option value="notice">공지사항</option>
                    <option value="assignment">과제</option>
                    <option value="material">학습자료</option>
                    <option value="objective">학습목표</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="제목을 입력하세요"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                    내용 *
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="내용을 입력하세요"
                    rows={10}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {newPost.type === 'assignment' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                      마감일
                    </label>
                    <input
                      type="date"
                      value={newPost.dueDate}
                      onChange={(e) => setNewPost({ ...newPost, dueDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem'
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={newPost.important}
                      onChange={(e) => setNewPost({ ...newPost, important: e.target.checked })}
                    />
                    <span>중요 게시물로 설정 (상단 고정)</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button onClick={createPost} className="btn btn-primary" style={{ flex: 1 }}>
                  등록
                </button>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPost({
                      title: '',
                      content: '',
                      type: 'notice',
                      dueDate: '',
                      important: false
                    });
                  }} 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
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

export default ClassBulletinBoard;