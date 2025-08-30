import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { logStudentActivity, getStudentAnalytics } from '../controllers/analyticsController';

const router = Router();

// student logs their own activity
router.post('/log', authenticateToken, requireRole(['student']), logStudentActivity);

// teacher or admin can view analytics
router.get('/:studentId', authenticateToken, requireRole(['teacher', 'admin']), getStudentAnalytics);

export default router;
