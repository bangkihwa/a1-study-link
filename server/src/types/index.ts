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

export interface AuthUser extends User {
  password_hash: string;
}

export interface Class {
  id: number;
  name: string;
  subject: SubjectType;
  teacher_id: number;
  description?: string;
  created_at: string;
}

export interface Lecture {
  id: number;
  title: string;
  description?: string;
  class_id: number;
  teacher_id: number;
  order_index: number;
  is_published: boolean;
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

export interface JWTPayload {
  userId: number;
  role: UserRole;
  iat: number;
  exp: number;
}