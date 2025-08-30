export const initializeSystemData = () => {
  // Check if data already exists
  const existingUsers = localStorage.getItem('users');
  if (existingUsers) {
    // Update Hong Gildong if needed
    const users = JSON.parse(existingUsers);
    const hongGildong = users.find((u: any) => u.username === 'hong');
    if (!hongGildong) {
      users.push({
        id: 3,
        username: 'hong',
        password: '1234',
        name: '홍길동',
        role: 'student',
        status: 'active'
      });
      localStorage.setItem('users', JSON.stringify(users));
    }
  } else {
    // Initialize with default users
    const initialUsers = [
      { id: 1, username: 'admin', password: 'admin', name: '관리자', email: 'admin@a1academy.com', role: 'admin', status: 'active' },
      { id: 2, username: 'teacher1', password: '1234', name: '김선생', email: 'kim@a1academy.com', role: 'teacher', status: 'active' },
      { id: 3, username: 'hong', password: '1234', name: '홍길동', email: 'hong@example.com', role: 'student', status: 'active' }
    ];
    localStorage.setItem('users', JSON.stringify(initialUsers));
  }

  // Initialize students list
  const existingStudents = localStorage.getItem('students');
  if (!existingStudents) {
    const initialStudents = [
      {
        id: 3,
        name: '홍길동',
        username: 'hong',
        email: 'hong@example.com',
        phone: '010-1234-5678',
        classIds: [],
        classNames: [],
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
      }
    ];
    localStorage.setItem('students', JSON.stringify(initialStudents));
  } else {
    // Add Hong Gildong if not exists
    const students = JSON.parse(existingStudents);
    const hongExists = students.find((s: any) => s.username === 'hong');
    if (!hongExists) {
      students.push({
        id: 3,
        name: '홍길동',
        username: 'hong',
        email: 'hong@example.com',
        phone: '010-1234-5678',
        classIds: [],
        classNames: [],
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
      });
      localStorage.setItem('students', JSON.stringify(students));
    }
  }

  // Initialize studylink_all_students
  const existingAllStudents = localStorage.getItem('studylink_all_students');
  if (!existingAllStudents) {
    const initialAllStudents = [
      {
        id: 3,
        name: '홍길동',
        username: 'hong',
        email: 'hong@example.com',
        phone: '010-1234-5678',
        classIds: [],
        classNames: [],
        role: 'student',
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
      }
    ];
    localStorage.setItem('studylink_all_students', JSON.stringify(initialAllStudents));
  } else {
    // Add Hong Gildong if not exists
    const allStudents = JSON.parse(existingAllStudents);
    const hongExists = allStudents.find((s: any) => s.username === 'hong');
    if (!hongExists) {
      allStudents.push({
        id: 3,
        name: '홍길동',
        username: 'hong',
        email: 'hong@example.com',
        phone: '010-1234-5678',
        classIds: [],
        classNames: [],
        role: 'student',
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
      });
      localStorage.setItem('studylink_all_students', JSON.stringify(allStudents));
    }
  }

  // Initialize classes with proper structure
  const existingClasses = localStorage.getItem('classes');
  if (!existingClasses) {
    const initialClasses = [
      {
        id: 1,
        name: '중등3 물리A반',
        grade: '중등3',
        subject: '물리',
        teacherIds: [2],
        teacherNames: ['김선생'],
        students: [],
        maxStudents: 20,
        schedule: '월,수,금 14:00-16:00',
        createdAt: '2024-01-01',
        lectureIds: []
      },
      {
        id: 2,
        name: '중등2 화학B반',
        grade: '중등2',
        subject: '화학',
        teacherIds: [2],
        teacherNames: ['김선생'],
        students: [],
        maxStudents: 20,
        schedule: '화,목 15:00-17:00',
        createdAt: '2024-01-02',
        lectureIds: []
      }
    ];
    localStorage.setItem('classes', JSON.stringify(initialClasses));
  }

  // Initialize lectures with class assignment
  const existingLectures = localStorage.getItem('lectures');
  if (!existingLectures) {
    const initialLectures = [
      {
        id: 1,
        title: '힘과 운동의 기초',
        subject: '물리',
        description: '뉴턴의 운동법칙을 배웁니다',
        duration: 60,
        difficulty: 'beginner',
        materials: [],
        contentBlocks: [
          {
            id: 'block1',
            type: 'video',
            title: '힘과 운동 개념 설명',
            url: 'https://example.com/video1',
            description: '기본 개념을 설명하는 영상입니다'
          }
        ],
        assignedClasses: [1], // 중등3 물리A반에 배정
        createdAt: new Date().toISOString(),
        isPublished: true,
        teacherId: 2,
        teacherName: '김선생'
      },
      {
        id: 2,
        title: '화학 반응의 이해',
        subject: '화학',
        description: '화학 반응식과 반응 속도를 배웁니다',
        duration: 50,
        difficulty: 'intermediate',
        materials: [],
        contentBlocks: [
          {
            id: 'block1',
            type: 'document',
            title: '화학 반응식 정리',
            url: 'https://example.com/doc1',
            description: '화학 반응식 정리 문서'
          }
        ],
        assignedClasses: [2], // 중등2 화학B반에 배정
        createdAt: new Date().toISOString(),
        isPublished: true,
        teacherId: 2,
        teacherName: '김선생'
      }
    ];
    localStorage.setItem('lectures', JSON.stringify(initialLectures));
  }
};