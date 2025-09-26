import { query } from '../config/database';

export interface ClassRecord {
  id: number;
  name: string;
  subjectId: number;
  teacherId?: number | null;
  gradeLevel?: number | null;
  maxStudents: number;
  isActive: boolean;
  createdAt: Date;
  subjectName?: string;
  teacherName?: string;
  studentCount?: number;
}

const CLASS_STUDENT_MAP_SUBQUERY = `
  SELECT class_id, student_id FROM class_students
  UNION
  SELECT class_id, user_id AS student_id FROM students WHERE class_id IS NOT NULL
`;

export class ClassModel {
  static async findAll(includeInactive = false): Promise<ClassRecord[]> {
    const whereClause = includeInactive ? '' : 'WHERE c.is_active = TRUE';
    const classes = await query(
      `SELECT c.id,
              c.name,
              c.subject_id as subjectId,
              c.teacher_id as teacherId,
              c.grade_level as gradeLevel,
              c.max_students as maxStudents,
              c.is_active as isActive,
              c.created_at as createdAt,
              s.name as subjectName,
              u.name as teacherName,
              COALESCE(sc.studentCount, 0) as studentCount
       FROM classes c
       LEFT JOIN subjects s ON c.subject_id = s.id
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN (
         SELECT class_id, COUNT(DISTINCT student_id) AS studentCount
         FROM (${CLASS_STUDENT_MAP_SUBQUERY}) class_students_union
         GROUP BY class_id
       ) sc ON sc.class_id = c.id
       ${whereClause}
       ORDER BY c.created_at DESC`
    ) as ClassRecord[];

    return classes;
  }

  static async findById(id: number): Promise<ClassRecord | null> {
    const classes = await query(
      `SELECT c.id,
              c.name,
              c.subject_id as subjectId,
              c.teacher_id as teacherId,
              c.grade_level as gradeLevel,
              c.max_students as maxStudents,
              c.is_active as isActive,
              c.created_at as createdAt,
              s.name as subjectName,
              u.name as teacherName,
              COALESCE(sc.studentCount, 0) as studentCount
       FROM classes c
       LEFT JOIN subjects s ON c.subject_id = s.id
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN (
         SELECT class_id, COUNT(DISTINCT student_id) AS studentCount
         FROM (${CLASS_STUDENT_MAP_SUBQUERY}) class_students_union
         GROUP BY class_id
       ) sc ON sc.class_id = c.id
       WHERE c.id = ?`,
      [id]
    ) as ClassRecord[];

    return classes.length > 0 ? classes[0] : null;
  }

  static async findByTeacherId(teacherId: number): Promise<ClassRecord[]> {
    const classes = await query(
      `SELECT c.id,
              c.name,
              c.subject_id as subjectId,
              c.teacher_id as teacherId,
              c.grade_level as gradeLevel,
              c.max_students as maxStudents,
              c.is_active as isActive,
              c.created_at as createdAt,
              s.name as subjectName,
              u.name as teacherName,
              COALESCE(sc.studentCount, 0) as studentCount
       FROM classes c
       LEFT JOIN subjects s ON c.subject_id = s.id
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN (
         SELECT class_id, COUNT(DISTINCT student_id) AS studentCount
         FROM (${CLASS_STUDENT_MAP_SUBQUERY}) class_students_union
         GROUP BY class_id
       ) sc ON sc.class_id = c.id
       WHERE c.teacher_id = ? AND c.is_active = TRUE
       ORDER BY c.created_at DESC`,
      [teacherId]
    ) as ClassRecord[];

    return classes;
  }

  static async create(classData: {
    name: string;
    subjectId: number;
    teacherId?: number | null;
    gradeLevel?: number | null;
    maxStudents?: number;
    isActive?: boolean;
  }): Promise<number> {
    const result = await query(
      `INSERT INTO classes (name, subject_id, teacher_id, grade_level, max_students, is_active)
       VALUES (?, ?, ?, ?, ?, ?)` ,
      [
        classData.name,
        classData.subjectId,
        classData.teacherId ?? null,
        classData.gradeLevel ?? null,
        classData.maxStudents ?? 30,
        classData.isActive ?? true
      ]
    ) as any;

    return result.insertId;
  }

  static async update(id: number, updates: {
    name?: string;
    subjectId?: number;
    teacherId?: number | null;
    gradeLevel?: number | null;
    maxStudents?: number;
    isActive?: boolean;
  }): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      params.push(updates.name);
    }

    if (updates.subjectId !== undefined) {
      fields.push('subject_id = ?');
      params.push(updates.subjectId);
    }

    if (updates.teacherId !== undefined) {
      fields.push('teacher_id = ?');
      params.push(updates.teacherId ?? null);
    }

    if (updates.gradeLevel !== undefined) {
      fields.push('grade_level = ?');
      params.push(updates.gradeLevel);
    }

    if (updates.maxStudents !== undefined) {
      fields.push('max_students = ?');
      params.push(updates.maxStudents);
    }

    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      params.push(updates.isActive);
    }

    if (fields.length === 0) {
      return;
    }

    params.push(id);

    // Avoid referencing non-existent updated_at column in current schema
    await query(
      `UPDATE classes SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }

  static async delete(id: number): Promise<void> {
    // Soft delete (archive)
    await query('UPDATE classes SET is_active = FALSE WHERE id = ?', [id]);
  }

  static async getClassStudents(classId: number): Promise<Array<{ id: number; name: string; email?: string | null }>> {
    const rows = await query(
      `SELECT u.id as id,
              u.name,
              u.email
       FROM class_students cs
       JOIN users u ON cs.student_id = u.id
       WHERE cs.class_id = ?
         AND u.role = 'student'
         AND u.is_active = TRUE
       ORDER BY u.name ASC`,
      [classId]
    ) as Array<{ id: number; name: string; email?: string | null }>;

    return rows;
  }

  static async setClassStudents(classId: number, studentIds: number[]): Promise<void> {
    const uniqueStudentIds = Array.from(new Set(studentIds));

    const currentRows = await query(
      'SELECT student_id as studentId FROM class_students WHERE class_id = ?',
      [classId]
    ) as Array<{ studentId: number }>;

    const currentIds = new Set(currentRows.map((row) => row.studentId));
    const desiredIds = new Set(uniqueStudentIds);

    const toRemove = currentRows
      .map((row) => row.studentId)
      .filter((id) => !desiredIds.has(id));

    if (toRemove.length) {
      const placeholders = toRemove.map(() => '?').join(', ');
      await query(
        `DELETE FROM class_students WHERE class_id = ? AND student_id IN (${placeholders})`,
        [classId, ...toRemove]
      );
    }

    const toAdd = uniqueStudentIds.filter((id) => !currentIds.has(id));

    if (toAdd.length) {
      const values = toAdd.map(() => '(?, ?)').join(', ');
      const params: any[] = [];
      toAdd.forEach((studentId) => {
        params.push(classId, studentId);
      });

      await query(
        `INSERT INTO class_students (class_id, student_id) VALUES ${values}`,
        params
      );
    }
  }
}

export default ClassModel;
