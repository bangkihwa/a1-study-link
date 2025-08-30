import React, { useState, useEffect } from 'react';
import { loadAssignments, saveAssignments, generateId } from '../../utils/dataStorage';
import ClassBulletinBoard from '../class/ClassBulletinBoard';

interface Student {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  attendance: number;
  progress: number;
  lastActivity: string;
}

interface Class {
  id: number;
  name: string;
  subject: string;
  studentCount: number;
  progress: number;
  schedule: string;
}

interface MyClassManagementProps {
  onBack: () => void;
  teacherId: number;
}

const MyClassManagement: React.FC<MyClassManagementProps> = ({ onBack, teacherId }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentView, setCurrentView] = useState<'classes' | 'students' | 'bulletin'>('classes');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showLectureAssignModal, setShowLectureAssignModal] = useState(false);
  const [availableLectures, setAvailableLectures] = useState<any[]>([]);
  const [selectedLectureIds, setSelectedLectureIds] = useState<number[]>([]);
  const [studentAddMode, setStudentAddMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState<number | null>(null);
  const [newStudent, setNewStudent] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '1234'
  });

  useEffect(() => {
    loadMyClasses();
  }, [teacherId]);

  const loadAvailableLectures = () => {
    const allLectures = JSON.parse(localStorage.getItem('lectures') || localStorage.getItem('studylink_lectures') || '[]');
    const publishedLectures = allLectures.filter((lecture: any) => lecture.status === 'published');
    setAvailableLectures(publishedLectures);
  };

  const loadMyClasses = () => {
    // Load classes from localStorage
    const allClasses = JSON.parse(localStorage.getItem('classes') || localStorage.getItem('studylink_classes') || '[]');
    const myClasses = allClasses.filter((cls: any) => cls.teacherIds?.includes(teacherId));
    
    if (myClasses.length === 0) {
      // Demo data if no real classes
      const demoClasses: Class[] = [
      {
        id: 1,
        name: '중등3 물리A반',
        subject: '물리',
        studentCount: 8,
        progress: 75,
        schedule: '월수금 14:00-15:30'
      },
      {
        id: 2,
        name: '중등2 화학B반',
        subject: '화학',
        studentCount: 12,
        progress: 60,
        schedule: '화목 16:00-17:30'
      },
      {
        id: 3,
        name: '중등1 통합과학',
        subject: '통합과학',
        studentCount: 5,
        progress: 85,
        schedule: '토 18:00-19:30'
      }
    ];
      setClasses(demoClasses);
    } else {
      setClasses(myClasses);
    }
  };

  const loadClassStudents = (classId: number) => {
    // Load students from localStorage
    const allStudents = JSON.parse(localStorage.getItem('students') || localStorage.getItem('studylink_students') || '[]');
    const classStudents = allStudents.filter((student: any) => 
      student.classIds?.includes(classId) || student.classId === classId
    );
    
    if (classStudents.length === 0) {
      // Demo data if no real students
      const demoStudents: Student[] = [
      {
        id: 1,
        name: '김민수',
        username: 'student_kim',
        email: 'kim@example.com',
        phone: '010-1111-1111',
        attendance: 95,
        progress: 80,
        lastActivity: '2시간 전'
      },
      {
        id: 2,
        name: '이지은',
        username: 'student_lee',
        email: 'lee@example.com',
        phone: '010-2222-2222',
        attendance: 90,
        progress: 75,
        lastActivity: '1일 전'
      },
      {
        id: 3,
        name: '박준호',
        username: 'student_park',
        email: 'park@example.com',
        phone: '010-3333-3333',
        attendance: 85,
        progress: 70,
        lastActivity: '3시간 전'
      }
      ];
      setStudents(demoStudents);
    } else {
      setStudents(classStudents.map((s: any) => ({
        id: s.id,
        name: s.name,
        username: s.username,
        email: s.email,
        phone: s.phone,
        attendance: s.attendance || 90,
        progress: s.progress || 75,
        lastActivity: s.lastActivity || '방금 전'
      })));
    }
  };

  const handleClassSelect = (classData: Class) => {
    setSelectedClass(classData);
    loadClassStudents(classData.id);
    loadAvailableLectures();
    setCurrentView('students');
  };

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.username || !newStudent.email) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    const allStudents = JSON.parse(localStorage.getItem('students') || localStorage.getItem('studylink_students') || '[]');
    const allUsers = JSON.parse(localStorage.getItem('users') || localStorage.getItem('studylink_users') || '[]');
    
    // Check if username already exists
    if (allUsers.some((u: any) => u.username === newStudent.username)) {
      alert('이미 존재하는 아이디입니다.');
      return;
    }

    const newStudentData = {
      id: Date.now(),
      ...newStudent,
      classIds: selectedClass ? [selectedClass.id] : [],
      classNames: selectedClass ? [selectedClass.name] : [],
      attendance: 100,
      progress: 0,
      lastActivity: '방금 전',
      createdAt: new Date().toISOString()
    };

    const newUser = {
      id: newStudentData.id,
      username: newStudent.username,
      password: newStudent.password,
      name: newStudent.name,
      role: 'student',
      email: newStudent.email,
      phone: newStudent.phone
    };

    // Update localStorage
    allStudents.push(newStudentData);
    allUsers.push(newUser);
    
    localStorage.setItem('students', JSON.stringify(allStudents));
    localStorage.setItem('studylink_students', JSON.stringify(allStudents));
    localStorage.setItem('users', JSON.stringify(allUsers));
    localStorage.setItem('studylink_users', JSON.stringify(allUsers));

    // Update classes to include new student
    if (selectedClass) {
      const allClasses = JSON.parse(localStorage.getItem('classes') || localStorage.getItem('studylink_classes') || '[]');
      const classIndex = allClasses.findIndex((c: any) => c.id === selectedClass.id);
      if (classIndex !== -1) {
        if (!allClasses[classIndex].studentIds) {
          allClasses[classIndex].studentIds = [];
        }
        allClasses[classIndex].studentIds.push(newStudentData.id);
        allClasses[classIndex].studentCount = allClasses[classIndex].studentIds.length;
        localStorage.setItem('classes', JSON.stringify(allClasses));
        localStorage.setItem('studylink_classes', JSON.stringify(allClasses));
      }
    }

    // Reload students
    if (selectedClass) {
      loadClassStudents(selectedClass.id);
    }
    
    // Reset form
    setNewStudent({
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '1234'
    });
    setShowAddStudentModal(false);
    alert('학생이 추가되었습니다.');
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowEditStudentModal(true);
  };

  const handleUpdateStudent = () => {
    if (!editingStudent) return;

    const allStudents = JSON.parse(localStorage.getItem('students') || localStorage.getItem('studylink_students') || '[]');
    const studentIndex = allStudents.findIndex((s: any) => s.id === editingStudent.id);
    
    if (studentIndex !== -1) {
      allStudents[studentIndex] = {
        ...allStudents[studentIndex],
        ...editingStudent
      };
      
      localStorage.setItem('students', JSON.stringify(allStudents));
      localStorage.setItem('studylink_students', JSON.stringify(allStudents));
      
      // Update users table as well
      const allUsers = JSON.parse(localStorage.getItem('users') || localStorage.getItem('studylink_users') || '[]');
      const userIndex = allUsers.findIndex((u: any) => u.id === editingStudent.id);
      if (userIndex !== -1) {
        allUsers[userIndex] = {
          ...allUsers[userIndex],
          name: editingStudent.name,
          email: editingStudent.email,
          phone: editingStudent.phone
        };
        localStorage.setItem('users', JSON.stringify(allUsers));
        localStorage.setItem('studylink_users', JSON.stringify(allUsers));
      }
      
      if (selectedClass) {
        loadClassStudents(selectedClass.id);
      }
      setShowEditStudentModal(false);
      setEditingStudent(null);
      alert('학생 정보가 수정되었습니다.');
    }
  };

  const handleDeleteStudent = (studentId: number) => {
    if (!confirm('정말로 이 학생을 삭제하시겠습니까?')) return;

    const allStudents = JSON.parse(localStorage.getItem('students') || localStorage.getItem('studylink_students') || '[]');
    const updatedStudents = allStudents.filter((s: any) => s.id !== studentId);
    
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    localStorage.setItem('studylink_students', JSON.stringify(updatedStudents));
    
    // Remove from classes
    const allClasses = JSON.parse(localStorage.getItem('classes') || localStorage.getItem('studylink_classes') || '[]');
    allClasses.forEach((cls: any) => {
      if (cls.studentIds) {
        cls.studentIds = cls.studentIds.filter((id: number) => id !== studentId);
        cls.studentCount = cls.studentIds.length;
      }
    });
    localStorage.setItem('classes', JSON.stringify(allClasses));
    localStorage.setItem('studylink_classes', JSON.stringify(allClasses));
    
    // Remove user account
    const allUsers = JSON.parse(localStorage.getItem('users') || localStorage.getItem('studylink_users') || '[]');
    const updatedUsers = allUsers.filter((u: any) => u.id !== studentId);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    localStorage.setItem('studylink_users', JSON.stringify(updatedUsers));
    
    if (selectedClass) {
      loadClassStudents(selectedClass.id);
    }
    alert('학생이 삭제되었습니다.');
  };

  const handleAssignLectures = () => {
    if (selectedLectureIds.length === 0) {
      alert('배정할 강의를 선택해주세요.');
      return;
    }

    if (!selectedClass) return;

    // Update class with assigned lectures
    const allClasses = JSON.parse(localStorage.getItem('classes') || localStorage.getItem('studylink_classes') || '[]');
    const classIndex = allClasses.findIndex((c: any) => c.id === selectedClass.id);
    
    if (classIndex !== -1) {
      if (!allClasses[classIndex].assignedLectureIds) {
        allClasses[classIndex].assignedLectureIds = [];
      }
      
      // Add new lecture IDs (avoid duplicates)
      selectedLectureIds.forEach(lectureId => {
        if (!allClasses[classIndex].assignedLectureIds.includes(lectureId)) {
          allClasses[classIndex].assignedLectureIds.push(lectureId);
        }
      });
      
      localStorage.setItem('classes', JSON.stringify(allClasses));
      localStorage.setItem('studylink_classes', JSON.stringify(allClasses));
      
      // Update lecture assignments for all students in the class
      const allStudents = JSON.parse(localStorage.getItem('students') || localStorage.getItem('studylink_students') || '[]');
      const classStudents = allStudents.filter((s: any) => s.classIds?.includes(selectedClass.id));
      
      classStudents.forEach((student: any) => {
        if (!student.assignedLectureIds) {
          student.assignedLectureIds = [];
        }
        selectedLectureIds.forEach(lectureId => {
          if (!student.assignedLectureIds.includes(lectureId)) {
            student.assignedLectureIds.push(lectureId);
          }
        });
      });
      
      localStorage.setItem('students', JSON.stringify(allStudents));
      localStorage.setItem('studylink_students', JSON.stringify(allStudents));
      
      setSelectedLectureIds([]);
      setShowLectureAssignModal(false);
      alert(`${selectedLectureIds.length}개의 강의가 ${selectedClass.name}에 배정되었습니다.`);
    }
  };

  const sendMessage = (studentId: number, studentName: string) => {
    alert(`${studentName} 학생에게 메시지를 보내는 기능은 준비 중입니다.`);
  };

  const viewProgress = (studentId: number, studentName: string) => {
    alert(`${studentName} 학생의 상세 진도를 확인하는 기능은 준비 중입니다.`);
  };

  const markAttendance = (classId: number, className: string) => {
    alert(`${className}의 출석체크 기능은 준비 중입니다.`);
  };

  const createAssignment = (classId: number, className: string) => {
    // 과제 제목 입력
    const assignmentTitle = prompt(`${className}에 내실 과제 제목을 입력하세요:`);
    if (!assignmentTitle) return;
    
    // 과제 설명 입력
    const assignmentDescription = prompt('과제 설명을 입력하세요:') || '';
    
    // 마감일 입력
    const dueDateStr = prompt('마감일을 입력하세요 (YYYY-MM-DD):');
    if (!dueDateStr) return;
    
    const newAssignment = {
      id: generateId(),
      title: assignmentTitle,
      description: assignmentDescription,
      classId: classId,
      className: className,
      teacherId: teacherId,
      teacherName: '김선생', // 실제로는 현재 로그인한 교사 이름
      dueDate: dueDateStr,
      createdAt: new Date().toISOString(),
      completedStudents: []
    };
    
    const allAssignments = loadAssignments();
    allAssignments.push(newAssignment);
    saveAssignments(allAssignments);
    
    alert(`"${assignmentTitle}" 과제가 ${className}에 등록되었습니다.`);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => {
            console.log('MyClassManagement - Back button clicked');
            onBack();
          }} 
          className="btn btn-secondary"
        >
          ← 뒤로
        </button>
        <h2 style={{ margin: 0 }}>
          {currentView === 'classes' ? '내 반 관리' : `${selectedClass?.name} 학생 관리`}
        </h2>
        {currentView === 'students' && (
          <button 
            onClick={() => setCurrentView('classes')} 
            className="btn btn-secondary"
          >
            반 목록으로
          </button>
        )}
      </div>

      {currentView === 'classes' && (
        <div>
          <div className="grid grid-1" style={{ gap: '1.5rem' }}>
            {classes.map((classData) => (
              <div key={classData.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
                        {classData.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <span style={{
                          background: '#dbeafe',
                          color: '#1e40af',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem'
                        }}>
                          {classData.subject}
                        </span>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          👥 {classData.studentCount}명
                        </span>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          📅 {classData.schedule}
                        </span>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>진도율</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#16a34a' }}>
                            {classData.progress}%
                          </span>
                        </div>
                        <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '8px' }}>
                          <div style={{
                            background: '#16a34a',
                            width: `${classData.progress}%`,
                            height: '8px',
                            borderRadius: '9999px'
                          }}></div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => handleClassSelect(classData)}
                          className="btn btn-primary"
                          style={{ fontSize: '0.875rem' }}
                        >
                          👥 학생 관리
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedClass(classData);
                            setCurrentView('bulletin');
                          }}
                          className="btn btn-primary"
                          style={{ 
                            fontSize: '0.875rem',
                            background: '#059669',
                            borderColor: '#059669'
                          }}
                        >
                          📋 게시판
                        </button>
                        <button 
                          onClick={() => markAttendance(classData.id, classData.name)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.875rem' }}
                        >
                          ✓ 출석체크
                        </button>
                        <button 
                          onClick={() => createAssignment(classData.id, classData.name)}
                          className="btn btn-primary"
                          style={{ 
                            fontSize: '0.875rem',
                            background: '#dc2626',
                            borderColor: '#dc2626'
                          }}
                        >
                          📝 과제내기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentView === 'students' && selectedClass && (
        <div>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">
                  {selectedClass.name} - 학생 현황
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => setShowLectureAssignModal(true)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.875rem' }}
                  >
                    📚 강의 배정
                  </button>
                  <button 
                    onClick={() => setShowAddStudentModal(true)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.875rem' }}
                  >
                    + 학생 추가
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
                    {selectedClass.studentCount}
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>총 학생수</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
                    {selectedClass.progress}%
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>평균 진도율</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
                    {Math.round(students.reduce((acc, s) => acc + s.attendance, 0) / students.length)}%
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>평균 출석률</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>학생명</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>연락처</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>출석률</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>진도율</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>마지막 활동</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{student.name}</p>
                          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>@{student.username}</p>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{student.email}</p>
                          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{student.phone}</p>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          background: student.attendance >= 90 ? '#dcfce7' : student.attendance >= 80 ? '#fef3c7' : '#fee2e2',
                          color: student.attendance >= 90 ? '#16a34a' : student.attendance >= 80 ? '#d97706' : '#dc2626',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {student.attendance}%
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ width: '100px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{student.progress}%</span>
                          </div>
                          <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '4px' }}>
                            <div style={{
                              background: '#2563eb',
                              width: `${student.progress}%`,
                              height: '4px',
                              borderRadius: '9999px'
                            }}></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          {student.lastActivity}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => viewProgress(student.id, student.name)}
                            className="btn btn-secondary" 
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            📊 진도
                          </button>
                          <button 
                            onClick={() => handleEditStudent(student)}
                            className="btn btn-secondary" 
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            ✏️ 수정
                          </button>
                          <button 
                            onClick={() => handleDeleteStudent(student.id)}
                            className="btn btn-secondary" 
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#dc2626', borderColor: '#dc2626', color: 'white' }}
                          >
                            🗑️ 삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {students.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                  <p>등록된 학생이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '1.5rem' }}>학생 추가</h3>
            
            {/* 탭 선택 */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: studentAddMode === 'new' ? '#2563eb' : 'transparent',
                  color: studentAddMode === 'new' ? 'white' : '#6b7280',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setStudentAddMode('new');
                  setSelectedExistingStudentId(null);
                }}
              >
                새 학생 등록
              </button>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: studentAddMode === 'existing' ? '#2563eb' : 'transparent',
                  color: studentAddMode === 'existing' ? 'white' : '#6b7280',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setStudentAddMode('existing');
                  setNewStudent({
                    name: '',
                    username: '',
                    email: '',
                    phone: '',
                    password: '1234'
                  });
                }}
              >
                기존 학생 선택
              </button>
            </div>
            
            {studentAddMode === 'new' ? (
              <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>이름 *</label>
              <input
                type="text"
                value={newStudent.name}
                onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
                placeholder="홍길동"
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>아이디 *</label>
              <input
                type="text"
                value={newStudent.username}
                onChange={(e) => setNewStudent({...newStudent, username: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
                placeholder="student_hong"
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>이메일 *</label>
              <input
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
                placeholder="hong@example.com"
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>전화번호</label>
              <input
                type="tel"
                value={newStudent.phone}
                onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
                placeholder="010-1234-5678"
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>초기 비밀번호</label>
              <input
                type="text"
                value={newStudent.password}
                onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setNewStudent({
                    name: '',
                    username: '',
                    email: '',
                    phone: '',
                    password: '1234'
                  });
                }}
                className="btn btn-secondary"
              >
                취소
              </button>
              <button
                onClick={handleAddStudent}
                className="btn btn-primary"
              >
                추가하기
              </button>
            </div>
            </>
            ) : (
              /* 기존 학생 선택 */
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                    반에 추가할 기존 학생을 선택하세요:
                  </p>
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.25rem' 
                  }}>
                    {(() => {
                      const allStudents = JSON.parse(localStorage.getItem('students') || localStorage.getItem('studylink_students') || '[]');
                      const classStudentIds = students.map(s => s.id);
                      const availableStudents = allStudents.filter((s: any) => !classStudentIds.includes(s.id));
                      
                      if (availableStudents.length === 0) {
                        return (
                          <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                            추가 가능한 학생이 없습니다.
                          </p>
                        );
                      }
                      
                      return availableStudents.map((student: any) => (
                        <div
                          key={student.id}
                          style={{
                            padding: '1rem',
                            borderBottom: '1px solid #f3f4f6',
                            cursor: 'pointer',
                            background: selectedExistingStudentId === student.id ? '#f0f9ff' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                          }}
                          onClick={() => setSelectedExistingStudentId(student.id)}
                        >
                          <input
                            type="radio"
                            checked={selectedExistingStudentId === student.id}
                            onChange={() => setSelectedExistingStudentId(student.id)}
                            style={{ width: '18px', height: '18px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{student.name}</p>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              @{student.username} • {student.email || '이메일 없음'}
                            </p>
                            {student.classNames && student.classNames.length > 0 && (
                              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                현재 반: {student.classNames.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => {
                      if (!selectedExistingStudentId) {
                        alert('학생을 선택해주세요.');
                        return;
                      }
                      
                      const allStudents = JSON.parse(localStorage.getItem('students') || localStorage.getItem('studylink_students') || '[]');
                      const selectedStudent = allStudents.find((s: any) => s.id === selectedExistingStudentId);
                      
                      if (selectedStudent && selectedClass) {
                        // 학생의 반 정보 업데이트
                        if (!selectedStudent.classIds) selectedStudent.classIds = [];
                        if (!selectedStudent.classNames) selectedStudent.classNames = [];
                        
                        if (!selectedStudent.classIds.includes(selectedClass.id)) {
                          selectedStudent.classIds.push(selectedClass.id);
                          selectedStudent.classNames.push(selectedClass.name);
                        }
                        
                        // 학생 정보 저장
                        const studentIndex = allStudents.findIndex((s: any) => s.id === selectedExistingStudentId);
                        if (studentIndex !== -1) {
                          allStudents[studentIndex] = selectedStudent;
                          localStorage.setItem('students', JSON.stringify(allStudents));
                          localStorage.setItem('studylink_students', JSON.stringify(allStudents));
                        }
                        
                        // 반 정보 업데이트
                        const allClasses = JSON.parse(localStorage.getItem('classes') || localStorage.getItem('studylink_classes') || '[]');
                        const classIndex = allClasses.findIndex((c: any) => c.id === selectedClass.id);
                        if (classIndex !== -1) {
                          if (!allClasses[classIndex].studentIds) {
                            allClasses[classIndex].studentIds = [];
                          }
                          if (!allClasses[classIndex].studentIds.includes(selectedExistingStudentId)) {
                            allClasses[classIndex].studentIds.push(selectedExistingStudentId);
                          }
                          allClasses[classIndex].studentCount = allClasses[classIndex].studentIds.length;
                          localStorage.setItem('classes', JSON.stringify(allClasses));
                          localStorage.setItem('studylink_classes', JSON.stringify(allClasses));
                        }
                        
                        // 화면 업데이트
                        loadClassStudents(selectedClass.id);
                        setShowAddStudentModal(false);
                        setSelectedExistingStudentId(null);
                        alert(`${selectedStudent.name} 학생이 반에 추가되었습니다.`);
                      }
                    }}
                    className="btn btn-primary"
                  >
                    선택한 학생 추가
                  </button>
                  <button
                    onClick={() => {
                      setShowAddStudentModal(false);
                      setSelectedExistingStudentId(null);
                    }}
                    className="btn btn-secondary"
                  >
                    취소
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && editingStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '1.5rem' }}>학생 정보 수정</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>이름</label>
              <input
                type="text"
                value={editingStudent.name}
                onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>이메일</label>
              <input
                type="email"
                value={editingStudent.email}
                onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>전화번호</label>
              <input
                type="tel"
                value={editingStudent.phone}
                onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditStudentModal(false);
                  setEditingStudent(null);
                }}
                className="btn btn-secondary"
              >
                취소
              </button>
              <button
                onClick={handleUpdateStudent}
                className="btn btn-primary"
              >
                수정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lecture Assignment Modal */}
      {showLectureAssignModal && selectedClass && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '600px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{selectedClass.name}에 강의 배정</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                게시된 강의를 선택하여 반에 배정할 수 있습니다.
              </p>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
                {availableLectures.length === 0 ? (
                  <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    배정 가능한 강의가 없습니다.
                  </p>
                ) : (
                  availableLectures.map((lecture) => (
                    <div
                      key={lecture.id}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLectureIds.includes(lecture.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLectureIds([...selectedLectureIds, lecture.id]);
                          } else {
                            setSelectedLectureIds(selectedLectureIds.filter(id => id !== lecture.id));
                          }
                        }}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                          {lecture.title}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {lecture.subject} • {lecture.grade} • {lecture.duration || '45분'}
                        </p>
                        {lecture.teacherName && (
                          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            담당: {lecture.teacherName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {selectedLectureIds.length > 0 && (
              <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.25rem' }}>
                <p style={{ color: '#16a34a', fontWeight: '500' }}>
                  {selectedLectureIds.length}개 강의 선택됨
                </p>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowLectureAssignModal(false);
                  setSelectedLectureIds([]);
                }}
                className="btn btn-secondary"
              >
                취소
              </button>
              <button
                onClick={handleAssignLectures}
                className="btn btn-primary"
                disabled={selectedLectureIds.length === 0}
              >
                배정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 게시판 뷰 */}
      {currentView === 'bulletin' && selectedClass && (
        <ClassBulletinBoard 
          classId={selectedClass.id}
          className={selectedClass.name}
          userRole="teacher"
          userId={teacherId}
          userName={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser') || '{}').name : '교사'}
          onBack={() => setCurrentView('classes')}
        />
      )}
    </div>
  );
};

export default MyClassManagement;