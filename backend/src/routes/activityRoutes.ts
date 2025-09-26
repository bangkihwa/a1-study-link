import { Router } from 'express';
import ActivityLogController from '../controllers/activityLogController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';

export const activityRoutes = Router();

activityRoutes.get('/me', authenticateToken as any, ActivityLogController.getMyLogs);
activityRoutes.get('/', authenticateToken as any, authorizeRoles('admin') as any, ActivityLogController.getLogs);

export default activityRoutes;
