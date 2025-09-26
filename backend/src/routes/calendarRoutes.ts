import { Router } from 'express';
import { CalendarController } from '../controllers/calendarController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';

export const calendarRoutes = Router();

calendarRoutes.use(authenticateToken as any);

calendarRoutes.get('/', CalendarController.getEvents);
calendarRoutes.get('/context', CalendarController.getContext);
calendarRoutes.post('/', authorizeRoles('teacher', 'admin') as any, CalendarController.createEvent);
calendarRoutes.put('/:id', authorizeRoles('teacher', 'admin') as any, CalendarController.updateEvent);
calendarRoutes.delete('/:id', authorizeRoles('teacher', 'admin') as any, CalendarController.deleteEvent);

export default calendarRoutes;
