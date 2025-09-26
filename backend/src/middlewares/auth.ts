import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { User, AuthRequest } from '../types';
import { createError } from './errorHandler';
import SystemSettingsService from '../services/systemSettingsService';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // readiness guard (defense in depth)
    if (req.app && req.app.locals && req.app.locals.isReady === false) {
      throw createError('Service is initializing. Please retry shortly.', 503);
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw createError('Access token required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    const users = await query(
      'SELECT id, username, role, name, email, phone, is_approved as isApproved, is_active as isActive FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    ) as User[];

    if (users.length === 0) {
      throw createError('User not found or inactive', 401);
    }

    req.user = users[0];
    next();
  } catch (error) {
    next(error);
  }
};

// 점검 모드 체크 미들웨어
export const checkMaintenanceMode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const settings = await SystemSettingsService.getCachedSettings();
    
    // 점검 모드가 활성화되어 있고, 사용자가 어드민이 아닌 경우 접근 차단
    if (settings.maintenanceMode && req.user?.role !== 'admin') {
      throw createError('서비스가 점검 중입니다. 잠시 후 다시 이용해 주세요.', 503);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

export const requireApproval = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(createError('Authentication required', 401));
  }

  if (!req.user.isApproved && req.user.role === 'teacher') {
    return next(createError('Account pending approval', 403));
  }

  next();
};
