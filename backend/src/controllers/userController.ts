import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { createError, asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../types';

export class UserController {
  // 현재 사용자 정보 조회
  static getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    res.status(200).json({
      success: true,
      data: req.user,
      message: 'User information retrieved successfully'
    });
  });

  // 사용자 정보 조회 (ID로)
  static getUserById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      throw createError('Invalid user ID', 400);
    }

    const user = await UserService.getUserById(userId);
    
    if (!user) {
      throw createError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'User information retrieved successfully'
    });
  });

  // 학생 등록
  static registerStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const result = await UserService.registerStudent(req.body);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Student registered successfully'
      });
    } catch (error: any) {
      if (error.message === 'Username already exists') {
        throw createError('Username already exists', 409);
      }
      throw error;
    }
  });

  // 학부모 등록
  static registerParent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const {
        username,
        password,
        name,
        email,
        phone,
        studentNumber,
        relationship
      } = req.body as {
        username: string;
        password: string;
        name: string;
        email?: string;
        phone?: string;
        studentNumber: string;
        relationship?: 'father' | 'mother' | 'guardian';
      };

      const result = await UserService.registerParent({
        username,
        password,
        name,
        email,
        phone,
        studentNumber,
        relationship
      });
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Parent registered successfully'
      });
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

  // 교사 등록
  static registerTeacher = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const result = await UserService.registerTeacher(req.body);
      
      res.status(201).json({
        success: true,
        data: {
          userId: result.userId,
          status: 'pending_approval'
        },
        message: 'Teacher registration submitted for approval'
      });
    } catch (error: any) {
      if (error.message === 'Username already exists') {
        throw createError('Username already exists', 409);
      }
      throw error;
    }
  });

  // 학생 번호 유효성 검사
  static validateStudentNumber = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { studentNumber } = req.params;
    
    const result = await UserService.validateStudentNumber(studentNumber);
    
    if (!result.isValid) {
      throw createError('Student number not found', 404);
    }

    res.status(200).json({
      success: true,
      data: result
    });
  });
}
