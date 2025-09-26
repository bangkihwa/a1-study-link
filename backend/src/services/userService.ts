import { UserModel } from '../models/userModel';
import { hashPassword, generateStudentNumber } from '../utils/auth';
import { User } from '../types';

export class UserService {
  // 사용자 정보 조회
  static async getUserById(id: number): Promise<User | null> {
    return await UserModel.findById(id);
  }

  // 학생 등록
  static async registerStudent(userData: {
    username: string;
    password: string;
    name: string;
    email?: string;
    phone?: string;
    studentNumber?: string;
    isApproved?: boolean;
  }): Promise<{ userId: number; username: string; name: string; studentNumber: string; isApproved: boolean }> {
    // 사용자명 중복 확인
    const existingUser = await UserModel.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(userData.password);

    // 고유 학번 생성 또는 검증
    let studentNumber = (userData.studentNumber || '').trim().toUpperCase();

    if (studentNumber) {
      const existingStudent = await UserModel.findStudentByNumber(studentNumber);
      if (existingStudent) {
        throw new Error('Student number already exists');
      }
    } else {
      do {
        studentNumber = generateStudentNumber();
        const existingStudent = await UserModel.findStudentByNumber(studentNumber);
        if (!existingStudent) break;
      } while (true);
    }

    const isApproved = userData.isApproved ?? true;

    // 사용자 생성
    const userId = await UserModel.create({
      username: userData.username,
      password: hashedPassword,
      role: 'student',
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      isApproved
    });

    // 학생 정보 생성
    await UserModel.createStudent({
      userId,
      studentNumber
    });

    return {
      userId,
      username: userData.username,
      name: userData.name,
      studentNumber,
      isApproved
    };
  }

  // 학부모 등록
  static async registerParent(userData: {
    username: string;
    password: string;
    name: string;
    email?: string;
    phone?: string;
    studentNumber: string;
    relationship?: string;
    isApproved?: boolean;
  }): Promise<{
    userId: number;
    username: string;
    name: string;
    linkedStudentNumber: string;
    relationship: string;
    isApproved: boolean;
  }> {
    // 사용자명 중복 확인
    const existingUser = await UserModel.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // 학번으로 학생 정보 조회
    const targetStudentNumber = userData.studentNumber.trim().toUpperCase();
    const providedStudentCode = targetStudentNumber;
    const student = await UserModel.findStudentByNumber(targetStudentNumber);
    if (!student) {
      throw new Error('Student number not found');
    }

    // 해당 학생에게 연결된 부모 수 확인 (최대 2명)
    const parentCount = await UserModel.countParentStudentRelations(student.userId);
    if (parentCount >= 2) {
      throw new Error('Student already has maximum number of parents linked');
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(userData.password);
    const isApproved = userData.isApproved ?? true;
    const relationship = userData.relationship || 'guardian';

    // 사용자 생성
    const userId = await UserModel.create({
      username: userData.username,
      password: hashedPassword,
      role: 'parent',
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      isApproved
    });

    // 학부모-학생 관계 생성
    await UserModel.createParentStudentRelation({
      parentId: userId,
      studentId: student.userId,
      relationship,
      studentCode: providedStudentCode
    });

    return {
      userId,
      username: userData.username,
      name: userData.name,
      linkedStudentNumber: targetStudentNumber,
      relationship,
      isApproved
    };
  }

  // 교사 등록
  static async registerTeacher(userData: {
    username: string;
    password: string;
    name: string;
    email?: string;
    phone?: string;
    autoApprove?: boolean;
    isApproved?: boolean;
  }): Promise<{ userId: number; username: string; name: string; isApproved: boolean }> {
    // 사용자명 중복 확인
    const existingUser = await UserModel.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(userData.password);
    const isApproved = userData.isApproved ?? userData.autoApprove ?? false;

    // 사용자 생성 (승인 대기 상태)
    const userId = await UserModel.create({
      username: userData.username,
      password: hashedPassword,
      role: 'teacher',
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      isApproved
    });

    return {
      userId,
      username: userData.username,
      name: userData.name,
      isApproved
    };
  }

  // 학생 번호 유효성 검사
  static async validateStudentNumber(studentNumber: string): Promise<{
    isValid: boolean;
    studentName?: string;
    canLink?: boolean;
  }> {
    const student = await UserModel.findStudentByNumber(studentNumber);
    
    if (!student) {
      return { isValid: false };
    }

    // 해당 학생에게 연결된 부모 수 확인
    const parentCount = await UserModel.countParentStudentRelations(student.userId);
    const canLink = parentCount < 2;

    return {
      isValid: true,
      studentName: student.name,
      canLink
    };
  }
}
