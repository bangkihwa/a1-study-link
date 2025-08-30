// 로컬 스토리지를 사용한 데이터 저장/로드 유틸리티

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
  order?: number; // 강의 순서
  prerequisiteId?: number; // 선행 강의 ID
}

interface StudentProgress {
  studentId: number;
  lectureId: number;
  completedBlocks: string[];
  studyTime: number;
  lastActivity: string;
}

interface StudentFeedback {
  id: number;
  lectureId: number;
  lectureTitle: string;
  studentId: number;
  studentName: string;
  teacherId: number;
  difficulty: 'too_easy' | 'just_right' | 'too_hard';
  understanding: 'poor' | 'fair' | 'good' | 'excellent';
  question?: string;
  studyTime: number;
  completedAt: string;
  isAnswered: boolean;
  answer?: string;
  answeredAt?: string;
}

interface Subject {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  classId: number;
  className: string;
  teacherId: number;
  teacherName: string;
  dueDate: string;
  createdAt: string;
  completedStudents?: number[];
}

interface ClassSchedule {
  id: number;
  classId: number;
  className: string;
  teacherId: number;
  teacherName: string;
  dayOfWeek: number; // 0=일요일, 1=월요일, ..., 6=토요일
  startTime: string; // "14:00" 형식
  endTime: string; // "15:30" 형식
  subject: string;
  room?: string;
}

// 강의 데이터 관리
export const saveLectures = (lectures: Lecture[]): void => {
  try {
    localStorage.setItem('studylink_lectures', JSON.stringify(lectures));
    // 같은 탭 내에서 실시간 업데이트를 위한 커스텀 이벤트 발생
    window.dispatchEvent(new Event('localStorageChanged'));
  } catch (error) {
    console.error('Failed to save lectures:', error);
  }
};

export const loadLectures = (): Lecture[] => {
  try {
    const stored = localStorage.getItem('studylink_lectures');
    return stored ? JSON.parse(stored) : getDefaultLectures();
  } catch (error) {
    console.error('Failed to load lectures:', error);
    return getDefaultLectures();
  }
};

// 학생 진도 데이터 관리
export const saveStudentProgress = (progress: StudentProgress[]): void => {
  try {
    localStorage.setItem('studylink_student_progress', JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save student progress:', error);
  }
};

export const loadStudentProgress = (): StudentProgress[] => {
  try {
    const stored = localStorage.getItem('studylink_student_progress');
    return stored ? JSON.parse(stored) : getDefaultProgress();
  } catch (error) {
    console.error('Failed to load student progress:', error);
    return getDefaultProgress();
  }
};

// 학생 피드백 데이터 관리
export const saveStudentFeedbacks = (feedbacks: StudentFeedback[]): void => {
  try {
    localStorage.setItem('studylink_feedbacks', JSON.stringify(feedbacks));
  } catch (error) {
    console.error('Failed to save feedbacks:', error);
  }
};

export const loadStudentFeedbacks = (): StudentFeedback[] => {
  try {
    const stored = localStorage.getItem('studylink_feedbacks');
    return stored ? JSON.parse(stored) : getDefaultFeedbacks();
  } catch (error) {
    console.error('Failed to load feedbacks:', error);
    return getDefaultFeedbacks();
  }
};

// 기본 강의 데이터
const getDefaultLectures = (): Lecture[] => [
  {
    id: 1,
    title: '뉴턴의 운동 법칙',
    subject: '물리',
    description: '뉴턴의 3법칙을 통해 물체의 운동을 이해해봅시다.',
    duration: 90,
    difficulty: 'intermediate',
    materials: ['교재 3장', '실험도구', 'PPT 자료'],
    contentBlocks: [
      {
        id: '1',
        type: 'video',
        title: '뉴턴의 법칙 강의 영상',
        url: 'https://youtube.com/watch?v=example1',
        description: '뉴턴의 3법칙을 설명하는 강의 영상입니다.'
      },
      {
        id: '2',
        type: 'test',
        title: '뉴턴의 법칙 이해도 테스트',
        url: 'https://forms.google.com/test1',
        description: '강의 내용 이해도를 확인하는 테스트입니다.'
      },
      {
        id: '3',
        type: 'document',
        title: '뉴턴의 법칙 정리 자료',
        url: 'https://docs.google.com/document/newton-laws',
        description: '강의 요약 및 핵심 내용 정리'
      }
    ],
    assignedClasses: [1, 2],
    createdAt: '2024-08-20',
    isPublished: true,
    teacherId: 1,
    teacherName: '김선생'
  },
  {
    id: 2,
    title: '화학 반응식 균형',
    subject: '화학',
    description: '화학 반응식의 균형을 맞추는 방법을 학습합니다.',
    duration: 75,
    difficulty: 'beginner',
    materials: ['교재 5장', '계산기'],
    contentBlocks: [
      {
        id: '4',
        type: 'video',
        title: '화학 반응식 균형 맞추기',
        url: 'https://youtube.com/watch?v=example2',
      },
      {
        id: '5',
        type: 'code',
        title: '화학 반응식 계산기',
        url: 'https://codepen.io/chemistry-calculator',
        description: '반응식을 자동으로 균형 맞춰주는 도구입니다.'
      },
      {
        id: '6',
        type: 'quiz',
        title: '화학 반응식 퀴즈',
        url: 'https://quiz.com/chemistry-balance',
        description: '반응식 균형에 대한 퀴즈입니다.'
      }
    ],
    assignedClasses: [2],
    createdAt: '2024-08-18',
    isPublished: true,
    teacherId: 2,
    teacherName: '이선생'
  },
  {
    id: 3,
    title: '생태계와 환경',
    subject: '생물',
    description: '생태계의 구성 요소와 환경과의 상호작용을 알아봅시다.',
    duration: 60,
    difficulty: 'beginner',
    materials: ['교재 8장', '생태계 모형'],
    contentBlocks: [
      {
        id: '7',
        type: 'mindmap',
        title: '생태계 구성 요소 마인드맵',
        url: 'https://mindmeister.com/ecology-map',
        description: '생태계의 구성 요소를 정리한 마인드맵입니다.'
      },
      {
        id: '8',
        type: 'document',
        title: '생태계 연구 자료',
        url: 'https://docs.google.com/document/ecology-research',
        description: '생태계에 대한 상세 연구 자료입니다.'
      },
      {
        id: '9',
        type: 'image',
        title: '생태계 구조도',
        url: 'https://example.com/images/ecosystem.png',
        description: '생태계의 구조를 보여주는 도표입니다.'
      }
    ],
    assignedClasses: [],
    createdAt: '2024-08-15',
    isPublished: false,
    teacherId: 1,
    teacherName: '김선생'
  }
];

// 기본 학생 진도 데이터
const getDefaultProgress = (): StudentProgress[] => [
  {
    studentId: 1,
    lectureId: 1,
    completedBlocks: ['1'],
    studyTime: 45,
    lastActivity: new Date().toISOString()
  },
  {
    studentId: 1,
    lectureId: 2,
    completedBlocks: ['4'],
    studyTime: 30,
    lastActivity: new Date().toISOString()
  }
];

// 기본 피드백 데이터
const getDefaultFeedbacks = (): StudentFeedback[] => [
  {
    id: 1,
    lectureId: 1,
    lectureTitle: '뉴턴의 운동 법칙',
    studentId: 1,
    studentName: '김학생',
    teacherId: 1,
    difficulty: 'just_right',
    understanding: 'good',
    question: '관성의 법칙에서 마찰력이 없는 상황을 실제로 만들 수 있나요?',
    studyTime: 45,
    completedAt: new Date().toISOString(),
    isAnswered: false
  }
];

// 헬퍼 함수들
export const getNextLectureId = (): number => {
  const lectures = loadLectures();
  return lectures.length > 0 ? Math.max(...lectures.map(l => l.id)) + 1 : 1;
};

export const getNextFeedbackId = (): number => {
  const feedbacks = loadStudentFeedbacks();
  return feedbacks.length > 0 ? Math.max(...feedbacks.map(f => f.id)) + 1 : 1;
};

export const updateStudentProgress = (studentId: number, lectureId: number, completedBlocks: string[], studyTime: number): void => {
  const allProgress = loadStudentProgress();
  const existingIndex = allProgress.findIndex(p => p.studentId === studentId && p.lectureId === lectureId);
  
  const progressData: StudentProgress = {
    studentId,
    lectureId,
    completedBlocks,
    studyTime,
    lastActivity: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    allProgress[existingIndex] = progressData;
  } else {
    allProgress.push(progressData);
  }

  saveStudentProgress(allProgress);
};

export const getStudentProgressForLecture = (studentId: number, lectureId: number): StudentProgress | null => {
  const allProgress = loadStudentProgress();
  return allProgress.find(p => p.studentId === studentId && p.lectureId === lectureId) || null;
};

// 과목 데이터 관리
export const saveSubjects = (subjects: Subject[]): void => {
  try {
    localStorage.setItem('studylink_subjects', JSON.stringify(subjects));
    window.dispatchEvent(new Event('localStorageChanged'));
  } catch (error) {
    console.error('Failed to save subjects:', error);
  }
};

export const loadSubjects = (): Subject[] => {
  try {
    const subjects = localStorage.getItem('studylink_subjects');
    if (subjects) {
      return JSON.parse(subjects);
    }
    // 기본 과목 설정
    const defaultSubjects: Subject[] = [
      { id: 1, name: '물리', createdAt: new Date().toISOString() },
      { id: 2, name: '화학', createdAt: new Date().toISOString() },
      { id: 3, name: '생물', createdAt: new Date().toISOString() },
      { id: 4, name: '지구과학', createdAt: new Date().toISOString() },
      { id: 5, name: '통합과학', createdAt: new Date().toISOString() },
    ];
    saveSubjects(defaultSubjects);
    return defaultSubjects;
  } catch (error) {
    console.error('Failed to load subjects:', error);
    return [];
  }
};

// 과제 데이터 관리
export const saveAssignments = (assignments: Assignment[]): void => {
  try {
    localStorage.setItem('studylink_assignments', JSON.stringify(assignments));
    window.dispatchEvent(new Event('localStorageChanged'));
  } catch (error) {
    console.error('Failed to save assignments:', error);
  }
};

export const loadAssignments = (): Assignment[] => {
  try {
    const assignments = localStorage.getItem('studylink_assignments');
    return assignments ? JSON.parse(assignments) : [];
  } catch (error) {
    console.error('Failed to load assignments:', error);
    return [];
  }
};

export const toggleAssignmentComplete = (assignmentId: number, studentId: number): void => {
  const assignments = loadAssignments();
  const assignment = assignments.find(a => a.id === assignmentId);
  
  if (assignment) {
    if (!assignment.completedStudents) {
      assignment.completedStudents = [];
    }
    
    const index = assignment.completedStudents.indexOf(studentId);
    if (index > -1) {
      assignment.completedStudents.splice(index, 1);
    } else {
      assignment.completedStudents.push(studentId);
    }
    
    saveAssignments(assignments);
  }
};

// 시간표 데이터 관리
export const saveSchedules = (schedules: ClassSchedule[]): void => {
  try {
    localStorage.setItem('studylink_schedules', JSON.stringify(schedules));
    window.dispatchEvent(new Event('localStorageChanged'));
  } catch (error) {
    console.error('Failed to save schedules:', error);
  }
};

export const loadSchedules = (): ClassSchedule[] => {
  try {
    const schedules = localStorage.getItem('studylink_schedules');
    return schedules ? JSON.parse(schedules) : [];
  } catch (error) {
    console.error('Failed to load schedules:', error);
    return [];
  }
};

// 유틸리티 함수
export const generateId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};