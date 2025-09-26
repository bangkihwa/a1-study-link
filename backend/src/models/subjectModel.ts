import { query } from '../config/database';
import { Subject } from '../types';

export class SubjectModel {
  static async findAll(includeInactive = false): Promise<Subject[]> {
    const whereClause = includeInactive ? '' : 'WHERE is_active = TRUE';
    const subjects = await query(
      `SELECT id, name, description, grade_level as gradeLevel, is_active as isActive, created_at as createdAt
       FROM subjects
       ${whereClause}
       ORDER BY created_at DESC`
    ) as Subject[];

    return subjects;
  }

  static async findById(id: number): Promise<Subject | null> {
    const subjects = await query(
      `SELECT id, name, description, grade_level as gradeLevel, is_active as isActive, created_at as createdAt
       FROM subjects
       WHERE id = ?`,
      [id]
    ) as Subject[];

    return subjects.length > 0 ? subjects[0] : null;
  }

  static async create(subjectData: {
    name: string;
    description?: string;
    gradeLevel?: number;
    isActive?: boolean;
  }): Promise<number> {
    const result = await query(
      `INSERT INTO subjects (name, description, grade_level, is_active)
       VALUES (?, ?, ?, ?)` ,
      [
        subjectData.name,
        subjectData.description || null,
        subjectData.gradeLevel ?? null,
        subjectData.isActive ?? true
      ]
    ) as any;

    return result.insertId;
  }

  static async update(id: number, updates: {
    name?: string;
    description?: string | null;
    gradeLevel?: number | null;
    isActive?: boolean;
  }): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      params.push(updates.name);
    }

    if (updates.description !== undefined) {
      fields.push('description = ?');
      params.push(updates.description);
    }

    if (updates.gradeLevel !== undefined) {
      fields.push('grade_level = ?');
      params.push(updates.gradeLevel);
    }

    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      params.push(updates.isActive);
    }

    if (fields.length === 0) {
      return;
    }

    params.push(id);

    // Note: subjects table does not have updated_at column in current schema
    // so we avoid touching a non-existent column to prevent 500s
    await query(
      `UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }

  static async delete(id: number): Promise<void> {
    // Soft delete (archive) without referencing updated_at
    await query('UPDATE subjects SET is_active = FALSE WHERE id = ?', [id]);
  }
}

export default SubjectModel;
