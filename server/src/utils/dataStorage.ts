import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SUBJECTS_FILE = path.join(DATA_DIR, 'subjects.json');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const ENROLLMENTS_FILE = path.join(DATA_DIR, 'enrollments.json');
const LECTURES_FILE = path.join(DATA_DIR, 'lectures.json');
const LECTURE_CONTENTS_FILE = path.join(DATA_DIR, 'lecture_contents.json');

// 데이터 디렉토리 생성
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface SimpleUser {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  name: string;
  phone?: string;
  grade?: string;
  school?: string;
  subjects?: string[];
  child_id?: number;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: number;
  name: string;
  subject_id: number;
  teacher_id: number;
  grade: string;
  schedule: string;
  max_students: number;
  current_students: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: number;
  student_id: number;
  class_id: number;
  enrolled_at: string;
  status: 'active' | 'pending' | 'completed';
}

export interface Lecture {
  id: number;
  class_id: number;
  title: string;
  description: string;
  week: number;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface LectureContent {
  id: number;
  lecture_id: number;
  content_type: 'video' | 'quiz' | 'mindmap' | 'document';
  title: string;
  content: string;
  order_index: number;
  duration: number;
  created_at: string;
}

export interface Quiz {
  id: number;
  lecture_id: number;
  title: string;
  quiz_type: 'ox' | 'multiple_choice';
  created_at: string;
}

export interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'ox' | 'multiple_choice';
  order_index: number;
}

export interface Choice {
  id: number;
  question_id: number;
  choice_text: string;
  is_correct: boolean;
}

export interface StudentQuizAttempt {
  id: number;
  student_id: number;
  quiz_id: number;
  score: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface StudentAnswer {
  id: number;
  attempt_id: number;
  question_id: number;
  chosen_choice_id: number;
  is_correct: boolean;
}


// 기본 사용자 데이터
const defaultUsers: SimpleUser[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@a1science.com',
    password_hash: '$2a$12$9BRRuZNaBVh5k8Dte.CFIe21di5T4k8r3QYrr9sL0WMxi4D.9MbpK', // admin123
    role: 'admin',
    name: '관리자',
    phone: '010-1234-5678',
    is_approved: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    username: 'teacher1',
    email: 'teacher1@a1science.com', 
    password_hash: '$2a$12$9BRRuZNaBVh5k8Dte.CFIe21di5T4k8r3QYrr9sL0WMxi4D.9MbpK', // admin123
    role: 'teacher',
    name: '김선생님',
    phone: '010-2345-6789',
    is_approved: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    username: 'student1',
    email: 'student1@example.com',
    password_hash: '$2a$12$9BRRuZNaBVh5k8Dte.CFIe21di5T4k8r3QYrr9sL0WMxi4D.9MbpK', // admin123
    role: 'student',
    name: '홍길동',
    phone: '010-3456-7890',
    is_approved: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    username: 'parent1',
    email: 'parent1@example.com',
    password_hash: '$2a$12$9BRRuZNaBVh5k8Dte.CFIe21di5T4k8r3QYrr9sL0WMxi4D.9MbpK', // admin123
    role: 'parent',
    name: '홍길동부모',
    phone: '010-4567-8901',
    is_approved: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// 사용자 데이터 로드
export function loadUsers(): SimpleUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } else {
      // 파일이 없으면 기본 데이터로 초기화
      saveUsers(defaultUsers);
      return defaultUsers;
    }
  } catch (error) {
    console.error('Error loading users:', error);
    return defaultUsers;
  }
}

// 사용자 데이터 저장
export function saveUsers(users: SimpleUser[]): void {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

// === 과목 관리 ===
export interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// 기본 과목 데이터
const defaultSubjects: Subject[] = [
  { id: 1, name: '중선', code: 'MS', description: '중학교 선행과정', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: '중등1', code: 'M1', description: '중학교 1학년 과학', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: '중등2', code: 'M2', description: '중학교 2학년 과학', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: '중등3', code: 'M3', description: '중학교 3학년 과학', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, name: '통합과학', code: 'IS', description: '통합과학', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 6, name: '물리', code: 'PHY', description: '물리학', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 7, name: '화학', code: 'CHE', description: '화학', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 8, name: '생명', code: 'BIO', description: '생명과학', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 9, name: '지구과학', code: 'EAR', description: '지구과학', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

// 과목 데이터 로드
export function loadSubjects(): Subject[] {
  try {
    if (fs.existsSync(SUBJECTS_FILE)) {
      const data = fs.readFileSync(SUBJECTS_FILE, 'utf8');
      return JSON.parse(data);
    } else {
      // 파일이 없으면 기본 데이터로 초기화
      saveSubjects(defaultSubjects);
      return defaultSubjects;
    }
  } catch (error) {
    console.error('Error loading subjects:', error);
    return defaultSubjects;
  }
}

// 과목 데이터 저장
export function saveSubjects(subjects: Subject[]): void {
  try {
    fs.writeFileSync(SUBJECTS_FILE, JSON.stringify(subjects, null, 2));
  } catch (error) {
    console.error('Error saving subjects:', error);
  }
}

// 클래스 데이터 로드
export function loadClasses(): Class[] {
  try {
    if (fs.existsSync(CLASSES_FILE)) {
      const data = fs.readFileSync(CLASSES_FILE, 'utf8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error loading classes:', error);
    return [];
  }
}

// 클래스 데이터 저장
export function saveClasses(classes: Class[]): void {
  try {
    fs.writeFileSync(CLASSES_FILE, JSON.stringify(classes, null, 2));
  } catch (error) {
    console.error('Error saving classes:', error);
  }
}

// 수강 신청 데이터 로드
export function loadEnrollments(): Enrollment[] {
  try {
    if (fs.existsSync(ENROLLMENTS_FILE)) {
      const data = fs.readFileSync(ENROLLMENTS_FILE, 'utf8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error loading enrollments:', error);
    return [];
  }
}

// 수강 신청 데이터 저장
export function saveEnrollments(enrollments: Enrollment[]): void {
  try {
    fs.writeFileSync(ENROLLMENTS_FILE, JSON.stringify(enrollments, null, 2));
  } catch (error) {
    console.error('Error saving enrollments:', error);
  }
}

// 강의 데이터 로드
export function loadLectures(): Lecture[] {
  try {
    if (fs.existsSync(LECTURES_FILE)) {
      const data = fs.readFileSync(LECTURES_FILE, 'utf8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error loading lectures:', error);
    return [];
  }
}

// 강의 데이터 저장
export function saveLectures(lectures: Lecture[]): void {
  try {
    fs.writeFileSync(LECTURES_FILE, JSON.stringify(lectures, null, 2));
  } catch (error) {
    console.error('Error saving lectures:', error);
  }
}

// 강의 콘텐츠 데이터 로드
export function loadLectureContents(): LectureContent[] {
  try {
    if (fs.existsSync(LECTURE_CONTENTS_FILE)) {
      const data = fs.readFileSync(LECTURE_CONTENTS_FILE, 'utf8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error loading lecture contents:', error);
    return [];
  }
}

// 강의 콘텐츠 데이터 저장
export function saveLectureContents(contents: LectureContent[]): void {
  try {
    fs.writeFileSync(LECTURE_CONTENTS_FILE, JSON.stringify(contents, null, 2));
  } catch (error) {
    console.error('Error saving lecture contents:', error);
  }
}

export function loadQuizzes(): Quiz[] {
  try {
    if (fs.existsSync(path.join(DATA_DIR, 'quizzes.json'))) {
      const data = fs.readFileSync(path.join(DATA_DIR, 'quizzes.json'), 'utf8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error loading quizzes:', error);
    return [];
  }
}

export function saveQuizzes(quizzes: Quiz[]): void {
  try {
    fs.writeFileSync(path.join(DATA_DIR, 'quizzes.json'), JSON.stringify(quizzes, null, 2));
  } catch (error) {
    console.error('Error saving quizzes:', error);
  }
}

export function loadQuestions(): Question[] {
  try {
    if (fs.existsSync(path.join(DATA_DIR, 'questions.json'))) {
      const data = fs.readFileSync(path.join(DATA_DIR, 'questions.json'), 'utf8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error loading questions:', error);
    return [];
  }
}

export function saveQuestions(questions: Question[]): void {
  try {
    fs.writeFileSync(path.join(DATA_DIR, 'questions.json'), JSON.stringify(questions, null, 2));
  } catch (error) {
    console.error('Error saving questions:', error);
  }
}

export function loadChoices(): Choice[] {
  try {
    if (fs.existsSync(path.join(DATA_DIR, 'choices.json'))) {
      const data = fs.readFileSync(path.join(DATA_DIR, 'choices.json'), 'utf8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error loading choices:', error);
    return [];
  }
}

export function saveChoices(choices: Choice[]): void {
  try {
    fs.writeFileSync(path.join(DATA_DIR, 'choices.json'), JSON.stringify(choices, null, 2));
  } catch (error) {
    console.error('Error saving choices:', error);
  }
}

export function loadStudentQuizAttempts(): StudentQuizAttempt[] {
  try {
    if (fs.existsSync(path.join(DATA_DIR, 'student_quiz_attempts.json'))) {
      const data = fs.readFileSync(path.join(DATA_DIR, 'student_quiz_attempts.json'), 'utf8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error loading student quiz attempts:', error);
    return [];
  }
}

export function saveStudentQuizAttempts(attempts: StudentQuizAttempt[]): void {
  try {
    fs.writeFileSync(path.join(DATA_DIR, 'student_quiz_attempts.json'), JSON.stringify(attempts, null, 2));
  } catch (error) {
    console.error('Error saving student quiz attempts:', error);
  }
}

export function loadStudentAnswers(): StudentAnswer[] {
  try {
    if (fs.existsSync(path.join(DATA_DIR, 'student_answers.json'))) {
      const data = fs.readFileSync(path.join(DATA_DIR, 'student_answers.json'), 'utf8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error loading student answers:', error);
    return [];
  }
}

export function saveStudentAnswers(answers: StudentAnswer[]): void {
  try {
    fs.writeFileSync(path.join(DATA_DIR, 'student_answers.json'), JSON.stringify(answers, null, 2));
  } catch (error) {
    console.error('Error saving student answers:', error);
  }
}

export function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}