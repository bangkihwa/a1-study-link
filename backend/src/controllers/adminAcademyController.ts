import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import AcademyService from '../services/academyService';
import ClassModel from '../models/classModel';

export class AdminAcademyController {
  // Subjects
  static getSubjects = asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';
    const subjects = await AcademyService.getSubjects(includeInactive);

    res.status(200).json({
      success: true,
      data: subjects,
      message: 'Subjects retrieved successfully'
    });
  });

  static createSubject = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400);
    }

    const subject = await AcademyService.createSubject(req.body);

    res.status(201).json({
      success: true,
      data: subject,
      message: 'Subject created successfully'
    });
  });

  static updateSubject = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400);
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw createError('Invalid subject ID', 400);
    }

    const subject = await AcademyService.updateSubject(id, req.body);

    res.status(200).json({
      success: true,
      data: subject,
      message: 'Subject updated successfully'
    });
  });

  static deleteSubject = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw createError('Invalid subject ID', 400);
    }

    await AcademyService.deleteSubject(id);

    res.status(200).json({
      success: true,
      message: 'Subject archived successfully'
    });
  });

  // Classes
  static getClasses = asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';
    const classes = await AcademyService.getClasses(includeInactive);

    res.status(200).json({
      success: true,
      data: classes,
      message: 'Classes retrieved successfully'
    });
  });

  static createClass = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400);
    }

    try {
      const classRecord = await AcademyService.createClass(req.body);

      res.status(201).json({
        success: true,
        data: classRecord,
        message: 'Class created successfully'
      });
    } catch (error) {
      if (error instanceof Error) {
        let status = 400;
        if (error.message === 'Subject not found' || error.message === 'Teacher not found') {
          status = 404;
        }
        throw createError(error.message, status);
      }
      throw error;
    }
  });

  static updateClass = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400);
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw createError('Invalid class ID', 400);
    }

    try {
      const classRecord = await AcademyService.updateClass(id, req.body);

      res.status(200).json({
        success: true,
        data: classRecord,
        message: 'Class updated successfully'
      });
    } catch (error) {
      if (error instanceof Error) {
        let status = 400;
        if (error.message === 'Class not found') {
          status = 404;
        } else if (error.message === 'Subject not found' || error.message === 'Teacher not found') {
          status = 404;
        }
        throw createError(error.message, status);
      }
      throw error;
    }
  });

  static deleteClass = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw createError('Invalid class ID', 400);
    }

    await AcademyService.deleteClass(id);

    res.status(200).json({
      success: true,
      message: 'Class archived successfully'
    });
  });

  static getClassStudents = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw createError('Invalid class ID', 400);
    }

    const classRecord = await ClassModel.findById(id);
    if (!classRecord) {
      throw createError('Class not found', 404);
    }

    const students = await ClassModel.getClassStudents(id);

    res.status(200).json({
      success: true,
      data: students,
      message: 'Class students retrieved successfully'
    });
  });
}

export default AdminAcademyController;
