export interface User {
  id: number;
  username: string;
  password?: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  name: string;
  email?: string;
  phone?: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  studentNumber?: string | null;
}

export interface Student {
  userId: number;
  studentNumber: string;
  grade?: number;
  classId?: number;
  enrollmentDate?: Date;
}

export interface ParentStudentRelation {
  id: number;
  parentId: number;
  studentId: number;
  relationship: 'father' | 'mother' | 'guardian';
  createdAt: Date;
}

export interface Subject {
  id: number;
  name: string;
  description?: string;
  gradeLevel?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Class {
  id: number;
  name: string;
  subjectId: number;
  teacherId?: number;
  gradeLevel?: number;
  maxStudents: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CourseStudent {
  id: number;
  name: string;
  email?: string | null;
  classId?: number | null;
  className?: string | null;
}

export interface ContentBlockStudentStatus {
  isCompleted: boolean;
  progressPercentage?: number;
  watchedDuration?: number;
  totalDuration?: number;
  lastWatchedAt?: Date | null;
  hasSubmission?: boolean;
  submissionStatus?: {
    submissionId: number;
    isGraded: boolean;
    isPublished: boolean;
    score?: number | null;
    submittedAt?: Date | null;
  } | null;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  classId: number;
  teacherId: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  videoStats?: {
    averageProgress: number;
    uniqueStudents: number;
    videoBlockCount: number;
  };
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
  assignedStudents?: CourseStudent[];
}

export interface ContentBlock {
  id: number;
  courseId: number;
  type: 'video' | 'test' | 'mindmap' | 'text';
  title: string;
  content: any;
  orderIndex: number;
  isRequired: boolean;
  createdAt: Date;
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
  lastWatchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoProgressSummary {
  blockId: number;
  blockTitle: string;
  orderIndex: number;
  isRequired: boolean;
  trackedStudents: number;
  completedCount: number;
  averageProgress: number;
  lastActivityAt: Date | null;
}

export interface Test {
  id: number;
  title: string;
  description?: string;
  teacherId: number;
  timeLimit?: number;
  totalScore: number;
  isPublished: boolean;
  publishAt?: Date | null;
  dueDate?: Date | null;
  classId?: number | null;
  className?: string | null;
  subjectName?: string | null;
  createdAt: Date;
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
  relatedStudents?: {
    id: number;
    name: string;
  }[];
}

export interface CalendarContextData {
  classes?: Array<{
    id: number;
    name: string;
    subjectName?: string | null;
  }>;
  tests?: Array<{
    id: number;
    title: string;
  }>;
  children?: Array<{
    id: number;
    name: string;
    classId?: number | null;
    className?: string | null;
  }>;
  class?: {
    id: number;
    name: string;
    subjectName?: string | null;
  } | null;
}

export interface TestQuestion {
  id: number;
  testId: number;
  type: 'ox' | 'short_answer' | 'multiple_choice' | 'essay';
  questionText: string;
  questionData: any;
  points: number;
  orderIndex: number;
  createdAt: Date;
}

export interface TestSubmission {
  id: number;
  testId: number;
  studentId: number;
  answers: any;
  score?: number;
  isGraded: boolean;
  isPublished: boolean;
  submittedAt: Date;
  gradedAt?: Date;
}

export interface QnA {
  id: number;
  courseId: number;
  studentId: number;
  question: string;
  isPublic: boolean;
  answer?: string;
  teacherId?: number;
  answeredAt?: Date;
  createdAt: Date;
  studentName?: string;
  teacherName?: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'assignment' | 'answer' | 'grade' | 'announcement';
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: number;
  createdAt: Date;
}

export interface ActivityLog {
  id: number;
  studentId: number;
  activityType: 'video_watch' | 'test_complete' | 'question_ask' | 'login';
  relatedId?: number;
  metadata?: any;
  createdAt: Date;
}

import { Request } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface AdminOverview {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    pendingTeachers: number;
    totalParents: number;
  };
  recentUsers: Array<Pick<User, 'id' | 'name' | 'role' | 'createdAt'>>;
  recentCourses: Array<{
    id: number;
    title: string;
    createdAt: Date;
    teacherName?: string;
  }>;
  recentActivities: Array<{
    id: number;
    activityType: string;
    createdAt: Date;
    studentName?: string;
  }>;
}

export interface AdminUserSummary extends User {
  username: string;
  studentNumber?: string | null;
  linkedStudentNumbers?: string | null;
  classId?: number | null;
}

export interface AdminCourseSummary extends Course {
  teacherName?: string;
  className?: string;
}

export interface AdminSettings {
  allowRegistrations: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
  apiRateLimit: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterStudentRequest {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface RegisterParentRequest {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
  studentNumber: string;
  relationship?: 'father' | 'mother' | 'guardian';
}

export interface RegisterTeacherRequest {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
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
  linkedAt: Date;
}
