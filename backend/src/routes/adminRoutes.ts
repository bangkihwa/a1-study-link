import { Router } from 'express';
import { body } from 'express-validator';
import { AdminManagementController } from '../controllers/adminManagementController';
import AdminAcademyController from '../controllers/adminAcademyController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';

export const adminRoutes = Router();

adminRoutes.use(authenticateToken as any, authorizeRoles('admin') as any);

adminRoutes.get('/overview', AdminManagementController.getOverview);
adminRoutes.post(
  '/users',
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('role').isIn(['student', 'teacher', 'parent']).withMessage('Invalid role'),
    body('email').optional({ nullable: true }).isEmail().withMessage('Invalid email format'),
    body('phone').optional({ nullable: true }).isLength({ min: 0, max: 20 }).withMessage('Phone must be less than 20 characters'),
    body('studentNumber')
      .if(body('role').equals('parent'))
      .trim()
      .notEmpty()
      .withMessage('Student number is required for parent accounts'),
    body('relationship')
      .optional({ nullable: true })
      .isIn(['father', 'mother', 'guardian'])
      .withMessage('Relationship must be father, mother, or guardian'),
    body('isApproved').optional().isBoolean().withMessage('isApproved must be boolean').toBoolean()
  ],
  AdminManagementController.createUser
);
adminRoutes.get('/users', AdminManagementController.getUsers);
adminRoutes.put('/users/:id/approve', AdminManagementController.approveUser);
adminRoutes.put(
  '/users/:id',
  [
    body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('email').optional({ nullable: true }).isEmail().withMessage('Invalid email format'),
    body('phone').optional({ nullable: true }).isLength({ min: 0, max: 20 }).withMessage('Phone must be less than 20 characters'),
    body('role').optional().isIn(['admin', 'teacher', 'student', 'parent']).withMessage('Invalid role'),
    body('isApproved').optional().isBoolean().withMessage('isApproved must be boolean'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    body('classId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('classId must be a positive integer')
  ],
  AdminManagementController.updateUser
);
adminRoutes.put('/users/:id/deactivate', AdminManagementController.deactivateUser);
adminRoutes.delete('/users/:id', AdminManagementController.deleteUser);

adminRoutes.get('/courses', AdminManagementController.getCourses);
adminRoutes.get('/reports/activity', AdminManagementController.getActivityReport);

adminRoutes.get('/settings', AdminManagementController.getSettings);
adminRoutes.put(
  '/settings',
  [
    body('allowRegistrations').optional().isBoolean().withMessage('allowRegistrations must be boolean').toBoolean(),
    body('maintenanceMode').optional().isBoolean().withMessage('maintenanceMode must be boolean').toBoolean(),
    body('supportEmail').optional().isEmail().withMessage('Invalid support email'),
    body('apiRateLimit').optional().isInt({ min: 1 }).withMessage('apiRateLimit must be a positive integer')
  ],
  AdminManagementController.updateSettings
);

// Subjects
adminRoutes.get('/subjects', AdminAcademyController.getSubjects);
adminRoutes.post(
  '/subjects',
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('description').optional({ nullable: true }).isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('gradeLevel').optional({ nullable: true }).isInt({ min: 1, max: 12 }).withMessage('Grade level must be between 1 and 12'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean()
  ],
  AdminAcademyController.createSubject
);
adminRoutes.put(
  '/subjects/:id',
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('description').optional({ nullable: true }).isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('gradeLevel').optional({ nullable: true }).isInt({ min: 1, max: 12 }).withMessage('Grade level must be between 1 and 12'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean()
  ],
  AdminAcademyController.updateSubject
);
adminRoutes.delete('/subjects/:id', AdminAcademyController.deleteSubject);

// Classes
adminRoutes.get('/classes', AdminAcademyController.getClasses);
adminRoutes.post(
  '/classes',
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('subjectId').isInt({ min: 1 }).withMessage('Valid subject ID is required'),
    body('teacherId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Teacher ID must be a positive integer'),
    body('gradeLevel').optional({ nullable: true }).isInt({ min: 1, max: 12 }).withMessage('Grade level must be between 1 and 12'),
    body('maxStudents').optional().isInt({ min: 1 }).withMessage('Max students must be a positive integer'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
    body('studentIds').optional().isArray().withMessage('studentIds must be an array'),
    body('studentIds.*').optional().isInt({ min: 1 }).withMessage('studentIds must contain valid student IDs')
  ],
  AdminAcademyController.createClass
);
adminRoutes.put(
  '/classes/:id',
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('subjectId').optional().isInt({ min: 1 }).withMessage('Valid subject ID is required'),
    body('teacherId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Teacher ID must be a positive integer'),
    body('gradeLevel').optional({ nullable: true }).isInt({ min: 1, max: 12 }).withMessage('Grade level must be between 1 and 12'),
    body('maxStudents').optional().isInt({ min: 1 }).withMessage('Max students must be a positive integer'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
    body('studentIds').optional().isArray().withMessage('studentIds must be an array'),
    body('studentIds.*').optional().isInt({ min: 1 }).withMessage('studentIds must contain valid student IDs')
  ],
  AdminAcademyController.updateClass
);
adminRoutes.delete('/classes/:id', AdminAcademyController.deleteClass);
adminRoutes.get('/classes/:id/students', AdminAcademyController.getClassStudents);

export default adminRoutes;
