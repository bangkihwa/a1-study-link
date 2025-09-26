import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/courseService';
import { VideoService } from '../services/videoService';
import { createError, asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../types';
import ClassModel from '../models/classModel';
import StudentModel from '../models/studentModel';
import { ParentModel } from '../models/parentModel';

const wrapServiceCall = async <T>(fn: () => Promise<T>) => {
  try {
    return await fn();
  } catch (error: any) {
    if (error?.status) {
      throw createError(error.message, error.status);
    }
    throw error;
  }
};

export class CourseController {
  // 모든 강의 목록 조회
  static getAllCourses = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const courses = await CourseService.getAllCourses();
    
    res.status(200).json({
      success: true,
      data: courses,
      message: 'Courses retrieved successfully'
    });
  });

  // 특정 강의 조회
  static getCourseById = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const courseId = Number(req.params.id);
    if (Number.isNaN(courseId)) {
      throw createError('Invalid course ID', 400);
    }

    const allowUnpublished = req.user.role === 'admin' || req.user.role === 'teacher';
    const course = await wrapServiceCall(() => CourseService.getCourseWithContent(
      courseId,
      allowUnpublished ? { onlyPublished: false } : undefined
    ));

    if (!course) {
      throw createError('Course not found', 404);
    }

    switch (req.user.role) {
      case 'admin':
        break;
      case 'teacher': {
        if (course.teacherId !== req.user.id) {
          const classRecord = await ClassModel.findById(course.classId);
          if (!classRecord || classRecord.teacherId !== req.user.id) {
            throw createError('Insufficient permissions to view this course', 403);
          }
        }
        break;
      }
      case 'student': {
        const isAssigned = await CourseService.isStudentAssignedToCourse(course.id, req.user.id);
        if (!isAssigned) {
          throw createError('Insufficient permissions to view this course', 403);
        }
        break;
      }
      case 'parent': {
        const children = await ParentModel.getChildrenByParentId(req.user.id);
        if (!children.length) {
          throw createError('Insufficient permissions to view this course', 403);
        }
        const anyAssigned = await CourseService.isAnyStudentAssignedToCourse(course.id, children.map((child) => child.studentId));
        if (!anyAssigned) {
          throw createError('Insufficient permissions to view this course', 403);
        }
        break;
      }
      default:
        throw createError('Insufficient permissions', 403);
    }

    const enrichedCourse = await wrapServiceCall(() => CourseService.prepareCourseForViewer(course, req.user!));

    const responsePayload: any = { ...enrichedCourse };
    if (req.user.role === 'student' || req.user.role === 'parent') {
      delete responsePayload.assignedStudents;
    }

    res.status(200).json({
      success: true,
      data: responsePayload,
      message: 'Course retrieved successfully'
    });
  });

  // 현재 사용자의 역할에 따른 강의 목록 조회
  static getUserCourses = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    let courses: any[] = [];

    switch (req.user.role) {
      case 'admin': {
        courses = await CourseService.getAllCourses({ onlyPublished: false });
        break;
      }
      case 'teacher': {
        courses = await CourseService.getCoursesByTeacherId(req.user.id, { onlyPublished: false });
        if (courses.length > 0) {
          const aggregates = await VideoService.getCourseAggregates(courses.map((course) => course.id));
          const aggregateMap = new Map(aggregates.map((item) => [item.courseId, item]));
          courses = courses.map((course) => {
            const stats = aggregateMap.get(course.id);
            return {
              ...course,
              videoStats: {
                averageProgress: stats ? stats.averageProgress : 0,
                uniqueStudents: stats ? stats.uniqueStudents : 0,
                videoBlockCount: stats ? stats.videoBlockCount : 0
              }
            };
          });
        }
        break;
      }
      case 'student': {
        courses = await CourseService.getStudentCourseSummaries(req.user.id);
        break;
      }
      default:
        throw createError('Invalid user role', 403);
    }

    res.status(200).json({
      success: true,
      data: courses,
      message: 'Courses retrieved successfully'
    });
  });

  // 강의 생성
  static createCourse = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // 교사 또는 관리자만 강의 생성 가능
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw createError('Insufficient permissions to create course', 403);
    }

    const { title, description, classId, initialVideoUrl, initialVideoTitle, isPublished } = req.body;

    const teacherId = req.user.role === 'admin' ? req.body.teacherId : req.user.id;

    const created = await wrapServiceCall(() => CourseService.createCourse(req.user!, {
      title,
      description,
      classId,
      teacherId,
      isPublished: typeof isPublished === 'boolean' ? isPublished : undefined,
      initialVideoUrl,
      initialVideoTitle
    }));

    res.status(201).json({
      success: true,
      data: created,
      message: 'Course created successfully'
    });
  });

  // 강의 콘텐츠 블록 생성
  static createContentBlock = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // 교사 또는 관리자만 콘텐츠 블록 생성 가능
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw createError('Insufficient permissions to create content block', 403);
    }

    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) {
      throw createError('Invalid course ID', 400);
    }

    const { type, title, content, isRequired } = req.body;

    const block = await wrapServiceCall(() => CourseService.createContentBlock(req.user!, {
      courseId,
      type,
      title,
      content,
      isRequired
    }));

    res.status(201).json({
      success: true,
      data: block,
      message: 'Content block created successfully'
    });
  });

  static updateCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) {
      throw createError('Invalid course ID', 400);
    }

    const updates: {
      title?: string;
      description?: string;
      classId?: number;
      teacherId?: number;
      isPublished?: boolean;
    } = {};

    if (req.body.title !== undefined) {
      updates.title = req.body.title;
    }
    if (req.body.description !== undefined) {
      updates.description = req.body.description;
    }
    if (req.body.classId !== undefined) {
      updates.classId = Number(req.body.classId);
    }
    if (req.body.isPublished !== undefined) {
      updates.isPublished = Boolean(req.body.isPublished);
    }
    if (req.user.role === 'admin' && req.body.teacherId !== undefined) {
      updates.teacherId = Number(req.body.teacherId);
    }

    const updated = await wrapServiceCall(() => CourseService.updateCourse(req.user!, courseId, updates));

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Course updated successfully'
    });
  });

  static deleteCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) {
      throw createError('Invalid course ID', 400);
    }

    await wrapServiceCall(() => CourseService.deleteCourse(req.user!, courseId));

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  });

  static publishCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) {
      throw createError('Invalid course ID', 400);
    }

    const { isPublished } = req.body;

    await wrapServiceCall(() => CourseService.publishCourse(req.user!, courseId, Boolean(isPublished)));

    res.status(200).json({
      success: true,
      message: 'Course publish state updated'
    });
  });

  static updateContentBlock = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const courseId = parseInt(req.params.id, 10);
    const blockId = parseInt(req.params.blockId, 10);
    if (isNaN(courseId) || isNaN(blockId)) {
      throw createError('Invalid IDs', 400);
    }

    const updated = await wrapServiceCall(() => CourseService.updateContentBlock(req.user!, courseId, blockId, req.body));

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Content block updated successfully'
    });
  });

  static deleteContentBlock = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const courseId = parseInt(req.params.id, 10);
    const blockId = parseInt(req.params.blockId, 10);
    if (isNaN(courseId) || isNaN(blockId)) {
      throw createError('Invalid IDs', 400);
    }

    await wrapServiceCall(() => CourseService.deleteContentBlock(req.user!, courseId, blockId));

    res.status(200).json({
      success: true,
      message: 'Content block deleted successfully'
    });
  });

  static reorderContentBlocks = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) {
      throw createError('Invalid course ID', 400);
    }

    const { orderedIds } = req.body as { orderedIds: number[] };
    if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== 'number')) {
      throw createError('Invalid orderedIds payload', 400);
    }

    await wrapServiceCall(() => CourseService.reorderContentBlocks(req.user!, courseId, orderedIds));

    res.status(200).json({
      success: true,
      message: 'Content blocks reordered successfully'
    });
  });

  static getManageCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) {
      throw createError('Invalid course ID', 400);
    }

    const course = await wrapServiceCall(() => CourseService.getCourseWithContent(courseId, { onlyPublished: false }));

    if (!course) {
      throw createError('Course not found', 404);
    }

    if (req.user.role === 'teacher') {
      if (course.teacherId !== req.user.id) {
        const classRecord = await ClassModel.findById(course.classId);
        if (!classRecord || classRecord.teacherId !== req.user.id) {
          throw createError('Insufficient permissions to view this course', 403);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: course,
      message: 'Course retrieved successfully'
    });
  });

  static getClassStudents = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const classId = Number(req.params.classId);
    if (Number.isNaN(classId)) {
      throw createError('Invalid class ID', 400);
    }

    const classRecord = await ClassModel.findById(classId);
    if (!classRecord) {
      throw createError('Class not found', 404);
    }

    if (req.user.role === 'teacher' && classRecord.teacherId !== req.user.id) {
      throw createError('Insufficient permissions to view students for this class', 403);
    }

    const students = await StudentModel.findActiveByClassId(classId);
    const payload = students.map((student) => ({
      id: student.userId,
      name: student.name,
      email: student.email ?? null
    }));
    res.status(200).json({
      success: true,
      data: payload,
      message: 'Class students retrieved successfully'
    });
  });

  static getAssignableStudents = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    let students: Array<{ id: number; name: string; email?: string | null; classId?: number | null; className?: string | null; classIds?: number[]; classNames?: string[] }> = [];

    switch (req.user.role) {
      case 'admin':
        students = (await StudentModel.findActiveWithClassInfo()).map((student) => ({
          id: student.userId,
          name: student.name,
          email: student.email ?? null,
          classId: student.classId ?? null,
          className: student.className ?? null,
          classIds: student.classIds ?? [],
          classNames: student.classNames ?? []
        }));
        break;
      case 'teacher': {
        const teacherClasses = await ClassModel.findByTeacherId(req.user.id);
        const classIds = teacherClasses.map((cls) => cls.id);
        const teacherStudents = classIds.length > 0
          ? await StudentModel.findActiveWithClassInfo()
          : [];
        const allowedClassIds = new Set(classIds);
        students = teacherStudents
          .filter((student) => (student.classIds ?? []).some((id) => allowedClassIds.has(id)))
          .map((student) => ({
            id: student.userId,
            name: student.name,
            email: student.email ?? null,
            classId: student.classId ?? null,
            className: student.className ?? null,
            classIds: student.classIds ?? [],
            classNames: student.classNames ?? []
          }));
        break;
      }
      default:
        throw createError('Insufficient permissions', 403);
    }

    res.status(200).json({
      success: true,
      data: students,
      message: 'Assignable students retrieved successfully'
    });
  });
}
