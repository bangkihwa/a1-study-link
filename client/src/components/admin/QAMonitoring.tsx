import React, { useState, useEffect } from 'react';

interface Question {
  id: number;
  studentId: number;
  studentName: string;
  teacherId: number;
  teacherName: string;
  lectureId: number;
  lectureTitle: string;
  question: string;
  answer?: string;
  isAnswered: boolean;
  createdAt: string;
  answeredAt?: string;
}

interface Class {
  id: number;
  name: string;
  teacherIds: number[];
  students: any[];
}

interface Teacher {
  id: number;
  name: string;
  username: string;
}

interface QAMonitoringProps {
  onBack: () => void;
}

const QAMonitoring: React.FC<QAMonitoringProps> = ({ onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [questions, selectedClass, selectedTeacher, selectedStatus]);

  const loadData = () => {
    // Load questions
    const questionsData = JSON.parse(localStorage.getItem('teacherQuestions') || '[]');
    setQuestions(questionsData);

    // Load classes
    const classesData = JSON.parse(localStorage.getItem('classes') || '[]');
    setClasses(classesData);

    // Load teachers
    const usersData = JSON.parse(localStorage.getItem('users') || '[]');
    const teachersData = usersData.filter((u: any) => u.role === 'teacher');
    setTeachers(teachersData);
  };

  const filterQuestions = () => {
    let filtered = [...questions];

    // Filter by class
    if (selectedClass !== 'all') {
      const classId = parseInt(selectedClass);
      const selectedClassData = classes.find(c => c.id === classId);
      
      if (selectedClassData) {
        // Get students in this class
        const classStudentIds = selectedClassData.students?.map((s: any) => s.id) || [];
        
        // Get teachers of this class
        const classTeacherIds = selectedClassData.teacherIds || [];
        
        // Filter questions from students in this class or to teachers of this class
        filtered = filtered.filter(q => 
          classStudentIds.includes(q.studentId) || 
          classTeacherIds.includes(q.teacherId)
        );
      }
    }

    // Filter by teacher
    if (selectedTeacher !== 'all') {
      const teacherId = parseInt(selectedTeacher);
      filtered = filtered.filter(q => q.teacherId === teacherId);
    }

    // Filter by status
    if (selectedStatus === 'answered') {
      filtered = filtered.filter(q => q.isAnswered);
    } else if (selectedStatus === 'pending') {
      filtered = filtered.filter(q => !q.isAnswered);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredQuestions(filtered);
  };

  const getResponseTime = (question: Question) => {
    if (!question.isAnswered || !question.answeredAt) return null;
    
    const created = new Date(question.createdAt);
    const answered = new Date(question.answeredAt);
    const diffMs = answered.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return '1시간 이내';
    if (diffHours < 24) return `${diffHours}시간`;
    return `${diffDays}일`;
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString();
  };

  const stats = {
    total: filteredQuestions.length,
    answered: filteredQuestions.filter(q => q.isAnswered).length,
    pending: filteredQuestions.filter(q => !q.isAnswered).length,
    answerRate: filteredQuestions.length > 0 
      ? Math.round((filteredQuestions.filter(q => q.isAnswered).length / filteredQuestions.length) * 100)
      : 0
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>질문 답변 현황</h2>
        </div>
      </div>

      {/* 필터 */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                반 선택
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  minWidth: '150px'
                }}
              >
                <option value="all">전체 반</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                교사 선택
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  minWidth: '150px'
                }}
              >
                <option value="all">전체 교사</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                상태
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  minWidth: '120px'
                }}
              >
                <option value="all">전체</option>
                <option value="answered">답변완료</option>
                <option value="pending">답변대기</option>
              </select>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                검색 결과: {filteredQuestions.length}건
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>전체 질문</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>답변완료</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{stats.answered}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>답변대기</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{stats.pending}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>답변율</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>{stats.answerRate}%</p>
          </div>
        </div>
      </div>

      {/* 질문 목록 */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">질문 목록</div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', width: '120px' }}>상태</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>질문 내용</th>
                <th style={{ padding: '1rem', textAlign: 'left', width: '150px' }}>학생</th>
                <th style={{ padding: '1rem', textAlign: 'left', width: '150px' }}>담당 교사</th>
                <th style={{ padding: '1rem', textAlign: 'left', width: '200px' }}>강의</th>
                <th style={{ padding: '1rem', textAlign: 'center', width: '120px' }}>시간</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ 
                    padding: '3rem', 
                    textAlign: 'center', 
                    color: '#6b7280' 
                  }}>
                    질문이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredQuestions.map(question => (
                  <tr key={question.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      {question.isAnswered ? (
                        <span style={{
                          background: '#dcfce7',
                          color: '#16a34a',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          ✅ 답변완료
                        </span>
                      ) : (
                        <span style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          ⏳ 답변대기
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                          {question.question}
                        </p>
                        {question.isAnswered && question.answer && (
                          <div style={{
                            background: '#f8fafc',
                            padding: '0.5rem',
                            borderRadius: '0.25rem',
                            marginTop: '0.5rem'
                          }}>
                            <p style={{ fontSize: '0.875rem', color: '#16a34a', marginBottom: '0.25rem' }}>
                              답변:
                            </p>
                            <p style={{ fontSize: '0.875rem', color: '#475569' }}>
                              {question.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontWeight: '500' }}>{question.studentName}</p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p>{question.teacherName}</p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem' }}>{question.lectureTitle}</p>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {getTimeAgo(question.createdAt)}
                        </p>
                        {question.isAnswered && (
                          <p style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                            응답: {getResponseTime(question)}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QAMonitoring;