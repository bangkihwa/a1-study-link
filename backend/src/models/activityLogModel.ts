import { query } from '../config/database';

export interface ActivityLogRecord {
  id: number;
  userId: number;
  activityType: string;
  relatedId?: number | null;
  metadata?: any;
  createdAt: Date;
}

export class ActivityLogModel {
  static async create(log: {
    userId: number;
    activityType: 'video_watch' | 'test_complete' | 'question_ask' | 'login';
    relatedId?: number | null;
    metadata?: any;
  }): Promise<number> {
    const result = await query(
      `INSERT INTO activity_logs (student_id, activity_type, related_id, metadata)
       VALUES (?, ?, ?, ?)` ,
      [
        log.userId,
        log.activityType,
        log.relatedId ?? null,
        log.metadata ? JSON.stringify(log.metadata) : null
      ]
    ) as any;

    return result.insertId;
  }

  static async getRecentByUser(userId: number, limit = 20): Promise<ActivityLogRecord[]> {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
    const rows = await query(
      `SELECT id, student_id as userId, activity_type as activityType, related_id as relatedId,
              metadata, created_at as createdAt
       FROM activity_logs
       WHERE student_id = ?
       ORDER BY created_at DESC
       LIMIT ${safeLimit}`,
      [userId]
    ) as any[];

    return rows.map((row) => ({
      ...row,
      metadata: parseMetadata(row.metadata)
    }));
  }

  static async getLogs(options: {
    userId?: number;
    activityType?: string;
    limit?: number;
  }): Promise<ActivityLogRecord[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.userId) {
      conditions.push('student_id = ?');
      params.push(options.userId);
    }

    if (options.activityType) {
      conditions.push('activity_type = ?');
      params.push(options.activityType);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = `LIMIT ${options.limit && options.limit > 0 ? options.limit : 50}`;

    const rows = await query(
      `SELECT id, student_id as userId, activity_type as activityType, related_id as relatedId,
              metadata, created_at as createdAt
       FROM activity_logs
       ${whereClause}
       ORDER BY created_at DESC
       ${limitClause}`,
      params
    ) as any[];

    return rows.map((row) => ({
      ...row,
      metadata: parseMetadata(row.metadata)
    }));
  }
}

function parseMetadata(raw: any) {
  if (!raw) {
    return undefined;
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

export default ActivityLogModel;
