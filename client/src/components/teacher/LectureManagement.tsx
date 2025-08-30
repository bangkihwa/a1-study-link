import React, { useState, useEffect } from 'react';
import { saveLectures, loadLectures, getNextLectureId } from '../../utils/dataStorage';

interface ContentBlock {
  id: string;
  type: 'video' | 'code' | 'test' | 'mindmap' | 'document' | 'quiz' | 'image';
  title: string;
  url: string;
  description?: string;
}

interface Lecture {
  id: number;
  title: string;
  subject: string;
  description: string;
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  materials: string[];
  contentBlocks: ContentBlock[];
  assignedClasses: number[];
  createdAt: string;
  isPublished: boolean;
}

interface Class {
  id: number;
  name: string;
  subject: string;
  studentCount: number;
}

interface LectureManagementProps {
  onBack: () => void;
  teacherId: number;
}

const LectureManagement: React.FC<LectureManagementProps> = ({ onBack, teacherId }) => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'assign'>('list');
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [newLecture, setNewLecture] = useState<Partial<Lecture>>({
    title: '',
    subject: '',
    description: '',
    duration: 60,
    difficulty: 'beginner',
    materials: [],
    contentBlocks: [],
    assignedClasses: [],
    isPublished: false
  });
  const [newContentBlock, setNewContentBlock] = useState<Partial<ContentBlock>>({
    type: 'video',
    title: '',
    url: '',
    description: ''
  });
  const [newMaterial, setNewMaterial] = useState<string>('');

  const addContentBlock = () => {
    console.log('addContentBlock called with:', newContentBlock);
    
    if (!newContentBlock.title || !newContentBlock.url) {
      alert('콘텐츠 블록 제목과 URL을 입력해주세요.');
      return;
    }

    if ((newLecture.contentBlocks || []).length >= 7) {
      alert('최대 7개까지 콘텐츠 블록을 추가할 수 있습니다.');
      return;
    }

    const block: ContentBlock = {
      id: Date.now().toString(),
      type: newContentBlock.type || 'video',
      title: newContentBlock.title,
      url: newContentBlock.url,
      description: newContentBlock.description || ''
    };
    
    console.log('Creating new block:', block);

    const updatedLecture = {
      ...newLecture,
      contentBlocks: [...(newLecture.contentBlocks || []), block]
    };
    
    console.log('Updated lecture contentBlocks:', updatedLecture.contentBlocks);
    
    setNewLecture(updatedLecture);

    // 폼 초기화
    setNewContentBlock({
      type: 'video',
      title: '',
      url: '',
      description: ''
    });
    
    console.log('newContentBlock reset to:', { type: 'video', title: '', url: '', description: '' });
  };

  const removeContentBlock = (blockId: string) => {
    setNewLecture({
      ...newLecture,
      contentBlocks: (newLecture.contentBlocks || []).filter(block => block.id !== blockId)
    });
  };

  const getBlockTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return '🎥 동영상';
      case 'code': return '💻 코드';
      case 'test': return '📝 테스트';
      case 'mindmap': return '🗺️ 마인드맵';
      case 'document': return '📄 문서';
      case 'quiz': return '❓ 퀴즈';
      case 'image': return '🖼️ 이미지';
      default: return type;
    }
  };

  const handleEditLecture = (lecture: Lecture) => {
    setEditingLecture({ ...lecture });
    setShowEditModal(true);
  };

  const handleUpdateLecture = () => {
    if (!editingLecture) return;
    
    // 전체 강의 목록 가져오기
    const allLectures = loadLectures();
    
    // 전체 목록에서 해당 강의 수정
    const updatedAllLectures = allLectures.map(lecture => 
      lecture.id === editingLecture.id ? editingLecture : lecture
    );
    saveLectures(updatedAllLectures);
    
    // 현재 교사의 강의 목록 업데이트
    const myLectures = updatedAllLectures.filter(l => l.teacherId === teacherId);
    setLectures(myLectures);
    
    setShowEditModal(false);
    setEditingLecture(null);
    alert('강의가 성공적으로 수정되었습니다!');
  };

  const addContentBlockToEdit = () => {
    if (!newContentBlock.title || !newContentBlock.url || !editingLecture) {
      alert('콘텐츠 블록 제목과 URL을 입력해주세요.');
      return;
    }

    if (editingLecture.contentBlocks.length >= 7) {
      alert('최대 7개까지 콘텐츠 블록을 추가할 수 있습니다.');
      return;
    }

    const block: ContentBlock = {
      id: Date.now().toString(),
      type: newContentBlock.type!,
      title: newContentBlock.title!,
      url: newContentBlock.url!,
      description: newContentBlock.description || ''
    };

    setEditingLecture({
      ...editingLecture,
      contentBlocks: [...editingLecture.contentBlocks, block]
    });

    setNewContentBlock({
      type: 'video',
      title: '',
      url: '',
      description: ''
    });
  };

  const removeContentBlockFromEdit = (blockId: string) => {
    if (!editingLecture) return;
    
    setEditingLecture({
      ...editingLecture,
      contentBlocks: editingLecture.contentBlocks.filter(block => block.id !== blockId)
    });
  };

  const updateContentBlock = (blockId: string, updatedBlock: Partial<ContentBlock>) => {
    if (!editingLecture) return;
    
    setEditingLecture({
      ...editingLecture,
      contentBlocks: editingLecture.contentBlocks.map(block =>
        block.id === blockId ? { ...block, ...updatedBlock } : block
      )
    });
  };

  useEffect(() => {
    loadMyLectures();
    loadTeacherClasses();
    
    // localStorage 변경사항을 실시간으로 반영
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'studylink_lectures') {
        loadMyLectures();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 같은 탭 내에서의 변경사항도 감지하기 위해 커스텀 이벤트 리스너 추가
    const handleLocalStorageChange = () => {
      loadMyLectures();
    };
    
    window.addEventListener('localStorageChanged', handleLocalStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChanged', handleLocalStorageChange);
    };
  }, [teacherId]);

  const loadMyLectures = () => {
    const allLectures = loadLectures();
    // 현재 교사의 강의만 필터링
    const myLectures = allLectures.filter(lecture => lecture.teacherId === teacherId);
    setLectures(myLectures);
  };

  const loadTeacherClasses = () => {
    // 임시 데이터
    const mockClasses: Class[] = [
      { id: 1, name: '중등3 물리A반', subject: '물리', studentCount: 8 },
      { id: 2, name: '중등2 화학B반', subject: '화학', studentCount: 12 },
      { id: 3, name: '중등1 통합과학', subject: '통합과학', studentCount: 5 }
    ];
    setClasses(mockClasses);
  };

  const handleCreateLecture = () => {
    if (!newLecture.title || !newLecture.subject || !newLecture.description) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    // 전체 강의 목록 가져오기
    const allLectures = loadLectures();
    
    // 현재 로그인한 사용자 정보 가져오기
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const lecture: Lecture = {
      id: getNextLectureId(),
      title: newLecture.title!,
      subject: newLecture.subject!,
      description: newLecture.description!,
      duration: newLecture.duration || 60,
      difficulty: newLecture.difficulty || 'beginner',
      materials: newLecture.materials || [],
      contentBlocks: newLecture.contentBlocks || [],
      assignedClasses: [],
      createdAt: new Date().toISOString().split('T')[0],
      isPublished: false,
      teacherId: teacherId,
      teacherName: currentUser.name || '선생님'
    };

    // 전체 강의 목록에 새 강의 추가
    const updatedAllLectures = [...allLectures, lecture];
    saveLectures(updatedAllLectures);
    
    // 현재 교사의 강의 목록 업데이트
    const myLectures = updatedAllLectures.filter(l => l.teacherId === teacherId);
    setLectures(myLectures);
    
    setShowCreateModal(false);
    setNewLecture({
      title: '',
      subject: '',
      description: '',
      duration: 60,
      difficulty: 'beginner',
      materials: [],
      contentBlocks: [],
      assignedClasses: [],
      isPublished: false
    });
    setNewContentBlock({
      type: 'video',
      title: '',
      url: '',
      description: ''
    });
    alert('강의가 성공적으로 생성되었습니다!');
  };

  const handleAssignToClasses = (lectureId: number, classIds: number[]) => {
    const allLectures = loadLectures();
    const updatedAllLectures = allLectures.map(lecture => 
      lecture.id === lectureId 
        ? { ...lecture, assignedClasses: classIds }
        : lecture
    );
    saveLectures(updatedAllLectures);
    
    const myLectures = updatedAllLectures.filter(l => l.teacherId === teacherId);
    setLectures(myLectures);
    
    alert('강의가 선택한 반에 배정되었습니다!');
  };

  const togglePublished = (lectureId: number) => {
    const allLectures = loadLectures();
    const updatedAllLectures = allLectures.map(lecture => 
      lecture.id === lectureId 
        ? { ...lecture, isPublished: !lecture.isPublished }
        : lecture
    );
    saveLectures(updatedAllLectures);
    
    const myLectures = updatedAllLectures.filter(l => l.teacherId === teacherId);
    setLectures(myLectures);
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '기초';
      case 'intermediate': return '중급';
      case 'advanced': return '고급';
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#16a34a';
      case 'intermediate': return '#d97706';
      case 'advanced': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            📚 강의 관리
          </h2>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="btn btn-primary"
          style={{ background: '#16a34a', borderColor: '#16a34a' }}
        >
          + 새 강의 만들기
        </button>
      </div>

      {/* 강의 목록 */}
      <div className="grid grid-1" style={{ gap: '1.5rem' }}>
        {lectures.map((lecture) => (
          <div key={lecture.id} className="card">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                      {lecture.title}
                    </h3>
                    <span style={{
                      background: lecture.isPublished ? '#dcfce7' : '#fef3c7',
                      color: lecture.isPublished ? '#16a34a' : '#d97706',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      {lecture.isPublished ? '게시됨' : '비공개'}
                    </span>
                  </div>

                  <p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
                    {lecture.description}
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <span style={{
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem'
                    }}>
                      {lecture.subject}
                    </span>
                    <span style={{
                      background: getDifficultyColor(lecture.difficulty) + '20',
                      color: getDifficultyColor(lecture.difficulty),
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem'
                    }}>
                      {getDifficultyLabel(lecture.difficulty)}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      ⏱️ {lecture.duration}분
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      👥 {lecture.assignedClasses.length}개 반 배정
                    </span>
                  </div>

                  {lecture.contentBlocks.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        콘텐츠 블록 ({lecture.contentBlocks.length}개):
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {lecture.contentBlocks.map((block) => (
                          <span key={block.id} style={{
                            background: '#f3f4f6',
                            color: '#374151',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem'
                          }}>
                            {getBlockTypeLabel(block.type)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {lecture.materials.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        필요 자료:
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {lecture.materials.map((material, index) => (
                          <span key={index} style={{
                            background: '#f3f4f6',
                            color: '#374151',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem'
                          }}>
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      생성일: {lecture.createdAt}
                    </span>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => handleEditLecture(lecture)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.875rem', background: '#059669', borderColor: '#059669' }}
                      >
                        ✏️ 편집
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedLecture(lecture);
                          setCurrentView('assign');
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.875rem' }}
                      >
                        🏫 반 배정
                      </button>
                      <button 
                        onClick={() => togglePublished(lecture.id)}
                        className={`btn ${lecture.isPublished ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ fontSize: '0.875rem' }}
                      >
                        {lecture.isPublished ? '비공개하기' : '게시하기'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {lectures.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
          <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>아직 생성된 강의가 없습니다.</p>
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="btn btn-primary"
          >
            첫 번째 강의 만들기
          </button>
        </div>
      )}

      {/* 강의 생성 모달 */}
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
          <div className="card" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="card-header">
              <div className="card-title">새 강의 만들기</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    강의 제목 *
                  </label>
                  <input
                    type="text"
                    value={newLecture.title}
                    onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })}
                    placeholder="강의 제목을 입력하세요"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    과목 *
                  </label>
                  <select
                    value={newLecture.subject}
                    onChange={(e) => setNewLecture({ ...newLecture, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  >
                    <option value="">과목 선택</option>
                    <option value="물리">물리</option>
                    <option value="화학">화학</option>
                    <option value="생물">생물</option>
                    <option value="지구과학">지구과학</option>
                    <option value="통합과학">통합과학</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    설명 *
                  </label>
                  <textarea
                    value={newLecture.description}
                    onChange={(e) => setNewLecture({ ...newLecture, description: e.target.value })}
                    placeholder="강의 내용을 간단히 설명해주세요"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      소요 시간 (분)
                    </label>
                    <input
                      type="number"
                      value={newLecture.duration}
                      onChange={(e) => setNewLecture({ ...newLecture, duration: parseInt(e.target.value) || 60 })}
                      min="15"
                      max="180"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      난이도
                    </label>
                    <select
                      value={newLecture.difficulty}
                      onChange={(e) => setNewLecture({ ...newLecture, difficulty: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem'
                      }}
                    >
                      <option value="beginner">기초</option>
                      <option value="intermediate">중급</option>
                      <option value="advanced">고급</option>
                    </select>
                  </div>
                </div>

                {/* 콘텐츠 블록 관리 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    콘텐츠 블록 ({(newLecture.contentBlocks || []).length}/7)
                  </label>

                  {/* 기존 콘텐츠 블록 목록 */}
                  {(newLecture.contentBlocks || []).length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                        ✅ 추가된 콘텐츠 블록
                      </h4>
                      {newLecture.contentBlocks!.map((block) => (
                        <div key={block.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          marginBottom: '0.5rem'
                        }}>
                          <div>
                            <p style={{ fontWeight: '500', margin: 0, fontSize: '0.875rem' }}>
                              {getBlockTypeLabel(block.type)} - {block.title}
                            </p>
                            <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: 0 }}>
                              {block.url}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeContentBlock(block.id)}
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 새 콘텐츠 블록 추가 */}
                  {(newLecture.contentBlocks || []).length < 7 && (
                    <div style={{
                      border: '2px dashed #10b981',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      background: '#f0fdfa',
                      marginTop: '1rem'
                    }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#047857' }}>
                        ➕ 새 콘텐츠 블록 추가
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                        모든 필드를 입력한 후 "추가" 버튼을 클릭하세요.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <select
                          value={newContentBlock.type || 'video'}
                          onChange={(e) => setNewContentBlock({ ...newContentBlock, type: e.target.value as any })}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          <option value="video">🎥 동영상</option>
                          <option value="code">💻 코드</option>
                          <option value="test">📝 테스트</option>
                          <option value="mindmap">🗺️ 마인드맵</option>
                          <option value="document">📄 문서</option>
                          <option value="quiz">❓ 퀴즈</option>
                          <option value="image">🖼️ 이미지</option>
                        </select>
                        <input
                          type="text"
                          placeholder="블록 제목 (필수)"
                          value={newContentBlock.title || ''}
                          onChange={(e) => setNewContentBlock({ ...newContentBlock, title: e.target.value })}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                        <input
                          type="url"
                          placeholder="URL (필수 - https://...)"
                          value={newContentBlock.url || ''}
                          onChange={(e) => setNewContentBlock({ ...newContentBlock, url: e.target.value })}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}
                        />
                        <input
                          type="text"
                          placeholder="설명 (선택사항)"
                          value={newContentBlock.description || ''}
                          onChange={(e) => setNewContentBlock({ ...newContentBlock, description: e.target.value })}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}
                        />
                        <button
                          type="button"
                          onClick={addContentBlock}
                          className="btn btn-primary"
                          style={{ 
                            fontSize: '0.875rem', 
                            padding: '0.75rem',
                            background: '#16a34a',
                            borderColor: '#16a34a'
                          }}
                        >
                          ➕ 콘텐츠 블록 추가
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem' }}>
                  <button 
                    onClick={() => {
                      setShowCreateModal(false);
                      // 모달 닫을 때 폼 초기화
                      setNewLecture({
                        title: '',
                        subject: '',
                        description: '',
                        duration: 60,
                        difficulty: 'beginner',
                        materials: [],
                        contentBlocks: [],
                        assignedClasses: [],
                        isPublished: false
                      });
                      setNewContentBlock({
                        type: 'video',
                        title: '',
                        url: '',
                        description: ''
                      });
                    }}
                    className="btn btn-secondary"
                  >
                    취소
                  </button>
                  <button 
                    onClick={handleCreateLecture}
                    className="btn btn-primary"
                  >
                    강의 생성
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 반 배정 모달 */}
      {currentView === 'assign' && selectedLecture && (
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
              <div className="card-title">반 배정 - {selectedLecture.title}</div>
            </div>
            <div className="card-body">
              <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
                이 강의를 배정할 반을 선택하세요.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {classes.map((classItem) => (
                  <label key={classItem.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedLecture.assignedClasses.includes(classItem.id)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        const updatedClasses = isChecked
                          ? [...selectedLecture.assignedClasses, classItem.id]
                          : selectedLecture.assignedClasses.filter(id => id !== classItem.id);
                        setSelectedLecture({
                          ...selectedLecture,
                          assignedClasses: updatedClasses
                        });
                      }}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <div>
                      <p style={{ fontWeight: '500', margin: 0 }}>{classItem.name}</p>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                        {classItem.subject} · {classItem.studentCount}명
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => {
                    setCurrentView('list');
                    setSelectedLecture(null);
                  }}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button 
                  onClick={() => {
                    handleAssignToClasses(selectedLecture.id, selectedLecture.assignedClasses);
                    setCurrentView('list');
                    setSelectedLecture(null);
                  }}
                  className="btn btn-primary"
                >
                  배정 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 강의 편집 모달 */}
      {showEditModal && editingLecture && (
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
          <div className="card" style={{ width: '800px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="card-header">
              <div className="card-title">강의 편집 - {editingLecture.title}</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 기본 정보 편집 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    강의 제목 *
                  </label>
                  <input
                    type="text"
                    value={editingLecture.title}
                    onChange={(e) => setEditingLecture({ ...editingLecture, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    설명 *
                  </label>
                  <textarea
                    value={editingLecture.description}
                    onChange={(e) => setEditingLecture({ ...editingLecture, description: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* 필요 자료 관리 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    필요 자료
                  </label>
                  
                  {editingLecture.materials.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      {editingLecture.materials.map((material, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <input
                            type="text"
                            value={material}
                            onChange={(e) => {
                              const newMaterials = [...editingLecture.materials];
                              newMaterials[index] = e.target.value;
                              setEditingLecture({ ...editingLecture, materials: newMaterials });
                            }}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newMaterials = editingLecture.materials.filter((_, i) => i !== index);
                              setEditingLecture({ ...editingLecture, materials: newMaterials });
                            }}
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.875rem',
                              cursor: 'pointer'
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <input
                      type="text"
                      placeholder="새 필요 자료 추가 (예: 교재 3장, 계산기 등)"
                      value={newMaterial}
                      onChange={(e) => setNewMaterial(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newMaterial.trim()) {
                          setEditingLecture({
                            ...editingLecture,
                            materials: [...editingLecture.materials, newMaterial.trim()]
                          });
                          setNewMaterial('');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newMaterial.trim()) {
                          setEditingLecture({
                            ...editingLecture,
                            materials: [...editingLecture.materials, newMaterial.trim()]
                          });
                          setNewMaterial('');
                        }
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      추가
                    </button>
                  </div>
                </div>

                {/* 콘텐츠 블록 관리 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    콘텐츠 블록 ({editingLecture.contentBlocks.length}/7)
                  </label>

                  {/* 기존 콘텐츠 블록 목록 - 편집 가능 */}
                  {editingLecture.contentBlocks.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                        ✏️ 기존 콘텐츠 블록 편집
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                        각 블록의 내용을 직접 수정할 수 있습니다.
                      </p>
                      {editingLecture.contentBlocks.map((block) => (
                        <div key={block.id} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          padding: '1rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          marginBottom: '0.75rem',
                          background: '#f8fafc'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <select
                              value={block.type}
                              onChange={(e) => updateContentBlock(block.id, { type: e.target.value as any })}
                              style={{
                                padding: '0.5rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem'
                              }}
                            >
                              <option value="video">🎥 동영상</option>
                              <option value="code">💻 코드</option>
                              <option value="test">📝 테스트</option>
                              <option value="mindmap">🗺️ 마인드맵</option>
                              <option value="document">📄 문서</option>
                              <option value="quiz">❓ 퀴즈</option>
                              <option value="image">🖼️ 이미지</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeContentBlockFromEdit(block.id)}
                              style={{
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '0.375rem',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.875rem',
                                cursor: 'pointer'
                              }}
                            >
                              삭제
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="블록 제목"
                            value={block.title}
                            onChange={(e) => updateContentBlock(block.id, { title: e.target.value })}
                            style={{
                              padding: '0.5rem',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem'
                            }}
                          />
                          <input
                            type="url"
                            placeholder="URL (https://...)"
                            value={block.url}
                            onChange={(e) => updateContentBlock(block.id, { url: e.target.value })}
                            style={{
                              padding: '0.5rem',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem'
                            }}
                          />
                          <input
                            type="text"
                            placeholder="설명 (선택사항)"
                            value={block.description || ''}
                            onChange={(e) => updateContentBlock(block.id, { description: e.target.value })}
                            style={{
                              padding: '0.5rem',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 새 콘텐츠 블록 추가 */}
                  {editingLecture.contentBlocks.length < 7 && (
                    <div style={{
                      border: '2px dashed #10b981',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      background: '#f0fdfa',
                      marginTop: '1rem'
                    }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#047857' }}>
                        ➕ 새 콘텐츠 블록 추가하기
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                        모든 필드를 입력한 후 "블록 추가하기" 버튼을 클릭하세요.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <select
                          value={newContentBlock.type}
                          onChange={(e) => setNewContentBlock({ ...newContentBlock, type: e.target.value as any })}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          <option value="video">🎥 동영상</option>
                          <option value="code">💻 코드</option>
                          <option value="test">📝 테스트</option>
                          <option value="mindmap">🗺️ 마인드맵</option>
                          <option value="document">📄 문서</option>
                          <option value="quiz">❓ 퀴즈</option>
                          <option value="image">🖼️ 이미지</option>
                        </select>
                        <input
                          type="text"
                          placeholder="블록 제목 (필수)"
                          value={newContentBlock.title || ''}
                          onChange={(e) => setNewContentBlock({ ...newContentBlock, title: e.target.value })}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                        <input
                          type="url"
                          placeholder="URL (필수 - https://...)"
                          value={newContentBlock.url || ''}
                          onChange={(e) => setNewContentBlock({ ...newContentBlock, url: e.target.value })}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}
                        />
                        <input
                          type="text"
                          placeholder="설명 (선택사항)"
                          value={newContentBlock.description || ''}
                          onChange={(e) => setNewContentBlock({ ...newContentBlock, description: e.target.value })}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}
                        />
                        <button
                          type="button"
                          onClick={addContentBlockToEdit}
                          className="btn btn-primary"
                          style={{ 
                            fontSize: '0.875rem', 
                            padding: '0.75rem',
                            background: '#16a34a',
                            borderColor: '#16a34a'
                          }}
                        >
                          ➕ 블록 추가하기
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem' }}>
                  <button 
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingLecture(null);
                      setNewContentBlock({
                        type: 'video',
                        title: '',
                        url: '',
                        description: ''
                      });
                    }}
                    className="btn btn-secondary"
                  >
                    취소
                  </button>
                  <button 
                    onClick={handleUpdateLecture}
                    className="btn btn-primary"
                  >
                    수정 완료
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LectureManagement;