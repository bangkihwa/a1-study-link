export interface User {
  id: number;
  username: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  name: string;
  email?: string;
  phone?: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  studentNumber?: string | null;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface ContentBlockStudentStatus {
  isCompleted: boolean;
  progressPercentage?: number;
  watchedDuration?: number;
  totalDuration?: number;
  lastWatchedAt?: string | null;
  hasSubmission?: boolean;
  submissionStatus?: {
    submissionId: number;
    isGraded: boolean;
    isPublished: boolean;
    score?: number | null;
    submittedAt?: string | null;
  } | null;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  classId: number;
  teacherId: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  contentBlocks?: ContentBlock[];
  videoStats?: {
    averageProgress: number;
    uniqueStudents: number;
    videoBlockCount: number;
  };
  videoSummary?: VideoProgressSummary[];
  studentProgress?: {
    progressPercentage: number;
    completedBlocks: number;
    totalBlocks: number;
    nextUncompletedTitle?: string;
    nextUncompletedBlockId?: number;
  };
  nextContent?: {
    blockId: number;
    type: 'video' | 'test' | 'mindmap' | 'text';
    title: string;
    isRequired: boolean;
    status: 'completed' | 'pending';
    progressPercentage?: number;
    videoId?: string | null;
    testId?: number | null;
  };
  assignedStudents?: Array<{
    id: number;
    name: string;
    email?: string | null;
  }>;
}

export interface ContentBlock {
  id: number;
  courseId: number;
  type: 'video' | 'test' | 'mindmap' | 'text';
  title: string;
  content: any;
  orderIndex: number;
  isRequired: boolean;
  createdAt: string;
  studentStatus?: ContentBlockStudentStatus;
}

export interface VideoProgress {
  id: number;
  studentId: number;
  studentName?: string;
  courseId?: number;
  videoBlockId: number;
  blockTitle?: string;
  blockType?: string;
  watchedDuration: number;
  totalDuration: number;
  progressPercentage: number;
  isCompleted: boolean;
  lastWatchedAt: string;
}

export interface Test {
  id: number;
  title: string;
  description?: string;
  teacherId: number;
  timeLimit?: number;
  totalScore?: number;
  isPublished: boolean;
  publishAt?: string | null;
  createdAt: string;
  dueDate?: string | null;
  classId?: number | null;
  className?: string | null;
  subjectName?: string | null;
}

export interface VideoProgressSummary {
  blockId: number;
  blockTitle: string;
  orderIndex: number;
  isRequired: boolean;
  trackedStudents: number;
  completedCount: number;
  averageProgress: number;
  lastActivityAt?: string | null;
}

export interface TestQuestion {
  id: number;
  testId: number;
  type: 'ox' | 'short_answer' | 'multiple_choice' | 'essay';
  questionText: string;
  questionData: any;
  points: number;
  orderIndex: number;
}

export interface TestSubmissionStatus {
  submissionId: number;
  isGraded: boolean;
  isPublished: boolean;
  score?: number | null;
  submittedAt: string;
}

export interface TestSummary extends Test {
  submissionStats?: {
    total: number;
    published: number;
    graded: number;
  };
  questionCount?: number;
}

export interface StudentTestSummary extends Test {
  courseId?: number;
  courseTitle?: string;
  blockId?: number;
  hasSubmitted?: boolean;
  submissionStatus?: TestSubmissionStatus | null;
}

export interface TestAttemptQuestion {
  id: number;
  type: TestQuestion['type'];
  questionText: string;
  points: number;
  orderIndex: number;
  questionData: any;
}

export interface TestAttempt {
  test: StudentTestSummary;
  questions: TestAttemptQuestion[];
}

export interface TestSubmissionResult {
  questionId: number;
  response: any;
  isCorrect?: boolean;
  awardedScore: number | null;
  maxScore: number;
  requiresManualGrading: boolean;
}

export interface TestSubmissionSummary {
  id: number;
  testId: number;
  studentId: number;
  studentName?: string;
  answers: {
    results?: TestSubmissionResult[] | null;
    feedback?: string | null;
    submittedAt?: string;
    gradedAt?: string;
  };
  score?: number | null;
  isGraded: boolean;
  isPublished: boolean;
  submittedAt: string;
  gradedAt?: string | null;
}

export type CalendarEventType = 'test_deadline' | 'teacher_schedule';

export interface CalendarEvent {
  id: number;
  eventType: CalendarEventType;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  classId?: number | null;
  className?: string | null;
  subjectName?: string | null;
  testId?: number | null;
  testTitle?: string | null;
  teacherId?: number | null;
  teacherName?: string | null;
  visibility: 'teacher_only' | 'class';
  relatedStudents?: Array<{ id: number; name: string }>;
}

export interface CalendarContextData {
  classes?: Array<{ id: number; name: string; subjectName?: string | null }>;
  tests?: Array<{ id: number; title: string }>;
  children?: Array<{ id: number; name: string; classId?: number | null; className?: string | null }>;
  class?: { id: number; name: string; subjectName?: string | null } | null;
}

export interface QnaItem {
  id: number;
  courseId: number;
  studentId: number;
  question: string;
  isPublic?: boolean;
  answer?: string | null;
  teacherId?: number | null;
  answeredAt?: string | null;
  createdAt: string;
  studentName?: string;
  teacherName?: string;
  courseTitle?: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'assignment' | 'answer' | 'grade' | 'announcement';
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: number;
  createdAt: string;
}

export interface AdminOverviewStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  pendingTeachers: number;
  totalParents: number;
}

export interface AdminOverview {
  stats: AdminOverviewStats;
  recentUsers: Array<Pick<User, 'id' | 'name' | 'role' | 'createdAt'>>;
  recentCourses: Array<{
    id: number;
    title: string;
    createdAt: string;
    teacherName?: string;
  }>;
  recentActivities: Array<{
    id: number;
    activityType: string;
    createdAt: string;
    studentName?: string;
  }>;
}

export interface AdminUser extends User {
  linkedStudentNumbers?: string | null;
  classId?: number | null;
}

export interface AdminCourseSummary extends Course {
  teacherName?: string;
  teacherEmail?: string;
  className?: string;
  gradeLevel?: number;
}

export interface AdminActivityReport {
  dailyActivity: Array<{
    date: string;
    totalActivities: number;
    activeStudents: number;
  }>;
  activityByType: Array<{
    activityType: string;
    count: number;
  }>;
}

export interface AdminSettings {
  allowRegistrations: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
  apiRateLimit: number;
}

export interface Subject {
  id: number;
  name: string;
  description?: string;
  gradeLevel?: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminClass {
  id: number;
  name: string;
  subjectId: number;
  subjectName?: string;
  teacherId?: number | null;
  teacherName?: string | null;
  gradeLevel?: number | null;
  maxStudents: number;
  studentCount?: number;
  isActive: boolean;
  createdAt: string;
}

export interface ClassStudent {
  id: number;
  name: string;
  email?: string | null;
  classId?: number | null;
  className?: string | null;
  classIds?: number[];
  classNames?: string[];
}

export interface ActivityLog {
  id: number;
  userId: number;
  activityType: 'video_watch' | 'test_complete' | 'question_ask' | 'login';
  relatedId?: number;
  metadata?: any;
  createdAt: string;
}

export interface StudentReportSummary {
  videoProgress: {
    totalVideos: number | null;
    completedVideos: number | null;
    averageProgress: number | null;
  };
  testSubmissions: {
    totalTests: number | null;
    gradedTests: number | null;
    averageScore: number | null;
  };
  questions: {
    totalQuestions: number | null;
    answeredQuestions: number | null;
  };
  loginActivity: {
    totalLogins: number | null;
  };
}

export interface ParentChildSummary {
  studentId: number;
  studentName: string;
  studentNumber: string;
  grade?: number | null;
  classId?: number | null;
  className?: string | null;
  subjectName?: string | null;
  relationship: 'father' | 'mother' | 'guardian';
  linkedAt: string;
}
