import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createError, asyncHandler } from '../middlewares/errorHandler';
import AdminManagementService from '../services/adminManagementService';

export class AdminManagementController {
  static getOverview = asyncHandler(async (req: Request, res: Response) => {
    const overview = await AdminManagementService.getOverview();

    res.status(200).json({
      success: true,
      data: overview,
      message: 'Admin overview retrieved successfully'
    });
  });

  static createUser = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400);
    }

    const {
      username,
      password,
      name,
      role,
      email,
      phone,
      studentNumber,
      relationship,
      isApproved
    } = req.body as Record<string, any>;

    const roleValue = role as 'student' | 'teacher' | 'parent';

    try {
      const created = await AdminManagementService.createUser({
        username,
        password,
        name,
        role: roleValue,
        email,
        phone,
        studentNumber,
        relationship,
        isApproved
      });

      res.status(201).json({
        success: true,
        data: created,
        message: 'User created successfully'
      });
    } catch (error) {
      if (error instanceof Error) {
        let status = 400;
        if (error.message === 'Username already exists') {
          status = 409;
        } else if (error.message === 'Student number already exists') {
          status = 409;
        } else if (error.message === 'Student already has maximum number of parents linked') {
          status = 409;
        } else if (error.message === 'Student number not found') {
          status = 404;
        }
        throw createError(error.message, status);
      }
      throw error;
    }
  });

  static getUsers = asyncHandler(async (req: Request, res: Response) => {
    const { role, status, search } = req.query as Record<string, string | undefined>;

    const users = await AdminManagementService.getUsers({
      role: role || undefined,
      status: status as any,
      search: search || undefined
    });

    res.status(200).json({
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    });
  });

  static approveUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      throw createError('Invalid user ID', 400);
    }

    await AdminManagementService.approveUser(userId);

    res.status(200).json({
      success: true,
      message: 'User approved successfully'
    });
  });

  static updateUser = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400);
    }

    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      throw createError('Invalid user ID', 400);
    }

    const updates = req.body as any;

    await AdminManagementService.updateUser(userId, updates);

    res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });
  });

  static deactivateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      throw createError('Invalid user ID', 400);
    }

    await AdminManagementService.deactivateUser(userId);

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  });

  static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      throw createError('Invalid user ID', 400);
    }

    await AdminManagementService.deleteUser(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  });

  static getCourses = asyncHandler(async (req: Request, res: Response) => {
    const courses = await AdminManagementService.getCourses();

    res.status(200).json({
      success: true,
      data: courses,
      message: 'Courses retrieved successfully'
    });
  });

  static getActivityReport = asyncHandler(async (req: Request, res: Response) => {
    let { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    const today = new Date();
    const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (!startDate) {
      startDate = defaultStart.toISOString().split('T')[0];
    }

    if (!endDate) {
      endDate = today.toISOString().split('T')[0];
    }

    const report = await AdminManagementService.getActivityReport(startDate, endDate);

    res.status(200).json({
      success: true,
      data: report,
      message: 'Activity report retrieved successfully'
    });
  });

  static getSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await AdminManagementService.getSettings();

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Settings retrieved successfully'
    });
  });

  static updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400);
    }

    const updated = await AdminManagementService.updateSettings(req.body);

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Settings updated successfully'
    });
  });
}

export default AdminManagementController;
