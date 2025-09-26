import { query } from '../config/database';
import { Course, ContentBlock, CourseStudent } from '../types';

interface FindOptions {
  onlyPublished?: boolean;
}

export class CourseModel {
  private static buildPublishedClause(options?: FindOptions): string {
    if (options?.onlyPublished === false) {
      return '';
    }
    return 'WHERE is_published = TRUE';
  }

  static async findAll(options?: FindOptions): Promise<Course[]> {
    const whereClause = this.buildPublishedClause(options);
    const courses = await query(
      `SELECT id, title, description, class_id as classId, teacher_id as teacherId, is_published as isPublished,
              created_at as createdAt, updated_at as updatedAt
       FROM courses
       ${whereClause}
       ORDER BY created_at DESC`
    ) as Course[];

    return courses;
  }

  static async findAllWithRelations(options?: FindOptions): Promise<any[]> {
    const whereClause = options?.onlyPublished === false ? '' : 'WHERE c.is_published = TRUE';
    const rows = await query(
      `SELECT c.id,
              c.title,
              c.description,
              c.class_id as classId,
              c.teacher_id as teacherId,
              c.is_published as isPublished,
              c.created_at as createdAt,
              c.updated_at as updatedAt,
              cl.name as className,
              cl.grade_level as gradeLevel,
              u.name as teacherName,
              u.email as teacherEmail
       FROM courses c
       LEFT JOIN classes cl ON c.class_id = cl.id
       LEFT JOIN users u ON c.teacher_id = u.id
       ${whereClause}
       ORDER BY c.created_at DESC`
    ) as any[];

    return rows;
  }

  static async findById(id: number, options?: FindOptions): Promise<Course | null> {
    const wherePublished = this.buildPublishedClause(options);
    const whereClause = wherePublished ? `${wherePublished} AND id = ?` : 'WHERE id = ?';
    const courses = await query(
      `SELECT id, title, description, class_id as classId, teacher_id as teacherId, is_published as isPublished,
              created_at as createdAt, updated_at as updatedAt
       FROM courses
       ${whereClause}
       LIMIT 1`,
      [id]
    ) as Course[];

    return courses.length > 0 ? courses[0] : null;
  }

  static async findByClassId(classId: number, options?: FindOptions): Promise<Course[]> {
    const wherePublished = this.buildPublishedClause(options);
    const whereClause = wherePublished ? `${wherePublished} AND class_id = ?` : 'WHERE class_id = ?';
    const courses = await query(
      `SELECT id, title, description, class_id as classId, teacher_id as teacherId, is_published as isPublished,
              created_at as createdAt, updated_at as updatedAt
       FROM courses
       ${whereClause}
       ORDER BY created_at DESC`,
      [classId]
    ) as Course[];

    return courses;
  }

  static async findByTeacherId(teacherId: number, options?: FindOptions): Promise<Course[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (options?.onlyPublished !== false) {
      conditions.push('c.is_published = TRUE');
    }

    // 교사가 직접 배정된 강의 또는 클래스 담당 교사인 강의
    conditions.push('(c.teacher_id = ? OR cls.teacher_id = ?)');
    params.push(teacherId, teacherId);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const courses = await query(
      `SELECT DISTINCT
              c.id,
              c.title,
              c.description,
              c.class_id as classId,
              c.teacher_id as teacherId,
              c.is_published as isPublished,
              c.created_at as createdAt,
              c.updated_at as updatedAt
       FROM courses c
       LEFT JOIN classes cls ON c.class_id = cls.id
       ${whereClause}
       ORDER BY c.created_at DESC`,
      params
    ) as Course[];

    return courses;
  }

  static async findByStudentId(studentId: number): Promise<Course[]> {
    const courses = await query(
      `SELECT DISTINCT
              c.id,
              c.title,
              c.description,
              c.class_id as classId,
              c.teacher_id as teacherId,
              c.is_published as isPublished,
              c.created_at as createdAt,
              c.updated_at as updatedAt,
              cl.name as className,
              cl.grade_level as gradeLevel,
              sub.name as subjectName,
              u.name as teacherName,
              JSON_UNQUOTE(JSON_EXTRACT(fv.content, '$.videoId')) as firstVideoId,
              fv.title as firstVideoTitle
       FROM courses c
       LEFT JOIN classes cl ON c.class_id = cl.id
       LEFT JOIN subjects sub ON cl.subject_id = sub.id
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN (
         SELECT
           course_id,
           content,
           title,
           ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY order_index ASC) AS rn
         FROM content_blocks
         WHERE type = 'video'
       ) fv ON fv.course_id = c.id AND fv.rn = 1
       WHERE c.id IN (SELECT course_id FROM course_students WHERE student_id = ?)
          OR
          c.class_id IN (
            SELECT class_id FROM class_students WHERE student_id = ?
            UNION
            SELECT class_id FROM students WHERE user_id = ? AND class_id IS NOT NULL
          )
       ORDER BY c.created_at DESC`,
      [studentId, studentId, studentId]
    ) as Course[];

    return courses;
  }



  static async create(courseData: {
    title: string;
    description?: string;
    classId: number;
    teacherId: number;
    isPublished?: boolean;
  }): Promise<number> {
    const result = await query(
      `INSERT INTO courses (title, description, class_id, teacher_id, is_published)
       VALUES (?, ?, ?, ?, ?)` ,
      [
        courseData.title,
        courseData.description || null,
        courseData.classId,
        courseData.teacherId,
        courseData.isPublished ?? false
      ]
    ) as any;

    return result.insertId;
  }

  static async update(courseId: number, updates: {
    title?: string;
    description?: string | null;
    classId?: number;
    teacherId?: number;
    isPublished?: boolean;
  }): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      params.push(updates.title);
    }

    if (updates.description !== undefined) {
      fields.push('description = ?');
      params.push(updates.description);
    }

    if (updates.classId !== undefined) {
      fields.push('class_id = ?');
      params.push(updates.classId);
    }

    if (updates.teacherId !== undefined) {
      fields.push('teacher_id = ?');
      params.push(updates.teacherId);
    }

    if (updates.isPublished !== undefined) {
      fields.push('is_published = ?');
      params.push(updates.isPublished);
    }

    if (fields.length === 0) {
      return;
    }

    params.push(courseId);

    await query(
      `UPDATE courses SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );
  }

  static async delete(courseId: number): Promise<void> {
    await query('DELETE FROM courses WHERE id = ?', [courseId]);
  }

  static async deleteCourseStudents(courseId: number): Promise<void> {
    await query('DELETE FROM course_students WHERE course_id = ?', [courseId]);
  }

  static async deleteContentBlocksByCourse(courseId: number): Promise<void> {
    await query('DELETE FROM content_blocks WHERE course_id = ?', [courseId]);
  }

  static async getCourseStudents(courseId: number): Promise<CourseStudent[]> {
    const rows = await query(
      `SELECT u.id,
              u.name,
              u.email,
              s.class_id as classId,
              c.name as className
       FROM course_students cs
       JOIN users u ON cs.student_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE cs.course_id = ?
       ORDER BY u.name ASC`,
      [courseId]
    ) as CourseStudent[];

    return rows;
  }

  static async setCourseStudents(courseId: number, studentIds: number[]): Promise<void> {
    await query('DELETE FROM course_students WHERE course_id = ?', [courseId]);

    if (!studentIds.length) {
      return;
    }

    const values = studentIds.map(() => '(?, ?)').join(', ');
    const params: any[] = [];
    for (const id of studentIds) {
      params.push(courseId, id);
    }

    await query(`INSERT INTO course_students (course_id, student_id) VALUES ${values}`, params);
  }

  static async isStudentAssigned(courseId: number, studentId: number): Promise<boolean> {
    const directAssignment = await query(
      `SELECT 1
       FROM course_students
       WHERE course_id = ? AND student_id = ?
       LIMIT 1`,
      [courseId, studentId]
    ) as any[];

    if (directAssignment.length > 0) {
      return true;
    }

    const classMembership = await query(
      `SELECT 1
       FROM courses c
       LEFT JOIN students s ON s.user_id = ? AND s.class_id = c.class_id
       LEFT JOIN class_students cs ON cs.student_id = ? AND cs.class_id = c.class_id
       WHERE c.id = ?
         AND (s.user_id IS NOT NULL OR cs.id IS NOT NULL)
       LIMIT 1`,
      [studentId, studentId, courseId]
    ) as any[];

    return classMembership.length > 0;
  }

  static async isAnyStudentAssigned(courseId: number, studentIds: number[]): Promise<boolean> {
    if (!studentIds.length) {
      return false;
    }

    const placeholders = studentIds.map(() => '?').join(', ');
    const rows = await query(
      `SELECT 1
       FROM course_students
       WHERE course_id = ? AND student_id IN (${placeholders})
       LIMIT 1`,
      [courseId, ...studentIds]
    ) as any[];

    return rows.length > 0;
  }

  static async publishCourse(courseId: number, isPublished: boolean): Promise<void> {
    await query(
      'UPDATE courses SET is_published = ?, updated_at = NOW() WHERE id = ?',
      [isPublished, courseId]
    );
  }

  static async countVideoBlocks(courseId: number): Promise<number> {
    const rows = await query(
      'SELECT COUNT(*) as count FROM content_blocks WHERE course_id = ? AND type = ?',
      [courseId, 'video']
    ) as Array<{ count: number }>;
    return rows[0]?.count ?? 0;
  }

  static async hasVideoBlock(courseId: number): Promise<boolean> {
    const rows = await query(
      'SELECT 1 FROM content_blocks WHERE course_id = ? AND type = ? LIMIT 1',
      [courseId, 'video']
    ) as any[];
    return rows.length > 0;
  }

  static async getContentBlocks(courseId: number): Promise<ContentBlock[]> {
    const blocks = await query(
      `SELECT id, course_id as courseId, type, title, content, order_index as orderIndex,
              is_required as isRequired, created_at as createdAt
       FROM content_blocks
       WHERE course_id = ?
       ORDER BY order_index ASC`,
      [courseId]
    ) as ContentBlock[];

    return blocks;
  }

  static async getContentBlocksForCourses(courseIds: number[]): Promise<ContentBlock[]> {
    if (!courseIds.length) {
      return [];
    }

    const placeholders = courseIds.map(() => '?').join(', ');
    const rows = await query(
      `SELECT id, course_id as courseId, type, title, content, order_index as orderIndex,
              is_required as isRequired, created_at as createdAt
       FROM content_blocks
       WHERE course_id IN (${placeholders})
       ORDER BY course_id ASC, order_index ASC`,
      courseIds
    ) as ContentBlock[];

    return rows;
  }

  static async getContentBlockById(blockId: number): Promise<ContentBlock | null> {
    const blocks = await query(
      `SELECT id, course_id as courseId, type, title, content, order_index as orderIndex,
              is_required as isRequired, created_at as createdAt
       FROM content_blocks
       WHERE id = ?`,
      [blockId]
    ) as ContentBlock[];

    return blocks.length > 0 ? blocks[0] : null;
  }

  static async getNextOrderIndex(courseId: number): Promise<number> {
    const rows = await query(
      'SELECT COALESCE(MAX(order_index), -1) + 1 as nextIndex FROM content_blocks WHERE course_id = ?',
      [courseId]
    ) as any[];

    return rows[0]?.nextIndex ?? 0;
  }

  static async createContentBlock(blockData: {
    courseId: number;
    type: string;
    title: string;
    content: any;
    orderIndex: number;
    isRequired: boolean;
  }): Promise<number> {
    const result = await query(
      `INSERT INTO content_blocks (course_id, type, title, content, order_index, is_required)
       VALUES (?, ?, ?, ?, ?, ?)` ,
      [
        blockData.courseId,
        blockData.type,
        blockData.title,
        JSON.stringify(blockData.content),
        blockData.orderIndex,
        blockData.isRequired
      ]
    ) as any;

    return result.insertId;
  }

  static async updateContentBlock(blockId: number, updates: {
    title?: string;
    type?: string;
    content?: any;
    isRequired?: boolean;
  }): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      params.push(updates.title);
    }

    if (updates.type !== undefined) {
      fields.push('type = ?');
      params.push(updates.type);
    }

    if (updates.content !== undefined) {
      fields.push('content = ?');
      params.push(JSON.stringify(updates.content));
    }

    if (updates.isRequired !== undefined) {
      fields.push('is_required = ?');
      params.push(updates.isRequired);
    }

    if (fields.length === 0) {
      return;
    }

    params.push(blockId);

    await query(
      `UPDATE content_blocks SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }

  static async deleteContentBlock(blockId: number): Promise<void> {
    await query('DELETE FROM content_blocks WHERE id = ?', [blockId]);
  }

  static async reorderContentBlocks(courseId: number, orderedIds: number[]): Promise<void> {
    for (let index = 0; index < orderedIds.length; index++) {
      const blockId = orderedIds[index];
      await query(
        'UPDATE content_blocks SET order_index = ? WHERE id = ? AND course_id = ?',
        [index, blockId, courseId]
      );
    }
  }
}
