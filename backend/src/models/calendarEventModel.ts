import { query } from '../config/database';
import { CalendarEventType } from '../types';

export interface CalendarEventRecord {
  id: number;
  eventType: CalendarEventType;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  classId: number | null;
  testId: number | null;
  teacherId: number | null;
  visibility: 'teacher_only' | 'class';
  createdBy: number;
  className?: string | null;
  subjectName?: string | null;
  testTitle?: string | null;
  teacherName?: string | null;
}

const BASE_SELECT = `
  SELECT
    e.id,
    e.event_type AS eventType,
    e.title,
    e.description,
    e.start_date AS startDate,
    e.end_date AS endDate,
    e.class_id AS classId,
    e.test_id AS testId,
    e.teacher_id AS teacherId,
    e.visibility,
    e.created_by AS createdBy,
    c.name AS className,
    subj.name AS subjectName,
    t.title AS testTitle,
    ut.name AS teacherName
  FROM calendar_events e
  LEFT JOIN classes c ON e.class_id = c.id
  LEFT JOIN subjects subj ON c.subject_id = subj.id
  LEFT JOIN tests t ON e.test_id = t.id
  LEFT JOIN users ut ON e.teacher_id = ut.id
`;

export class CalendarEventModel {
  static async findById(id: number): Promise<CalendarEventRecord | null> {
    const rows = await query(
      `${BASE_SELECT}
       WHERE e.id = ?
       LIMIT 1`,
      [id]
    ) as CalendarEventRecord[];

    return rows.length ? rows[0] : null;
  }

  static async getTeacherScheduleEvents(teacherId: number, startDate: string, endDate: string): Promise<CalendarEventRecord[]> {
    return await query(
      `${BASE_SELECT}
       WHERE e.event_type = 'teacher_schedule'
         AND e.teacher_id = ?
         AND e.start_date <= ?
         AND e.end_date >= ?
       ORDER BY e.start_date ASC`,
      [teacherId, endDate, startDate]
    ) as CalendarEventRecord[];
  }

  static async findByTestId(testId: number): Promise<CalendarEventRecord | null> {
    const rows = await query(
      `${BASE_SELECT}
       WHERE e.test_id = ?
         AND e.event_type = 'test_deadline'
       LIMIT 1`,
      [testId]
    ) as CalendarEventRecord[];

    return rows.length ? rows[0] : null;
  }

  static async getTestDeadlineEvents(classIds: number[], startDate: string, endDate: string): Promise<CalendarEventRecord[]> {
    if (!classIds.length) {
      return [];
    }

    const placeholders = classIds.map(() => '?').join(', ');
    return await query(
      `${BASE_SELECT}
       WHERE e.event_type = 'test_deadline'
         AND e.class_id IN (${placeholders})
         AND e.start_date <= ?
         AND e.end_date >= ?
       ORDER BY e.start_date ASC`,
      [...classIds, endDate, startDate]
    ) as CalendarEventRecord[];
  }

  static async getAllEvents(startDate: string, endDate: string): Promise<CalendarEventRecord[]> {
    return await query(
      `${BASE_SELECT}
       WHERE e.start_date <= ?
         AND e.end_date >= ?
       ORDER BY e.start_date ASC`,
      [endDate, startDate]
    ) as CalendarEventRecord[];
  }

  static async create(eventData: {
    eventType: CalendarEventType;
    title: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    classId?: number | null;
    testId?: number | null;
    teacherId?: number | null;
    visibility: 'teacher_only' | 'class';
    createdBy: number;
  }): Promise<number> {
    const result = await query(
      `INSERT INTO calendar_events
        (event_type, title, description, start_date, end_date, class_id, test_id, teacher_id, visibility, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        eventData.eventType,
        eventData.title,
        eventData.description ?? null,
        eventData.startDate,
        eventData.endDate,
        eventData.classId ?? null,
        eventData.testId ?? null,
        eventData.teacherId ?? null,
        eventData.visibility,
        eventData.createdBy
      ]
    ) as any;

    return result.insertId;
  }

  static async update(id: number, updates: {
    title?: string;
    description?: string | null;
    startDate?: string;
    endDate?: string;
    classId?: number | null;
    testId?: number | null;
    teacherId?: number | null;
  }): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      params.push(updates.title);
    }

    if (updates.description !== undefined) {
      fields.push('description = ?');
      params.push(updates.description ?? null);
    }

    if (updates.startDate !== undefined) {
      fields.push('start_date = ?');
      params.push(updates.startDate);
    }

    if (updates.endDate !== undefined) {
      fields.push('end_date = ?');
      params.push(updates.endDate);
    }

    if (updates.classId !== undefined) {
      fields.push('class_id = ?');
      params.push(updates.classId ?? null);
    }

    if (updates.testId !== undefined) {
      fields.push('test_id = ?');
      params.push(updates.testId ?? null);
    }

    if (updates.teacherId !== undefined) {
      fields.push('teacher_id = ?');
      params.push(updates.teacherId ?? null);
    }

    if (!fields.length) {
      return;
    }

    params.push(id);

    await query(
      `UPDATE calendar_events
         SET ${fields.join(', ')},
             updated_at = NOW()
       WHERE id = ?`,
      params
    );
  }

  static async delete(id: number): Promise<void> {
    await query('DELETE FROM calendar_events WHERE id = ?', [id]);
  }

  static async deleteByTestId(testId: number): Promise<void> {
    await query('DELETE FROM calendar_events WHERE test_id = ?', [testId]);
  }
}
