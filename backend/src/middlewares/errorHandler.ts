import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Duplicate key error
  if (err.message?.includes('Duplicate entry')) {
    statusCode = 409;
    message = 'Resource already exists';
  }

  // Foreign key constraint error
  if (err.message?.includes('foreign key constraint')) {
    statusCode = 400;
    message = 'Invalid reference to related resource';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  // Database not ready / connection refused -> treat as 503 to align with frontend interceptor
  const anyErr: any = err as any;
  if (anyErr?.code === 'ECONNREFUSED' || String(err.message || '').includes('ECONNREFUSED')) {
    statusCode = 503;
    message = 'Service temporarily unavailable';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error for debugging
  if (statusCode === 500) {
    console.error('❌ Server Error:', err);
  } else if (statusCode === 503) {
    console.warn('⚠️ Service unavailable:', err.message || err);
  }

  const response: ApiResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  };

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
