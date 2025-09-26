import { query } from '../config/database';

export interface StudentSummaryRecord {
  userId: number;
  name: string;
  email?: string | null;
  classId?: number | null;
  className?: string | null;
  classIds?: number[];
  classNames?: string[];
}

export interface StudentAssignmentDetail {
  classId: number;
  className: string;
  subjectId?: number | null;
  subjectName?: string | null;
  assignedAt?: Date | null;
  isClassActive: boolean;
}

export interface AssignableStudentRecord {
  userId: number;
  name: string;
  email?: string | null;
  grade?: number | null;
  activeClassCount: number;
  isInTargetClass: boolean;
  assignments: StudentAssignmentDetail[];
}

export interface AssignableStudentSearchFilters {
  page: number;
  pageSize: number;
  search?: string;
  subjectId?: number;
  classId?: number;
  grade?: number;
  assignment?: 'all' | 'current' | 'other' | 'unassigned' | 'multi';
  scopeClassId?: number;
}

export interface AssignableStudentSearchResult {
  students: AssignableStudentRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const buildStudentClassSubquery = () => `
  SELECT student_id, class_id FROM class_students
  UNION
  SELECT user_id AS student_id, class_id FROM students WHERE class_id IS NOT NULL
`;

export class StudentModel {
  static async findActiveByClassId(classId: number): Promise<StudentSummaryRecord[]> {
    const rows = await query(
      `SELECT DISTINCT u.id as userId,
              u.name,
              u.email,
              c.id as classId,
              c.name as className
       FROM users u
       LEFT JOIN (${buildStudentClassSubquery()}) sc ON sc.student_id = u.id
       LEFT JOIN classes c ON sc.class_id = c.id
       WHERE u.role = 'student'
         AND u.is_active = TRUE
         AND c.id = ?
       ORDER BY u.name ASC`,
      [classId]
    ) as StudentSummaryRecord[];

    return rows;
  }

  static async findActiveByIds(studentIds: number[]): Promise<StudentSummaryRecord[]> {
    if (!studentIds.length) {
      return [];
    }
    const placeholders = studentIds.map(() => '?').join(', ');
    const rows = await query(
      `SELECT DISTINCT u.id as userId,
              u.name,
              u.email,
              c.id as classId,
              c.name as className
       FROM users u
       LEFT JOIN (${buildStudentClassSubquery()}) sc ON sc.student_id = u.id
       LEFT JOIN classes c ON sc.class_id = c.id
       WHERE u.id IN (${placeholders})
         AND u.role = 'student'
         AND u.is_active = TRUE
       ORDER BY u.name ASC`,
      studentIds
    ) as StudentSummaryRecord[];

    return rows;
  }

  static async findActiveWithClassInfo(): Promise<StudentSummaryRecord[]> {
    const rows = await query(
      `SELECT u.id as userId,
              u.name,
              u.email,
              GROUP_CONCAT(DISTINCT c.id) as classIds,
              GROUP_CONCAT(DISTINCT c.name) as classNames
       FROM users u
       LEFT JOIN (${buildStudentClassSubquery()}) sc ON sc.student_id = u.id
       LEFT JOIN classes c ON sc.class_id = c.id
       WHERE u.role = 'student'
         AND u.is_active = TRUE
       GROUP BY u.id, u.name, u.email
       ORDER BY u.name ASC`
    ) as Array<{ userId: number; name: string; email?: string | null; classIds: string | null; classNames: string | null }>;

    return rows.map((row) => {
      const classIds = row.classIds ? row.classIds.split(',').map((id) => Number(id)) : [];
      const classNames = row.classNames ? row.classNames.split(',') : [];
      return {
        userId: row.userId,
        name: row.name,
        email: row.email,
        classId: classIds.length ? classIds[0] : null,
        className: classNames.length ? classNames[0] : null,
        classIds,
        classNames
      };
    });
  }

  static async findActiveByClassIds(classIds: number[]): Promise<StudentSummaryRecord[]> {
    if (!classIds.length) {
      return [];
    }
    const placeholders = classIds.map(() => '?').join(', ');
    const rows = await query(
      `SELECT DISTINCT u.id as userId,
              u.name,
              u.email,
              c.id as classId,
              c.name as className
       FROM users u
       LEFT JOIN (${buildStudentClassSubquery()}) sc ON sc.student_id = u.id
       LEFT JOIN classes c ON sc.class_id = c.id
       WHERE c.id IN (${placeholders})
         AND u.role = 'student'
         AND u.is_active = TRUE
       ORDER BY u.name ASC`,
      classIds
    ) as StudentSummaryRecord[];

    return rows;
  }

  static async updateClass(userId: number, classId: number | null): Promise<void> {
    await query('UPDATE students SET class_id = ? WHERE user_id = ?', [classId, userId]);
  }
}

export default StudentModel;
