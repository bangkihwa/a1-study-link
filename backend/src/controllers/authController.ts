import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { UserModel } from '../models/userModel';
import { UserService } from '../services/userService';
import ActivityLogService from '../services/activityLogService';
import SystemSettingsService from '../services/systemSettingsService';
import {
  comparePassword,
  generateToken
} from '../utils/auth';
import { createError, asyncHandler } from '../middlewares/errorHandler';
import {
  ApiResponse,
  LoginRequest,
  AuthRequest,
  RegisterStudentRequest,
  RegisterParentRequest,
  RegisterTeacherRequest
} from '../types';

export const login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { username, password }: LoginRequest = req.body;

  const user = await UserModel.findByUsername(username);

  if (!user || !user.password) {
    throw createError('Invalid credentials', 401);
  }

  if (!await comparePassword(password, user.password)) {
    throw createError('Invalid credentials', 401);
  }

  if (user.role !== 'admin' && !user.isApproved) {
    throw createError('Account pending approval', 403);
  }

  const token = generateToken(user.id);

  // Log login activity for students
  await ActivityLogService.logLogin(user.id, {
    role: user.role,
    timestamp: new Date().toISOString()
  });

  const response: ApiResponse = {
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isApproved: user.isApproved
      }
    },
    message: 'Login successful'
  };

  res.status(200).json(response);
});

export const registerStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { username, password, name, email, phone }: RegisterStudentRequest = req.body;

  const settings = await SystemSettingsService.getCachedSettings();

  const result = await UserService.registerStudent({
    username,
    password,
    name,
    email,
    phone,
    // 자동 승인 정책: allowRegistrations=true 이면 즉시 승인, false면 관리자 승인 대기
    isApproved: settings.allowRegistrations
  });

  const response: ApiResponse = {
    success: true,
    data: result,
    message: 'Student registration successful'
  };

  res.status(201).json(response);
});

export const registerParent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { username, password, name, email, phone, studentNumber, relationship }: RegisterParentRequest = req.body;

  const settings = await SystemSettingsService.getCachedSettings();

  try {
    const result = await UserService.registerParent({
      username,
      password,
      name,
      email,
      phone,
      studentNumber,
      relationship,
      // 자동 승인 정책 반영
      isApproved: settings.allowRegistrations
    });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Parent registration successful'
    };

    res.status(201).json(response);
  } catch (error: any) {
    if (error.message === 'Username already exists') {
      throw createError('Username already exists', 409);
    }
    if (error.message === 'Student number not found') {
      throw createError('Student number not found', 404);
    }
    if (error.message === 'Student already has maximum number of parents linked') {
      throw createError('Student already has maximum number of parents linked', 409);
    }
    throw error;
  }
});

export const registerTeacher = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { username, password, name, email, phone }: RegisterTeacherRequest = req.body;

  const settings = await SystemSettingsService.getCachedSettings();

  const result = await UserService.registerTeacher({
    username,
    password,
    name,
    email,
    phone,
    // 교사는 allowRegistrations에 따라 자동 승인 여부 결정
    autoApprove: settings.autoApproveTeachers
  });

  const response: ApiResponse = {
    success: true,
    data: {
      ...result,
      status: result.isApproved ? 'approved' : 'pending_approval'
    },
    message: 'Teacher registration submitted for approval'
  };

  res.status(201).json(response);
});

export const validateStudentNumber = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { studentNumber } = req.params;

  const validation = await UserService.validateStudentNumber(studentNumber);

  if (!validation.isValid) {
    throw createError('Student number not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: {
      studentNumber: studentNumber.toUpperCase(),
      studentName: validation.studentName,
      canLink: validation.canLink
    }
  };

  res.status(200).json(response);
});

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const newToken = generateToken(req.user.id);

  const response: ApiResponse = {
    success: true,
    data: { token: newToken },
    message: 'Token refreshed'
  };

  res.status(200).json(response);
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  // In a real application, you might want to blacklist the token
  const response: ApiResponse = {
    success: true,
    message: 'Logout successful'
  };

  res.status(200).json(response);
});
