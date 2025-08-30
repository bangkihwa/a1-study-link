import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../database/memoryDb';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.query('SELECT id, username, email, name, role, is_approved, created_at FROM users');
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const logStudentActivity = async (req: AuthRequest, res: Response) => {
    const studentId = req.user?.userId;
    const { lecture_id, content_id, activity_type, duration_seconds, details } = req.body;

    if (!studentId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await db.query(
            `INSERT INTO student_activities (student_id, lecture_id, content_id, activity_type, duration_seconds, details) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [studentId, lecture_id, content_id, activity_type, duration_seconds, details]
        );
        res.status(201).json({ message: 'Activity logged successfully' });
    } catch (error) {
        console.error('Error logging student activity:', error);
        res.status(500).json({ error: 'Failed to log activity' });
    }
};

export const getStudentAnalytics = async (req: AuthRequest, res: Response) => {
    const { studentId } = req.params;

    try {
        const result = await db.query(
            'SELECT activity_type, COUNT(*), SUM(duration_seconds) FROM student_activities WHERE student_id = $1 GROUP BY activity_type',
            [studentId]
        );
        res.json({ analytics: result });
    } catch (error) {
        console.error('Error fetching student analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};
