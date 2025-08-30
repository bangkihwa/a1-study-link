import React, { useState, useEffect } from 'react';

interface Student {
  id: number;
  name: string;
  username: string;
  classIds?: number[];
  classNames?: string[];
}

interface Progress {
  studentId: number;
  lectureId: number;
  completedBlocks: number[];
  studyTime: number;
  lastActivity: string;
}

interface Lecture {
  id: number;
  title: string;
  subject: string;
  grade: string;
  contentBlocks?: any[];
}

interface Class {
  id: number;
  name: string;
  teacherIds: number[];
  students: any[];
}

interface LearningMonitoringProps {
  onBack: () => void;
}

const LearningMonitoring: React.FC<LearningMonitoringProps> = ({ onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, selectedClass, selectedTeacher]);

  const loadData = () => {
    // Load students
    const studentsData = JSON.parse(localStorage.getItem('students') || '[]');
    setStudents(studentsData);

    // Load progress
    const progressData = JSON.parse(localStorage.getItem('studylink_student_progress') || '[]');
    setProgress(progressData);

    // Load lectures
    const lecturesData = JSON.parse(localStorage.getItem('lectures') || '[]');
    setLectures(lecturesData);

    // Load classes
    const classesData = JSON.parse(localStorage.getItem('classes') || '[]');
    setClasses(classesData);

    // Load teachers
    const usersData = JSON.parse(localStorage.getItem('users') || '[]');
    const teachersData = usersData.filter((u: any) => u.role === 'teacher');
    setTeachers(teachersData);
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Filter by class
    if (selectedClass !== 'all') {
      const classId = parseInt(selectedClass);
      const selectedClassData = classes.find(c => c.id === classId);
      
      if (selectedClassData) {
        filtered = filtered.filter(student => {
          // Check if student is in the class
          const isInClass = selectedClassData.students?.some((s: any) => 
            s.id === student.id || 
            s.username === student.username ||
            s.name === student.name
          );
          
          // Also check student's classIds
          const hasClassId = student.classIds?.includes(classId);
          
          return isInClass || hasClassId;
        });
      }
    }

    // Filter by teacher
    if (selectedTeacher !== 'all') {
      const teacherId = parseInt(selectedTeacher);
      const teacherClasses = classes.filter(c => c.teacherIds?.includes(teacherId));
      const teacherClassIds = teacherClasses.map(c => c.id);
      
      filtered = filtered.filter(student => {
        // Check if student is in any of teacher's classes
        return teacherClasses.some(cls => 
          cls.students?.some((s: any) => 
            s.id === student.id || 
            s.username === student.username ||
            s.name === student.name
          )
        ) || student.classIds?.some(id => teacherClassIds.includes(id));
      });
    }

    setFilteredStudents(filtered);
  };

  const getStudentProgress = (studentId: number) => {
    const studentProgress = progress.filter(p => p.studentId === studentId);
    
    if (studentProgress.length === 0) {
      return {
        completedLectures: 0,
        totalStudyTime: 0,
        progressRate: 0,
        lastActivity: null
      };
    }

    const completedLectures = studentProgress.filter(p => {
      const lecture = lectures.find(l => l.id === p.lectureId);
      return lecture && p.completedBlocks.length === (lecture.contentBlocks?.length || 0);
    }).length;

    const totalStudyTime = studentProgress.reduce((sum, p) => sum + (p.studyTime || 0), 0);
    
    const totalBlocks = studentProgress.reduce((sum, p) => {
      const lecture = lectures.find(l => l.id === p.lectureId);
      return sum + (lecture?.contentBlocks?.length || 0);
    }, 0);
    
    const completedBlocks = studentProgress.reduce((sum, p) => sum + p.completedBlocks.length, 0);
    const progressRate = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

    const lastActivities = studentProgress
      .filter(p => p.lastActivity)
      .map(p => p.lastActivity)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    const lastActivity = lastActivities[0] || null;

    return {
      completedLectures,
      totalStudyTime,
      progressRate,
      lastActivity
    };
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return '#16a34a';
    if (rate >= 60) return '#2563eb';
    if (rate >= 40) return '#d97706';
    if (rate >= 20) return '#dc2626';
    return '#6b7280';
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-secondary">← 뒤로</button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>학습 모니터링</h2>
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
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                검색 결과: {filteredStudents.length}명
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>전체 학생</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{filteredStudents.length}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>평균 진도율</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
              {filteredStudents.length > 0 
                ? Math.round(
                    filteredStudents.reduce((sum, s) => sum + getStudentProgress(s.id).progressRate, 0) 
                    / filteredStudents.length
                  )
                : 0}%
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>총 학습시간</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
              {filteredStudents.reduce((sum, s) => sum + getStudentProgress(s.id).totalStudyTime, 0)}분
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>활동 학생</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
              {filteredStudents.filter(s => getStudentProgress(s.id).lastActivity).length}
            </p>
          </div>
        </div>
      </div>

      {/* 학생 목록 */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">학생별 학습 현황</div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left' }}>학생 이름</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>반</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>완료 강의</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>학습시간</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>진도율</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>마지막 활동</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ 
                    padding: '3rem', 
                    textAlign: 'center', 
                    color: '#6b7280' 
                  }}>
                    학생이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const studentProgress = getStudentProgress(student.id);
                  return (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <p style={{ fontWeight: '500' }}>{student.name}</p>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>@{student.username}</p>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {student.classNames?.map((className, idx) => (
                            <span key={idx} style={{
                              background: '#dbeafe',
                              color: '#1e40af',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem'
                            }}>
                              {className}
                            </span>
                          )) || <span style={{ color: '#6b7280' }}>-</span>}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {studentProgress.completedLectures}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {studentProgress.totalStudyTime}분
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ 
                            flex: 1, 
                            background: '#f3f4f6', 
                            borderRadius: '9999px', 
                            height: '8px' 
                          }}>
                            <div style={{
                              background: getProgressColor(studentProgress.progressRate),
                              width: `${studentProgress.progressRate}%`,
                              height: '8px',
                              borderRadius: '9999px',
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                          <span style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '500',
                            color: getProgressColor(studentProgress.progressRate)
                          }}>
                            {studentProgress.progressRate}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                        {studentProgress.lastActivity ? (
                          <span>
                            {(() => {
                              const date = new Date(studentProgress.lastActivity);
                              const now = new Date();
                              const diffMs = now.getTime() - date.getTime();
                              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                              
                              if (diffHours < 1) return '방금 전';
                              if (diffHours < 24) return `${diffHours}시간 전`;
                              if (diffDays < 7) return `${diffDays}일 전`;
                              return date.toLocaleDateString();
                            })()}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LearningMonitoring;