// 메모리 기반 데이터베이스 (PostgreSQL 없이 테스트용)
import { 
    User, AuthUser, Class, Lecture, LectureContent, StudentQuestion,
    UserRole, SubjectType, ContentType 
} from '../types';
import * as fs from 'fs';
import * as path from 'path';

interface MemoryDatabase {
  users: (User & { password_hash: string })[];
  classes: Class[];
  lectures: Lecture[];
  lecture_contents: LectureContent[];
  student_questions: StudentQuestion[];
  class_students: { class_id: number; student_id: number }[];
  parent_students: { parent_id: number; student_id: number }[];
}

class MemoryDb {
  private db: MemoryDatabase = {
    users: [
      {
        id: 1,
        username: 'admin',
        email: 'admin@a1science.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdyJE.BQRs.X9ZS', // password: admin123
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
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdyJE.BQRs.X9ZS', // password: admin123
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
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdyJE.BQRs.X9ZS', // password: admin123
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
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdyJE.BQRs.X9ZS', // password: admin123
        role: 'parent',
        name: '홍길동부모',
        phone: '010-4567-8901',
        is_approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    classes: [
      {
        id: 1,
        name: '중등3 물리반',
        subject: 'physics',
        teacher_id: 2,
        description: '중학교 3학년 물리 과목',
        created_at: new Date().toISOString()
      }
    ],
    lectures: [],
    lecture_contents: [],
    student_questions: [],
    class_students: [
      { class_id: 1, student_id: 3 }
    ],
    parent_students: [
      { parent_id: 4, student_id: 3 }
    ]
  };

  // 사용자 관련 쿼리
  async findUserByUsername(username: string) {
    const user = this.db.users.find(u => u.username === username);
    return user ? { rows: [user], rowCount: 1 } : { rows: [], rowCount: 0 };
  }

  async findUserById(id: number) {
    const user = this.db.users.find(u => u.id === id);
    return user ? { rows: [user], rowCount: 1 } : { rows: [], rowCount: 0 };
  }

  async findUserByEmail(email: string) {
    const user = this.db.users.find(u => u.email === email);
    return user ? { rows: [user], rowCount: 1 } : { rows: [], rowCount: 0 };
  }

  async createUser(userData: {
    username: string;
    email: string;
    password_hash: string;
    name: string;
    phone?: string;
    role: string;
  }) {
    const newId = Math.max(...this.db.users.map(u => u.id)) + 1;
    const newUser = {
      id: newId,
      ...userData,
      role: userData.role as any,
      is_approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.db.users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }

  async query(text: string, params: any[] = []): Promise<any> {
    // This is a mock implementation
    console.warn(`MemoryDb.query is a mock and does not execute: ${text}`);
    // This is a mock. You might want to return some predictable data for testing.
    if (text.startsWith('SELECT id, username, email, name, role, is_approved, created_at FROM users')) {
      let users = this.db.users.map(u => ({...u}));
      if (params.length > 0) {
        // basic filtering for WHERE clauses
        if (text.includes('WHERE id = $1')) {
            users = users.filter(u => u.id === params[0]);
        }
      }
      return { rows: users, rowCount: users.length };
    }
    return { rows: [], rowCount: 0 };
  }
}

export const db = new MemoryDb();