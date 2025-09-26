import { query, getConnection } from '../config/database';
import { AdminOverview, AdminSettings, AdminUserSummary } from '../types';
import { ReportService } from './reportService';
import { UserService } from './userService';
import { CourseService } from './courseService';
import SystemSettingsService from './systemSettingsService';
import { UserModel } from '../models/userModel';
import StudentModel from '../models/studentModel';
import ClassModel from '../models/classModel';

interface UserFilterOptions {
  role?: string;
  status?: 'pending' | 'active' | 'inactive';
  search?: string;
}

interface CreateUserPayload {
  username: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'parent';
  email?: string;
  phone?: string;
  studentNumber?: string;
  relationship?: string;
  isApproved?: boolean;
}

export class AdminManagementService {
  static async getOverview(): Promise<AdminOverview> {
    const [students, teachers, parents, courses, pendingTeachers, recentUsers, recentCourses, recentActivities] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = TRUE', ['student']) as Promise<any[]>,
      query('SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = TRUE', ['teacher']) as Promise<any[]>,
      query('SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = TRUE', ['parent']) as Promise<any[]>,
      query('SELECT COUNT(*) as count FROM courses', []) as Promise<any[]>,
      query('SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = TRUE AND is_approved = FALSE', ['teacher']) as Promise<any[]>,
      query(`SELECT id, username, role, name, email, phone, is_approved as isApproved, is_active as isActive, created_at as createdAt, updated_at as updatedAt
             FROM users
             ORDER BY created_at DESC
             LIMIT 5`, []) as Promise<AdminUserSummary[]>,
      query(`SELECT c.id, c.title, c.created_at as createdAt, u.name as teacherName
             FROM courses c
             LEFT JOIN users u ON c.teacher_id = u.id
             ORDER BY c.created_at DESC
             LIMIT 5`, []) as Promise<any[]>,
      query(`SELECT al.id, al.activity_type as activityType, al.created_at as createdAt, u.name as studentName
             FROM activity_logs al
             LEFT JOIN users u ON al.student_id = u.id
             ORDER BY al.created_at DESC
             LIMIT 10`, []) as Promise<any[]>
    ]);

    return {
      stats: {
        totalStudents: students[0]?.count ?? 0,
        totalTeachers: teachers[0]?.count ?? 0,
        totalCourses: courses[0]?.count ?? 0,
        pendingTeachers: pendingTeachers[0]?.count ?? 0,
        totalParents: parents[0]?.count ?? 0
      },
      recentUsers,
      recentCourses: recentCourses.map((course: any) => ({
        id: course.id,
        title: course.title,
        createdAt: course.createdAt,
        teacherName: course.teacherName || undefined
      })),
      recentActivities: recentActivities.map((activity: any) => ({
        id: activity.id,
        activityType: activity.activityType,
        createdAt: activity.createdAt,
        studentName: activity.studentName || undefined
      }))
    };
  }

  static async getUsers(filters: UserFilterOptions = {}): Promise<AdminUserSummary[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.role && filters.role !== 'all') {
      conditions.push('role = ?');
      params.push(filters.role);
    }

    if (filters.status) {
      if (filters.status === 'pending') {
        conditions.push('is_approved = FALSE');
      } else if (filters.status === 'active') {
        conditions.push('is_active = TRUE');
      } else if (filters.status === 'inactive') {
        conditions.push('is_active = FALSE');
      }
    }

    if (filters.search) {
      conditions.push('(username LIKE ? OR name LIKE ? OR email LIKE ?)');
      const keyword = `%${filters.search}%`;
      params.push(keyword, keyword, keyword);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const users = await query(
      `SELECT 
         u.id,
         u.username,
         u.role,
         u.name,
         u.email,
         u.phone,
         u.is_approved AS isApproved,
         u.is_active AS isActive,
         u.created_at AS createdAt,
         u.updated_at AS updatedAt,
         s.student_number AS studentNumber,
         s.class_id AS classId,
         p.linkedStudentNumbers AS linkedStudentNumbers
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN (
         SELECT
           ps.parent_id,
           GROUP_CONCAT(st.student_number ORDER BY st.student_number SEPARATOR ', ') AS linkedStudentNumbers
         FROM parent_student_relations ps
         JOIN students st ON ps.student_id = st.user_id
         GROUP BY ps.parent_id
       ) p ON p.parent_id = u.id
       ${whereClause}
       ORDER BY u.created_at DESC`,
      params
    ) as AdminUserSummary[];

    return users;
  }

  static async approveUser(userId: number): Promise<void> {
    await query('UPDATE users SET is_approved = TRUE, updated_at = NOW() WHERE id = ?', [userId]);
  }

  static async updateUser(userId: number, updates: Partial<AdminUserSummary> & { classId?: number | null }): Promise<void> {
    const existingRows = await query(
      'SELECT id, role FROM users WHERE id = ? LIMIT 1',
      [userId]
    ) as Array<{ id: number; role: string }>;

    if (!existingRows.length) {
      throw new Error('User not found');
    }

    const existingRole = existingRows[0].role as 'admin' | 'teacher' | 'student' | 'parent';
    const targetRole = (updates.role as any) ?? existingRole;

    const fields: string[] = [];
    const params: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      params.push(updates.name);
    }

    if (updates.email !== undefined) {
      fields.push('email = ?');
      params.push(updates.email || null);
    }

    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      params.push(updates.phone || null);
    }

    if (updates.role !== undefined) {
      fields.push('role = ?');
      params.push(updates.role);
    }

    if (updates.isApproved !== undefined) {
      fields.push('is_approved = ?');
      params.push(updates.isApproved);
    }

    if ((updates as any).isActive !== undefined) {
      fields.push('is_active = ?');
      params.push((updates as any).isActive);
    }

    if (fields.length > 0) {
      params.push(userId);
      await query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, params);
    }

    if (updates.classId !== undefined && targetRole === 'student') {
      if (updates.classId === null) {
        await StudentModel.updateClass(userId, null);
      } else {
        const classRecord = await ClassModel.findById(updates.classId);
        if (!classRecord) {
          throw new Error('Class not found');
        }
        await StudentModel.updateClass(userId, updates.classId);
      }
    } else if (updates.classId !== undefined && targetRole !== 'student') {
      await StudentModel.updateClass(userId, null);
    }
  }

  static async deactivateUser(userId: number): Promise<void> {
    await query('UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = ?', [userId]);
  }

  static async deleteUser(userId: number): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      // 공통 데이터 먼저 정리 (외래 키 순서 중요)
      // 알림 삭제
      await connection.execute('DELETE FROM notifications WHERE user_id = ?', [userId]);

      // 학생인 경우 관련 데이터 정리
      if (user.role === 'student') {
        // 활동 로그 삭제
        await connection.execute('DELETE FROM activity_logs WHERE student_id = ?', [userId]);
        // 비디오 진도 삭제
        await connection.execute('DELETE FROM video_progress WHERE student_id = ?', [userId]);
        // 테스트 제출 삭제
        await connection.execute('DELETE FROM test_submissions WHERE student_id = ?', [userId]);
        // QnA 삭제 (학생이 작성한 질문)
        await connection.execute('DELETE FROM qna WHERE student_id = ?', [userId]);
        // 코스 배정 삭제
        await connection.execute('DELETE FROM course_students WHERE student_id = ?', [userId]);
        // 부모-학생 관계 삭제
        await connection.execute('DELETE FROM parent_student_relations WHERE student_id = ?', [userId]);
        // 학생 테이블에서 삭제
        await connection.execute('DELETE FROM students WHERE user_id = ?', [userId]);
      }

      // 교사인 경우 관련 데이터 정리
      if (user.role === 'teacher') {
        // 캘린더 이벤트 삭제
        await connection.execute('DELETE FROM calendar_events WHERE teacher_id = ?', [userId]);
        
        // 교사가 생성한 테스트의 제출 기록 삭제
        await connection.execute(
          'DELETE FROM test_submissions WHERE test_id IN (SELECT id FROM tests WHERE teacher_id = ?)',
          [userId]
        );
        // 교사가 생성한 테스트의 문제 삭제
        await connection.execute(
          'DELETE FROM test_questions WHERE test_id IN (SELECT id FROM tests WHERE teacher_id = ?)',
          [userId]
        );
        // 교사가 생성한 테스트 삭제
        await connection.execute('DELETE FROM tests WHERE teacher_id = ?', [userId]);
        
        // QnA에서 교사 답변 삭제 (teacher_id를 NULL로 설정)
        await connection.execute('UPDATE qna SET teacher_id = NULL, answer = NULL, answered_at = NULL WHERE teacher_id = ?', [userId]);
        
        // 교사 강의의 콘텐츠 블록에 연결된 비디오 진도 삭제
        await connection.execute(
          'DELETE FROM video_progress WHERE video_block_id IN (SELECT id FROM content_blocks WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = ?))',
          [userId]
        );
        
        // 교사 강의의 QnA 삭제
        await connection.execute(
          'DELETE FROM qna WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = ?)',
          [userId]
        );
        
        // 교사 강의의 학생 배정 삭제
        await connection.execute(
          'DELETE FROM course_students WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = ?)',
          [userId]
        );
        
        // 교사 강의의 콘텐츠 블록 삭제
        await connection.execute(
          'DELETE FROM content_blocks WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = ?)',
          [userId]
        );
        
        // 교사가 생성한 강의 삭제
        await connection.execute('DELETE FROM courses WHERE teacher_id = ?', [userId]);
        
        // 담당 클래스에서 교사 ID 제거
        await connection.execute('UPDATE classes SET teacher_id = NULL WHERE teacher_id = ?', [userId]);
      }

      // 학부모인 경우 관련 데이터 정리
      if (user.role === 'parent') {
        // 부모-학생 관계 삭제
        await connection.execute('DELETE FROM parent_student_relations WHERE parent_id = ?', [userId]);
      }

      // 마지막으로 사용자 삭제
      await connection.execute('DELETE FROM users WHERE id = ?', [userId]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Error deleting user:', error);
      throw new Error('사용자를 삭제하는 중 오류가 발생했습니다.');
    } finally {
      connection.release();
    }
  }

  static async createUser(payload: CreateUserPayload) {
    switch (payload.role) {
      case 'student':
        return await UserService.registerStudent({
          username: payload.username,
          password: payload.password,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          studentNumber: payload.studentNumber,
          isApproved: payload.isApproved ?? false
        });

      case 'parent':
        if (!payload.studentNumber) {
          throw new Error('Student number is required for parent accounts');
        }
        return await UserService.registerParent({
          username: payload.username,
          password: payload.password,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          studentNumber: payload.studentNumber,
          relationship: payload.relationship,
          isApproved: payload.isApproved ?? false
        });

      case 'teacher':
        const settings = await SystemSettingsService.getCachedSettings();
        return await UserService.registerTeacher({
          username: payload.username,
          password: payload.password,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          autoApprove: settings.autoApproveTeachers,
          isApproved: payload.isApproved ?? false
        });

      default:
        throw new Error('Unsupported role');
    }
  }

  static async getCourses(): Promise<any[]> {
    return await CourseService.getAdminCourseSummaries();
  }

  static async getActivityReport(startDate: string, endDate: string) {
    return await ReportService.getAdminActivityReport(startDate, endDate);
  }

  static async getSettings(): Promise<AdminSettings> {
    const { autoApproveTeachers: _autoApproveTeachers, ...settings } = await SystemSettingsService.getCachedSettings();
    return settings;
  }

  static async updateSettings(partial: Partial<AdminSettings>): Promise<AdminSettings> {
    const { autoApproveTeachers: _autoApproveTeachers, ...settings } = await SystemSettingsService.updateSettings(partial);
    return settings;
  }
}

export default AdminManagementService;
