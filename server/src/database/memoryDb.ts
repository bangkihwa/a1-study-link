// 메모리 기반 데이터베이스 (PostgreSQL 없이 테스트용)
import { 
    User, AuthUser, Class, Lecture, LectureContent, StudentQuestion,
    UserRole, SubjectType, ContentType 
} from '../types';
import * as fs from 'fs';
import * as path from 'path';

// Load data using fs to avoid issues with module resolution in compiled JS
const loadJSON = (filename: string) => {
  const filePath = path.join(__dirname, '../../data', filename);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return [];
};

const usersData = loadJSON('users.json');

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
    users: usersData.map((u: any) => ({ ...u, role: u.role as UserRole })),
    classes: [],
    lectures: [],
    lecture_contents: [],
    student_questions: [],
    class_students: [],
    parent_students: [],
  };

  constructor() {
    this.loadDataFromFiles();
  }

  private loadDataFromFiles() {
    try {
      this.db.classes = loadJSON('classes.json');
      this.db.lectures = loadJSON('lectures.json');
      this.db.lecture_contents = loadJSON('lecture_contents.json');
      this.db.class_students = loadJSON('enrollments.json');
    } catch (e) {
      console.error("Error loading data files for MemoryDb", e);
    }
  }

  private saveData(filename: string, data: any) {
    try {
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      console.log(`Data saved to ${filename}`);
    } catch (e) {
      console.error(`Error saving data to ${filename}`, e);
    }
  }

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