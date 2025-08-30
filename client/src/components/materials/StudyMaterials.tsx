import React, { useState, useEffect } from 'react';

interface Material {
  id: number;
  title: string;
  subject: string;
  grade: string;
  type: 'pdf' | 'video' | 'quiz' | 'exercise';
  description: string;
  fileUrl?: string;
  uploadDate: string;
  teacher: string;
  downloads: number;
}

interface StudyMaterialsProps {
  userRole: 'student' | 'teacher' | 'admin';
}

const StudyMaterials: React.FC<StudyMaterialsProps> = ({ userRole }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // 임시 데이터
  useEffect(() => {
    const mockMaterials: Material[] = [
      {
        id: 1,
        title: '물리학 1단원 - 역학적 에너지',
        subject: '물리학',
        grade: '고1',
        type: 'pdf',
        description: '역학적 에너지 보존 법칙과 관련된 학습 자료입니다.',
        fileUrl: '/materials/physics_1.pdf',
        uploadDate: '2024-08-20',
        teacher: '김인후 선생님',
        downloads: 45
      },
      {
        id: 2,
        title: '화학 반응식 문제풀이',
        subject: '화학',
        grade: '고2',
        type: 'exercise',
        description: '화학 반응식 균형 맞추기 연습 문제입니다.',
        fileUrl: '/materials/chemistry_ex.pdf',
        uploadDate: '2024-08-19',
        teacher: '박진환 선생님',
        downloads: 32
      },
      {
        id: 3,
        title: '지구과학 - 태양계의 구성',
        subject: '지구과학',
        grade: '고1',
        type: 'video',
        description: '태양계 행성들의 특징을 설명하는 동영상 강의입니다.',
        fileUrl: '/materials/earth_science.mp4',
        uploadDate: '2024-08-18',
        teacher: '방기화 선생님',
        downloads: 58
      },
      {
        id: 4,
        title: '생명과학 세포 분열 퀴즈',
        subject: '생명과학',
        grade: '고2',
        type: 'quiz',
        description: '세포 분열 과정을 확인하는 온라인 퀴즈입니다.',
        uploadDate: '2024-08-17',
        teacher: '최재준 선생님',
        downloads: 29
      },
      {
        id: 5,
        title: '통합과학 1학기 중간고사 대비',
        subject: '통합과학',
        grade: '고1',
        type: 'pdf',
        description: '1학기 중간고사 범위 총정리 자료입니다.',
        fileUrl: '/materials/integrated_science.pdf',
        uploadDate: '2024-08-16',
        teacher: '김인후 선생님',
        downloads: 87
      }
    ];
    setMaterials(mockMaterials);
  }, []);

  const filteredMaterials = materials.filter(material => {
    const matchesSubject = selectedSubject === 'all' || material.subject === selectedSubject;
    const matchesGrade = selectedGrade === 'all' || material.grade === selectedGrade;
    const matchesType = selectedType === 'all' || material.type === selectedType;
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          material.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSubject && matchesGrade && matchesType && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'video': return '🎥';
      case 'quiz': return '❓';
      case 'exercise': return '✏️';
      default: return '📁';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pdf': return 'PDF 자료';
      case 'video': return '동영상';
      case 'quiz': return '퀴즈';
      case 'exercise': return '연습문제';
      default: return '자료';
    }
  };

  const handleDownload = (material: Material) => {
    // 다운로드 카운트 증가
    setMaterials(prev => prev.map(m => 
      m.id === material.id ? { ...m, downloads: m.downloads + 1 } : m
    ));
    
    // 실제 다운로드 처리
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          📚 학습 자료실
        </h2>
        <p style={{ color: '#6b7280' }}>
          과목별 학습 자료를 확인하고 다운로드할 수 있습니다.
        </p>
      </div>

      {/* 필터 및 검색 */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* 과목 필터 */}
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                background: 'white'
              }}
            >
              <option value="all">모든 과목</option>
              <option value="물리학">물리학</option>
              <option value="화학">화학</option>
              <option value="생명과학">생명과학</option>
              <option value="지구과학">지구과학</option>
              <option value="통합과학">통합과학</option>
            </select>

            {/* 학년 필터 */}
            <select 
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                background: 'white'
              }}
            >
              <option value="all">모든 학년</option>
              <option value="고1">고1</option>
              <option value="고2">고2</option>
              <option value="고3">고3</option>
              <option value="중3">중3</option>
              <option value="중2">중2</option>
            </select>

            {/* 자료 유형 필터 */}
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                background: 'white'
              }}
            >
              <option value="all">모든 유형</option>
              <option value="pdf">PDF 자료</option>
              <option value="video">동영상</option>
              <option value="quiz">퀴즈</option>
              <option value="exercise">연습문제</option>
            </select>

            {/* 검색 */}
            <input
              type="text"
              placeholder="자료 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem'
              }}
            />

            {/* 업로드 버튼 (교사/관리자만) */}
            {(userRole === 'teacher' || userRole === 'admin') && (
              <button 
                onClick={() => setShowUploadModal(true)}
                className="btn btn-primary"
              >
                + 자료 업로드
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 자료 목록 */}
      <div className="grid grid-2" style={{ gap: '1.5rem' }}>
        {filteredMaterials.map(material => (
          <div key={material.id} className="card" style={{ 
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(material.type)}</span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                      {material.title}
                    </h3>
                  </div>
                  
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                    {material.description}
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <span style={{
                      background: '#e0e7ff',
                      color: '#4338ca',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem'
                    }}>
                      {material.subject}
                    </span>
                    <span style={{
                      background: '#fef3c7',
                      color: '#d97706',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem'
                    }}>
                      {material.grade}
                    </span>
                    <span style={{
                      background: '#dcfce7',
                      color: '#16a34a',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem'
                    }}>
                      {getTypeLabel(material.type)}
                    </span>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      <div>{material.teacher}</div>
                      <div>{material.uploadDate} · 다운로드 {material.downloads}회</div>
                    </div>
                    
                    <button 
                      onClick={() => handleDownload(material)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      다운로드
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <p style={{ fontSize: '1.125rem' }}>검색 조건에 맞는 자료가 없습니다.</p>
        </div>
      )}

      {/* 업로드 모달 (추후 구현) */}
      {showUploadModal && (
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
              <div className="card-title">자료 업로드</div>
            </div>
            <div className="card-body">
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                자료 업로드 기능은 준비 중입니다.
              </p>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="btn btn-secondary"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterials;