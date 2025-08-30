// 메모리 기반 데이터베이스 (PostgreSQL 없이 테스트용)
import { User, Class, Lecture, LectureContent, StudentQuestion } from '../types';

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

  // 일반 쿼리 메소드 (기존 코드 호환을 위해)
  async query(text: string, params: any[] = []) {
    // 간단한 쿼리 파싱 및 실행
    console.log('Memory DB Query:', text, params);
    
    // 로그인 쿼리 처리
    if (text.includes('SELECT * FROM users WHERE username = $1')) {
      return this.findUserByUsername(params[0]);
    }
    
    // 프로필 쿼리 처리
    if (text.includes('SELECT id, username, email, name, phone, role, is_approved, created_at, updated_at FROM users WHERE id = $1')) {
      const user = this.db.users.find(u => u.id === params[0]);
      if (user) {
        const { password_hash, ...userWithoutPassword } = user;
        return { rows: [userWithoutPassword], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }
    
    // 사용자 중복 체크
    if (text.includes('SELECT id FROM users WHERE username = $1 OR email = $2')) {
      const existing = this.db.users.find(u => u.username === params[0] || u.email === params[1]);
      return existing ? { rows: [{ id: existing.id }], rowCount: 1 } : { rows: [], rowCount: 0 };
    }
    
    // 회원가입 쿼리 처리
    if (text.includes('INSERT INTO users') && text.includes('RETURNING')) {
      return this.createUser({
        username: params[0],
        email: params[1],
        password_hash: params[2],
        name: params[3],
        phone: params[4],
        role: params[5]
      });
    }

    // 학생 대시보드 관련 쿼리들
    if (text.includes('student_lecture_progress') || text.includes('student_questions') || text.includes('student_assignments')) {
      // 기본 통계 반환
      return {
        rows: [{
          total_lectures: 10,
          completed_lectures: 7,
          pending_questions: 2,
          total_assignments: 5,
          submitted_assignments: 4,
          graded_assignments: 3
        }],
        rowCount: 1
      };
    }

    // 기본 반환값
    return { rows: [], rowCount: 0 };
  }
}

export default new MemoryDb();