import React, { useState, useEffect } from 'react';
import { loadLectures, saveLectures, getNextLectureId, loadSubjects, saveSubjects, generateId } from '../../utils/dataStorage';

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
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  materials: string[];
  contentBlocks: ContentBlock[];
  assignedClasses: number[];
  createdAt: string;
  isPublished: boolean;
  teacherId: number;
  teacherName: string;
  assignedTeachers?: { id: number; name: string }[]; // 여러 교사 배정 가능
}

interface Teacher {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

interface Class {
  id: number;
  name: string;
  grade: string;
  subject: string;
}

interface AllLecturesViewProps {
  onBack: () => void;
}

interface AdminLectureActions {
  togglePublished: (lectureId: number) => void;
  deleteLecture: (lectureId: number) => void;
}

const AllLecturesView: React.FC<AllLecturesViewProps> = ({ onBack }) => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filterTeacher, setFilterTeacher] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterPublished, setFilterPublished] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [assigningLecture, setAssigningLecture] = useState<Lecture | null>(null);
  const [showClassAssignModal, setShowClassAssignModal] = useState<boolean>(false);
  const [classAssigningLecture, setClassAssigningLecture] = useState<Lecture | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'by-subject'>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [newSubjectDescription, setNewSubjectDescription] = useState<string>('');
  
  // 강의 생성 폼 상태
  const [newLecture, setNewLecture] = useState({
    title: '',
    subject: '',
    description: '',
    duration: 60,
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    teacherId: '',
    materials: [''],
    contentBlocks: [] as ContentBlock[]
  });
  
  // 콘텐츠 블록 추가용 상태
  const [newContentBlock, setNewContentBlock] = useState<Partial<ContentBlock>>({
    type: 'video',
    title: '',
    url: '',
    description: ''
  });

  useEffect(() => {
    loadAllLectures();
    loadTeachers();
    loadClasses();
    setSubjects(loadSubjects());
    
    // localStorage 변경사항을 실시간으로 반영
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'studylink_lectures') {
        loadAllLectures();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 같은 탭 내에서의 변경사항도 감지하기 위해 커스텀 이벤트 리스너 추가
    const handleLocalStorageChange = () => {
      loadAllLectures();
    };
    
    window.addEventListener('localStorageChanged', handleLocalStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChanged', handleLocalStorageChange);
    };
  }, []);

  const loadClasses = () => {
    const savedClasses = localStorage.getItem('classes') || localStorage.getItem('studylink_classes');
    if (savedClasses) {
      setClasses(JSON.parse(savedClasses));
    }
  };

  const loadAllLectures = () => {
    // localStorage에서 모든 강의 데이터 로드
    const allLectures = loadLectures();
    setLectures(allLectures);
  };

  const loadTeachers = () => {
    // 임시 교사 데이터
    const mockTeachers: Teacher[] = [
      { id: 1, name: '김선생' },
      { id: 2, name: '이선생' },
      { id: 3, name: '박선생' }
    ];
    setTeachers(mockTeachers);
  };

  const filteredLectures = lectures.filter(lecture => {
    const matchesTeacher = filterTeacher === '' || lecture.teacherId.toString() === filterTeacher;
    const matchesSubject = filterSubject === '' || lecture.subject === filterSubject;
    const matchesPublished = filterPublished === '' || 
      (filterPublished === 'published' && lecture.isPublished) ||
      (filterPublished === 'draft' && !lecture.isPublished);
    
    return matchesTeacher && matchesSubject && matchesPublished;
  });

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

  // 과목별로 강의 그룹화
  const lecturesBySubject = filteredLectures.reduce((acc, lecture) => {
    const subject = lecture.subject || '기타';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(lecture);
    return acc;
  }, {} as Record<string, Lecture[]>);
  
  const togglePublished = (lectureId: number) => {
    const allLectures = loadLectures();
    const updatedLectures = allLectures.map(lecture => 
      lecture.id === lectureId 
        ? { ...lecture, isPublished: !lecture.isPublished }
        : lecture
    );
    saveLectures(updatedLectures);
    setLectures(updatedLectures);
    
    const lecture = updatedLectures.find(l => l.id === lectureId);
    alert(`${lecture?.title} 강의가 ${lecture?.isPublished ? '게시' : '비공개'}되었습니다.`);
  };

  const deleteLecture = (lectureId: number) => {
    const lecture = lectures.find(l => l.id === lectureId);
    if (!lecture) return;
    
    if (!confirm(`${lecture.title} 강의를 정말 삭제하시겠습니까?`)) {
      return;
    }
    
    const allLectures = loadLectures();
    const updatedLectures = allLectures.filter(l => l.id !== lectureId);
    saveLectures(updatedLectures);
    setLectures(updatedLectures);
    
    alert(`${lecture.title} 강의가 삭제되었습니다.`);
  };
  
  const handleCreateLecture = () => {
    if (!newLecture.title.trim() || !newLecture.subject.trim() || !newLecture.teacherId) {
      alert('필수 필드를 모두 입력해주세요.');
      return;
    }
    
    const teacher = teachers.find(t => t.id.toString() === newLecture.teacherId);
    if (!teacher) {
      alert('교사를 선택해주세요.');
      return;
    }
    
    const allLectures = loadLectures();
    const lecture: Lecture = {
      id: getNextLectureId(),
      title: newLecture.title.trim(),
      subject: newLecture.subject.trim(),
      description: newLecture.description.trim(),
      duration: newLecture.duration,
      difficulty: newLecture.difficulty,
      materials: newLecture.materials.filter(m => m.trim() !== ''),
      contentBlocks: newLecture.contentBlocks,
      assignedClasses: [],
      createdAt: new Date().toISOString().split('T')[0],
      isPublished: false,
      teacherId: parseInt(newLecture.teacherId),
      teacherName: teacher.name
    };
    
    const updatedLectures = [...allLectures, lecture];
    saveLectures(updatedLectures);
    setLectures(updatedLectures);
    
    // 폼 초기화
    setNewLecture({
      title: '',
      subject: '',
      description: '',
      duration: 60,
      difficulty: 'beginner',
      teacherId: '',
      materials: [''],
      contentBlocks: []
    });
    setShowCreateModal(false);
    
    alert(`${lecture.title} 강의가 생성되었습니다.`);
  };
  
  const addMaterial = () => {
    setNewLecture({
      ...newLecture,
      materials: [...newLecture.materials, '']
    });
  };
  
  const updateMaterial = (index: number, value: string) => {
    const updatedMaterials = [...newLecture.materials];
    updatedMaterials[index] = value;
    setNewLecture({
      ...newLecture,
      materials: updatedMaterials
    });
  };
  
  const removeMaterial = (index: number) => {
    const updatedMaterials = newLecture.materials.filter((_, i) => i !== index);
    setNewLecture({
      ...newLecture,
      materials: updatedMaterials.length > 0 ? updatedMaterials : ['']
    });
  };
  
  const handleAssignTeacher = (lecture: Lecture) => {
    setAssigningLecture(lecture);
    setShowAssignModal(true);
  };
  
  const handleAssignClass = (lecture: Lecture) => {
    setClassAssigningLecture(lecture);
    setSelectedClassIds(lecture.assignedClasses || []);
    setShowClassAssignModal(true);
  };
  
  const handleCreateSubject = () => {
    if (!newSubjectName.trim()) {
      alert('과목명을 입력해주세요.');
      return;
    }
    
    const newSubject: Subject = {
      id: generateId(),
      name: newSubjectName.trim(),
      description: newSubjectDescription.trim(),
      createdAt: new Date().toISOString()
    };
    
    const updatedSubjects = [...subjects, newSubject];
    saveSubjects(updatedSubjects);
    setSubjects(updatedSubjects);
    
    setNewSubjectName('');
    setNewSubjectDescription('');
    setShowSubjectModal(false);
    alert(`${newSubject.name} 과목이 추가되었습니다.`);
  };
  
  const handleDeleteSubject = (subjectId: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    // 해당 과목을 사용하는 강의가 있는지 확인
    const lecturesUsingSubject = lectures.filter(l => l.subject === subject.name);
    if (lecturesUsingSubject.length > 0) {
      alert(`${subject.name} 과목을 사용하는 강의가 ${lecturesUsingSubject.length}개 있어 삭제할 수 없습니다.`);
      return;
    }
    
    if (!confirm(`${subject.name} 과목을 삭제하시겠습니까?`)) {
      return;
    }
    
    const updatedSubjects = subjects.filter(s => s.id !== subjectId);
    saveSubjects(updatedSubjects);
    setSubjects(updatedSubjects);
    alert(`${subject.name} 과목이 삭제되었습니다.`);
  };
  
  const assignTeacherToLecture = (teacherId: number) => {
    if (!assigningLecture) return;
    
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    
    const allLectures = loadLectures();
    const updatedLectures = allLectures.map(lecture => 
      lecture.id === assigningLecture.id 
        ? { ...lecture, teacherId: teacherId, teacherName: teacher.name }
        : lecture
    );
    saveLectures(updatedLectures);
    setLectures(updatedLectures);
    
    setShowAssignModal(false);
    setAssigningLecture(null);
    alert(`${assigningLecture.title} 강의가 ${teacher.name}님에게 배정되었습니다.`);
  };
  
  const handleEditLecture = (lecture: Lecture) => {
    setEditingLecture({ ...lecture });
    setShowEditModal(true);
  };
  
  const handleUpdateLecture = () => {
    if (!editingLecture) return;
    
    const allLectures = loadLectures();
    const updatedLectures = allLectures.map(lecture => 
      lecture.id === editingLecture.id ? editingLecture : lecture
    );
    saveLectures(updatedLectures);
    setLectures(updatedLectures);
    
    setShowEditModal(false);
    setEditingLecture(null);
    alert(`${editingLecture.title} 강의가 수정되었습니다.`);
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

  const updateContentBlockInEdit = (blockId: string, updatedBlock: Partial<ContentBlock>) => {
    if (!editingLecture) return;
    
    setEditingLecture({
      ...editingLecture,
      contentBlocks: editingLecture.contentBlocks.map(block =>
        block.id === blockId ? { ...block, ...updatedBlock } : block
      )
    });
  };
  
  const updateEditMaterial = (index: number, value: string) => {
    if (!editingLecture) return;
    const updatedMaterials = [...editingLecture.materials];
    updatedMaterials[index] = value;
    setEditingLecture({
      ...editingLecture,
      materials: updatedMaterials
    });
  };
  
  const addEditMaterial = () => {
    if (!editingLecture) return;
    setEditingLecture({
      ...editingLecture,
      materials: [...editingLecture.materials, '']
    });
  };
  
  const removeEditMaterial = (index: number) => {
    if (!editingLecture) return;
    const updatedMaterials = editingLecture.materials.filter((_, i) => i !== index);
    setEditingLecture({
      ...editingLecture,
      materials: updatedMaterials.length > 0 ? updatedMaterials : ['']
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            📚 전체 강의 관리
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ color: '#6b7280', fontSize: '1rem' }}>
            총 {filteredLectures.length}개 강의
          </div>
          <button 
            onClick={() => setViewMode(viewMode === 'all' ? 'by-subject' : 'all')}
            className="btn btn-secondary"
          >
            {viewMode === 'all' ? '📚 과목별 보기' : '📋 전체 보기'}
          </button>
          <button 
            onClick={() => setShowSubjectModal(true)}
            className="btn btn-secondary"
            style={{ background: '#7c3aed', borderColor: '#7c3aed', color: 'white' }}
          >
            📚 과목 관리
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            ➕ 새 강의 생성
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                교사 필터
              </label>
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">전체 교사</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id.toString()}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                과목 필터
              </label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">전체 과목</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                상태 필터
              </label>
              <select
                value={filterPublished}
                onChange={(e) => setFilterPublished(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">전체 상태</option>
                <option value="published">게시됨</option>
                <option value="draft">비공개</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 강의 목록 */}
      {viewMode === 'all' ? (
        <div className="grid grid-1" style={{ gap: '1.5rem' }}>
          {filteredLectures.map((lecture) => (
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <span style={{
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      👨‍🏫 원담당: {lecture.teacherName}
                    </span>
                    {lecture.assignedTeachers && lecture.assignedTeachers.length > 0 && (
                      <>
                        {lecture.assignedTeachers.map(teacher => (
                          <span key={teacher.id} style={{
                            background: '#dcfce7',
                            color: '#16a34a',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            👩‍🏫 {teacher.name}
                          </span>
                        ))}
                      </>
                    )}
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
                        onClick={() => handleAssignClass(lecture)}
                        className="btn btn-primary"
                        style={{ 
                          fontSize: '0.875rem',
                          background: '#10b981',
                          borderColor: '#10b981'
                        }}
                      >
                        🏫 반 배정
                      </button>
                      <button 
                        onClick={() => handleAssignTeacher(lecture)}
                        className="btn btn-primary"
                        style={{ 
                          fontSize: '0.875rem',
                          background: '#7c3aed',
                          borderColor: '#7c3aed'
                        }}
                      >
                        👨‍🏫 교사 배정
                      </button>
                      <button 
                        onClick={() => handleEditLecture(lecture)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.875rem' }}
                      >
                        ✏️ 편집
                      </button>
                      <button 
                        onClick={() => togglePublished(lecture.id)}
                        className={lecture.isPublished ? "btn btn-secondary" : "btn btn-primary"}
                        style={{ fontSize: '0.875rem' }}
                      >
                        {lecture.isPublished ? '📝 비공개로' : '📢 게시하기'}
                      </button>
                      <button 
                        onClick={() => deleteLecture(lecture.id)}
                        className="btn"
                        style={{ 
                          fontSize: '0.875rem',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fecaca'
                        }}
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      ) : (
        // 과목별 보기
        <div>
          {Object.entries(lecturesBySubject).map(([subject, lectures]) => (
            <div key={subject} style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#1f2937', 
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#f3f4f6',
                borderRadius: '0.5rem'
              }}>
                📚 {subject} ({lectures.length}개 강의)
              </h3>
              <div className="grid grid-1" style={{ gap: '1rem' }}>
                {lectures.map((lecture) => (
                  <div key={lecture.id} className="card">
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                              {lecture.title}
                            </h4>
                            <span style={{
                              background: lecture.isPublished ? '#dcfce7' : '#fef3c7',
                              color: lecture.isPublished ? '#16a34a' : '#d97706',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              {lecture.isPublished ? '게시됨' : '비공개'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{
                              color: '#1e40af',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}>
                              👨‍🏫 원담당: {lecture.teacherName}
                            </span>
                            {lecture.assignedTeachers && lecture.assignedTeachers.length > 0 && (
                              <>
                                {lecture.assignedTeachers.map(teacher => (
                                  <span key={teacher.id} style={{
                                    color: '#16a34a',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                  }}>
                                    • {teacher.name}
                                  </span>
                                ))}
                              </>
                            )}
                            <span style={{
                              background: getDifficultyColor(lecture.difficulty) + '20',
                              color: getDifficultyColor(lecture.difficulty),
                              padding: '0.25rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem'
                            }}>
                              {getDifficultyLabel(lecture.difficulty)}
                            </span>
                            <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                              ⏱️ {lecture.duration}분
                            </span>
                          </div>

                          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                            {lecture.description}
                          </p>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button 
                              onClick={() => handleAssignClass(lecture)}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                            >
                              🏫 반 배정
                            </button>
                            <button 
                              onClick={() => handleAssignTeacher(lecture)}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                            >
                              👨‍🏫 교사 배정
                            </button>
                            <button 
                              onClick={() => handleEditLecture(lecture)}
                              className="btn btn-primary"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                            >
                              ✏️ 수정
                            </button>
                            <button 
                              onClick={() => handleTogglePublish(lecture)}
                              className="btn btn-secondary"
                              style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.25rem 0.75rem',
                                background: lecture.isPublished ? '#dc2626' : '#16a34a',
                                borderColor: lecture.isPublished ? '#dc2626' : '#16a34a',
                                color: 'white'
                              }}
                            >
                              {lecture.isPublished ? '🚫 비공개' : '✅ 게시'}
                            </button>
                            <button 
                              onClick={() => handleDeleteLecture(lecture)}
                              className="btn btn-secondary"
                              style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.25rem 0.75rem',
                                background: '#dc2626',
                                borderColor: '#dc2626',
                                color: 'white'
                              }}
                            >
                              🗑️ 삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredLectures.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
          <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
            {filterTeacher || filterSubject || filterPublished 
              ? '조건에 맞는 강의가 없습니다.' 
              : '아직 생성된 강의가 없습니다.'
            }
          </p>
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
          <div className="card" style={{ width: '800px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="card-header">
              <div className="card-title">
                ➕ 새 강의 생성
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    강의 제목 *
                  </label>
                  <input
                    type="text"
                    value={newLecture.title}
                    onChange={(e) => setNewLecture({...newLecture, title: e.target.value})}
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
                    onChange={(e) => setNewLecture({...newLecture, subject: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  >
                    <option value="">과목을 선택하세요</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.name}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  강의 설명
                </label>
                <textarea
                  value={newLecture.description}
                  onChange={(e) => setNewLecture({...newLecture, description: e.target.value})}
                  placeholder="강의 내용을 설명해주세요"
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    담당 교사 *
                  </label>
                  <select
                    value={newLecture.teacherId}
                    onChange={(e) => setNewLecture({...newLecture, teacherId: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  >
                    <option value="">교사 선택</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id.toString()}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    난이도
                  </label>
                  <select
                    value={newLecture.difficulty}
                    onChange={(e) => setNewLecture({...newLecture, difficulty: e.target.value as any})}
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
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    예상 소요시간 (분)
                  </label>
                  <input
                    type="number"
                    value={newLecture.duration}
                    onChange={(e) => setNewLecture({...newLecture, duration: parseInt(e.target.value) || 0})}
                    min="1"
                    max="300"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  필요 자료
                </label>
                {newLecture.materials.map((material, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => updateMaterial(index, e.target.value)}
                      placeholder={`자료 ${index + 1}`}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem'
                      }}
                    />
                    {newLecture.materials.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMaterial(index)}
                        style={{
                          padding: '0.5rem',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: '0.375rem'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMaterial}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  + 자료 추가
                </button>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowCreateModal(false)}
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
          <div className="card" style={{ width: '900px', maxWidth: '95%', maxHeight: '95vh', overflow: 'auto' }}>
            <div className="card-header">
              <div className="card-title">
                ✏️ 강의 편집: {editingLecture.title}
              </div>
            </div>
            <div className="card-body">
              {/* 기본 정보 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    강의 제목 *
                  </label>
                  <input
                    type="text"
                    value={editingLecture.title}
                    onChange={(e) => setEditingLecture({...editingLecture, title: e.target.value})}
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
                    과목
                  </label>
                  <input
                    type="text"
                    value={editingLecture.subject}
                    onChange={(e) => setEditingLecture({...editingLecture, subject: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  강의 설명
                </label>
                <textarea
                  value={editingLecture.description}
                  onChange={(e) => setEditingLecture({...editingLecture, description: e.target.value})}
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    난이도
                  </label>
                  <select
                    value={editingLecture.difficulty}
                    onChange={(e) => setEditingLecture({...editingLecture, difficulty: e.target.value as any})}
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
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    예상 소요시간 (분)
                  </label>
                  <input
                    type="number"
                    value={editingLecture.duration}
                    onChange={(e) => setEditingLecture({...editingLecture, duration: parseInt(e.target.value) || 0})}
                    min="1"
                    max="300"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>
              </div>
              
              {/* 필요 자료 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  필요 자료
                </label>
                {editingLecture.materials.map((material, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => updateEditMaterial(index, e.target.value)}
                      placeholder={`자료 ${index + 1}`}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem'
                      }}
                    />
                    {editingLecture.materials.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEditMaterial(index)}
                        style={{
                          padding: '0.5rem',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: '0.375rem'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEditMaterial}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  + 자료 추가
                </button>
              </div>
              
              {/* 콘텐츠 블록 관리 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  콘텐츠 블록 ({editingLecture.contentBlocks.length}/7)
                </label>

                {/* 기존 콘텐츠 블록 목록 */}
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
                            onChange={(e) => updateContentBlockInEdit(block.id, { type: e.target.value as any })}
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
                          onChange={(e) => updateContentBlockInEdit(block.id, { title: e.target.value })}
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
                          onChange={(e) => updateContentBlockInEdit(block.id, { url: e.target.value })}
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
                          onChange={(e) => updateContentBlockInEdit(block.id, { description: e.target.value })}
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
                    padding: '1.5rem',
                    border: '2px dashed #10b981',
                    borderRadius: '0.5rem',
                    background: '#f0fdfa',
                    marginTop: '1rem'
                  }}>
                    <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600', color: '#047857' }}>
                      ➕ 새 콘텐츠 블록 추가하기
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                      모든 필드를 입력한 후 "블록 추가" 버튼을 클릭하세요.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <select
                        value={newContentBlock.type}
                        onChange={(e) => setNewContentBlock({...newContentBlock, type: e.target.value as any})}
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
                        placeholder="블록 제목"
                        value={newContentBlock.title || ''}
                        onChange={(e) => setNewContentBlock({...newContentBlock, title: e.target.value})}
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
                        value={newContentBlock.url || ''}
                        onChange={(e) => setNewContentBlock({...newContentBlock, url: e.target.value})}
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
                        onChange={(e) => setNewContentBlock({...newContentBlock, description: e.target.value})}
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
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        블록 추가
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingLecture(null);
                  }}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button 
                  onClick={handleUpdateLecture}
                  className="btn btn-primary"
                >
                  강의 수정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 과목 관리 모달 */}
      {showSubjectModal && (
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
          <div className="card" style={{ width: '600px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="card-header">
              <div className="card-title">
                📚 과목 관리
              </div>
            </div>
            <div className="card-body">
              {/* 새 과목 추가 */}
              <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                  새 과목 추가
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="과목명"
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem'
                    }}
                  />
                  <button
                    onClick={handleCreateSubject}
                    className="btn btn-primary"
                    style={{ fontSize: '0.875rem' }}
                  >
                    추가
                  </button>
                </div>
                <input
                  type="text"
                  value={newSubjectDescription}
                  onChange={(e) => setNewSubjectDescription(e.target.value)}
                  placeholder="과목 설명 (선택사항)"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>

              {/* 과목 목록 */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                  등록된 과목 ({subjects.length}개)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {subjects.map(subject => {
                    const lectureCount = lectures.filter(l => l.subject === subject.name).length;
                    return (
                      <div key={subject.id} style={{
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                            {subject.name}
                          </p>
                          {subject.description && (
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                              {subject.description}
                            </p>
                          )}
                          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            강의 {lectureCount}개
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteSubject(subject.id)}
                          className="btn btn-secondary"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            background: '#dc2626',
                            borderColor: '#dc2626',
                            color: 'white'
                          }}
                          disabled={lectureCount > 0}
                        >
                          삭제
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  onClick={() => {
                    setShowSubjectModal(false);
                    setNewSubjectName('');
                    setNewSubjectDescription('');
                  }}
                  className="btn btn-secondary"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 교사 배정 모달 */}
      {showAssignModal && assigningLecture && (
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
              <div className="card-title">
                👨‍🏫 교사 배정
              </div>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {assigningLecture.title}
                </h4>
                <div style={{ marginBottom: '0.5rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    원담당: {assigningLecture.teacherName}
                  </p>
                </div>
                {assigningLecture.assignedTeachers && assigningLecture.assignedTeachers.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                      현재 배정된 교사:
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {assigningLecture.assignedTeachers.map(teacher => (
                        <span key={teacher.id} style={{
                          background: '#dcfce7',
                          color: '#16a34a',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {teacher.name}
                          <button
                            onClick={() => {
                              const updatedTeachers = assigningLecture.assignedTeachers?.filter(t => t.id !== teacher.id) || [];
                              const updatedLectures = lectures.map(lecture =>
                                lecture.id === assigningLecture.id
                                  ? { ...lecture, assignedTeachers: updatedTeachers }
                                  : lecture
                              );
                              saveLectures(updatedLectures);
                              setLectures(updatedLectures);
                              setAssigningLecture({ ...assigningLecture, assignedTeachers: updatedTeachers });
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                              padding: '0',
                              fontSize: '0.875rem'
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  추가할 교사 선택
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">교사를 선택하세요</option>
                  {teachers
                    .filter(teacher => 
                      teacher.id !== assigningLecture.teacherId && 
                      !assigningLecture.assignedTeachers?.some(t => t.id === teacher.id)
                    )
                    .map(teacher => (
                      <option key={teacher.id} value={teacher.id.toString()}>
                        {teacher.name}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssigningLecture(null);
                    setSelectedTeacherId('');
                  }}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button 
                  onClick={() => {
                    if (!selectedTeacherId) {
                      alert('교사를 선택해주세요.');
                      return;
                    }
                    
                    const teacher = teachers.find(t => t.id === parseInt(selectedTeacherId));
                    if (!teacher) return;
                    
                    const currentAssignedTeachers = assigningLecture.assignedTeachers || [];
                    const newAssignedTeachers = [...currentAssignedTeachers, { id: teacher.id, name: teacher.name }];
                    
                    const updatedLectures = lectures.map(lecture =>
                      lecture.id === assigningLecture.id
                        ? { 
                            ...lecture, 
                            assignedTeachers: newAssignedTeachers
                          }
                        : lecture
                    );
                    
                    saveLectures(updatedLectures);
                    setLectures(updatedLectures);
                    setAssigningLecture({ ...assigningLecture, assignedTeachers: newAssignedTeachers });
                    setSelectedTeacherId('');
                    alert(`${teacher.name}님이 ${assigningLecture.title} 강의에 추가 배정되었습니다.`);
                  }}
                  className="btn btn-primary"
                  disabled={!selectedTeacherId}
                >
                  교사 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 반 배정 모달 */}
      {showClassAssignModal && classAssigningLecture && (
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
              <div className="card-title">
                🏫 반 배정
              </div>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {classAssigningLecture.title}
                </h4>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  현재 {classAssigningLecture.assignedClasses?.length || 0}개 반에 배정됨
                </p>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    배정할 반 선택 (여러 개 선택 가능)
                  </label>
                  <div style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem', 
                    padding: '0.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {classes.map(cls => (
                      <label key={cls.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClassIds([...selectedClassIds, cls.id]);
                            } else {
                              setSelectedClassIds(selectedClassIds.filter(id => id !== cls.id));
                            }
                          }}
                          style={{ marginRight: '0.5rem' }}
                        />
                        <span>
                          {cls.name} ({cls.subject})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => {
                    setShowClassAssignModal(false);
                    setClassAssigningLecture(null);
                    setSelectedClassIds([]);
                  }}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button 
                  onClick={() => {
                    const updatedLectures = lectures.map(lecture =>
                      lecture.id === classAssigningLecture.id
                        ? { ...lecture, assignedClasses: selectedClassIds }
                        : lecture
                    );
                    
                    saveLectures(updatedLectures);
                    setLectures(updatedLectures);
                    setShowClassAssignModal(false);
                    setClassAssigningLecture(null);
                    setSelectedClassIds([]);
                    alert(`강의가 ${selectedClassIds.length}개 반에 배정되었습니다.`);
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
    </div>
  );
};

export default AllLecturesView;