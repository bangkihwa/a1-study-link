import { query } from '../config/database';
import { User, Student } from '../types';

export class UserModel {
  // 사용자 정보 조회
  static async findById(id: number): Promise<User | null> {
    const users = await query(
      'SELECT id, username, role, name, email, phone, is_approved as isApproved, is_active as isActive, created_at as createdAt, updated_at as updatedAt FROM users WHERE id = ? AND is_active = TRUE',
      [id]
    ) as User[];
    
    return users.length > 0 ? users[0] : null;
  }

  // 사용자명으로 사용자 정보 조회
  static async findByUsername(username: string): Promise<User | null> {
    const users = await query(
      'SELECT id, username, password, role, name, email, phone, is_approved as isApproved, is_active as isActive, created_at as createdAt, updated_at as updatedAt FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    ) as User[];
    
    return users.length > 0 ? users[0] : null;
  }

  // 사용자 생성
  static async create(userData: {
    username: string;
    password: string;
    role: string;
    name: string;
    email?: string;
    phone?: string;
    isApproved: boolean;
  }): Promise<number> {
    const result = await query(
      'INSERT INTO users (username, password, role, name, email, phone, is_approved, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userData.username,
        userData.password,
        userData.role,
        userData.name,
        userData.email || null,
        userData.phone || null,
        userData.isApproved,
        true
      ]
    ) as any;
    
    return result.insertId;
  }

  // 학생 정보 조회
  static async findStudentByUserId(userId: number): Promise<Student | null> {
    const students = await query(
      'SELECT user_id as userId, student_number as studentNumber, grade, class_id as classId, enrollment_date as enrollmentDate FROM students WHERE user_id = ?',
      [userId]
    ) as Student[];
    
    return students.length > 0 ? students[0] : null;
  }

  // 학생 정보 생성
  static async createStudent(studentData: {
    userId: number;
    studentNumber: string;
  }): Promise<void> {
    await query(
      'INSERT INTO students (user_id, student_number, enrollment_date) VALUES (?, ?, CURDATE())',
      [studentData.userId, studentData.studentNumber]
    );
  }

  // 학부모-학생 관계 생성
  static async createParentStudentRelation(relationData: {
    parentId: number;
    studentId: number;
    studentCode: string;
    relationship: string;
  }): Promise<void> {
    await query(
      'INSERT INTO parent_student_relations (parent_id, student_id, student_code, relationship) VALUES (?, ?, ?, ?)',
      [relationData.parentId, relationData.studentId, relationData.studentCode, relationData.relationship]
    );
  }

  // 학생 번호로 학생 정보 조회
  static async findStudentByNumber(studentNumber: string): Promise<{userId: number, name: string} | null> {
    const students = await query(
      'SELECT s.user_id as userId, u.name FROM students s JOIN users u ON s.user_id = u.id WHERE s.student_number = ?',
      [studentNumber]
    ) as any[];
    
    return students.length > 0 ? students[0] : null;
  }

  // 특정 학생과 연결된 부모 수 조회
  static async countParentStudentRelations(studentId: number): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM parent_student_relations WHERE student_id = ?',
      [studentId]
    ) as any[];
    
    return result[0].count;
  }
}
