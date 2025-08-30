export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export type SubjectType = 
  | 'middle_prep'      // 중선
  | 'middle_1'         // 중등1
  | 'middle_2'         // 중등2
  | 'middle_3'         // 중등3
  | 'integrated_science' // 통합과학
  | 'physics'          // 물리
  | 'chemistry'        // 화학
  | 'biology'          // 생명
  | 'earth_science';   // 지구과학

export type ContentType = 'video' | 'ox_test' | 'smo_test' | 'mindmap' | 'assignment';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: number;
  name: string;
  subject: SubjectType;
  teacher_id: number;
  teacher_name?: string;
  description?: string;
  created_at: string;
  student_count?: number;
}

export interface Lecture {
  id: number;
  title: string;
  description?: string;
  class_id: number;
  class_name?: string;
  teacher_id: number;
  order_index: number;
  is_published: boolean;
  is_completed?: boolean;
  completion_date?: string;
  study_time_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface LectureContent {
  id: number;
  lecture_id: number;
  type: ContentType;
  title: string;
  content_url?: string;
  content_data?: any;
  order_index: number;
  is_completed?: boolean;
  score?: number;
  attempts?: number;
  completion_date?: string;
  created_at: string;
}

export interface StudentQuestion {
  id: number;
  student_id: number;
  student_name?: string;
  lecture_id: number;
  lecture_title?: string;
  content_id?: number;
  content_title?: string;
  question: string;
  difficulty_level: number;
  timestamp_in_content?: number;
  is_resolved: boolean;
  feedback_text?: string;
  feedback_date?: string;
  teacher_name?: string;
  created_at: string;
}

export interface Assignment {
  id: number;
  title: string;
  description?: string;
  class_id: number;
  class_name?: string;
  teacher_id: number;
  due_date?: string;
  is_published: boolean;
  is_submitted?: boolean;
  is_overdue?: boolean;
  submitted_at?: string;
  score?: number;
  teacher_comment?: string;
  is_graded?: boolean;
  created_at: string;
}

export const SUBJECT_LABELS: Record<SubjectType, string> = {
  middle_prep: '중선',
  middle_1: '중등1',
  middle_2: '중등2', 
  middle_3: '중등3',
  integrated_science: '통합과학',
  physics: '물리',
  chemistry: '화학',
  biology: '생명',
  earth_science: '지구과학'
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  video: '동영상',
  ox_test: 'OX 테스트',
  smo_test: 'SMO 테스트',
  mindmap: '마인드맵',
  assignment: '과제'
};