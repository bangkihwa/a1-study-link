import { query } from '../config/database';
import { ParentChildSummary } from '../types';

export class ParentModel {
  static async getChildrenByParentId(parentId: number): Promise<ParentChildSummary[]> {
    const rows = await query(
      `SELECT 
         u.id as studentId,
         u.name as studentName,
         s.student_number as studentNumber,
         s.grade as grade,
         s.class_id as classId,
         c.name as className,
         subj.name as subjectName,
         ps.relationship as relationship,
         ps.created_at as linkedAt
       FROM parent_student_relations ps
       JOIN users u ON ps.student_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN subjects subj ON c.subject_id = subj.id
       WHERE ps.parent_id = ?
       ORDER BY ps.created_at DESC`,
      [parentId]
    ) as any[];

    return rows.map((row) => ({
      studentId: row.studentId,
      studentName: row.studentName,
      studentNumber: row.studentNumber,
      grade: row.grade ?? null,
      classId: row.classId ?? null,
      className: row.className ?? null,
      subjectName: row.subjectName ?? null,
      relationship: row.relationship,
      linkedAt: row.linkedAt
    }));
  }

  static async isParentLinkedToStudent(parentId: number, studentId: number): Promise<boolean> {
    const rows = await query(
      `SELECT id FROM parent_student_relations WHERE parent_id = ? AND student_id = ? LIMIT 1`,
      [parentId, studentId]
    ) as any[];

    return rows.length > 0;
  }
}
