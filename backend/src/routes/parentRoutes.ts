import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';
import { getChildren, getChildReport } from '../controllers/parentController';

export const parentRoutes = Router();

parentRoutes.use(authenticateToken as any, authorizeRoles('parent') as any);

parentRoutes.get('/children', getChildren);
parentRoutes.get('/children/:studentId/report', getChildReport);

export default parentRoutes;
