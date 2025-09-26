import { CourseModel } from '../models/courseModel';
import ClassModel from '../models/classModel';
import { UserModel } from '../models/userModel';
import StudentModel from '../models/studentModel';
import { VideoService } from './videoService';
import { NotificationService } from './notificationService';
import { TestModel } from '../models/testModel';
import QnaModel from '../models/qnaModel';
import {
  Course,
  ContentBlock,
  ContentBlockStudentStatus,
  TestSubmission
} from '../types';
import { validateYouTubeUrl } from '../utils/video';


interface Requester {
  id: number;
  role: 'admin' | 'teacher' | 'student' | 'parent';
}

interface StudentVideoDetail {
  courseId: number;
  blockId: number;
  blockTitle: string;
  orderIndex: number;
  progressPercentage: number;
  isCompleted: boolean;
  watchedDuration?: number;
  totalDuration?: number;
  lastWatchedAt?: Date | null;
}

const parseContent = (block: ContentBlock): ContentBlock => ({
  ...block,
  content: typeof block.content === 'string' ? JSON.parse(block.content as unknown as string) : block.content
});

export class CourseService {
  private static normalizeBlockContent(type: string, content: any) {
    switch (type) {
      case 'video': {
        const { url, videoId } = validateYouTubeUrl(typeof content?.url === 'string' ? content.url : '');
        return {
          url,
          videoId
        };
      }
      case 'mindmap': {
        const url = typeof content?.url === 'string' ? content.url.trim() : '';
        if (!url) {
          throw createValidationError('Mindmap URL is required', 400);
        }
        return { url };
      }
      case 'test': {
        const testId = Number(content?.testId);
        if (!Number.isInteger(testId) || testId <= 0) {
          throw createValidationError('A valid test must be selected for test content blocks', 400);
        }
        return { testId };
      }
      case 'text':
      default:
        return {
          body: typeof content?.body === 'string' ? content.body : ''
        };
    }
  }
 
  private static buildStudentCourseData(
    blocks: ContentBlock[],
    videoDetailByBlock: Map<number, StudentVideoDetail>,
    submissionMap: Record<number, TestSubmission>
  ) {
    const sortedBlocks = [...blocks].sort((a, b) => a.orderIndex - b.orderIndex);
 
    const contentBlocks = sortedBlocks.map((block) => {
      const studentStatus: ContentBlockStudentStatus = {
        isCompleted: false
      };
 
      if (block.type === 'video') {
        const detail = videoDetailByBlock.get(block.id);
        studentStatus.progressPercentage = detail?.progressPercentage ?? 0;
        studentStatus.isCompleted = detail?.isCompleted ?? false;
        if (typeof detail?.watchedDuration === 'number') {
          studentStatus.watchedDuration = detail.watchedDuration;
        }
        if (typeof detail?.totalDuration === 'number') {
          studentStatus.totalDuration = detail.totalDuration;
        }
        studentStatus.lastWatchedAt = detail?.lastWatchedAt ?? null;
      } else if (block.type === 'test') {
        const testId = Number((block.content as any)?.testId);
        const submission = Number.isInteger(testId) && testId > 0 ? submissionMap[testId] : undefined;
        studentStatus.isCompleted = Boolean(submission);
        studentStatus.hasSubmission = Boolean(submission);
        studentStatus.submissionStatus = submission
          ? {
              submissionId: submission.id,
              isGraded: submission.isGraded,
              isPublished: submission.isPublished,
              score: submission.score ?? null,
              submittedAt: submission.submittedAt ?? null
            }
          : null;
      } else {
        studentStatus.isCompleted = true;
      }
 
      return {
        ...block,
        studentStatus
      };
    });
 
    const requiredBlocks = contentBlocks.filter(
      (block) => block.isRequired !== false && (block.type === 'video' || block.type === 'test')
    );
    const totalRequired = requiredBlocks.length;
    const completedRequired = requiredBlocks.filter((block) => block.studentStatus?.isCompleted).length;
    const progressPercentageRaw =
      totalRequired > 0
        ? (completedRequired / totalRequired) * 100
        : contentBlocks.length > 0
          ? 100
          : 0;
    const progressPercentage = Math.min(100, progressPercentageRaw);
 
    const nextRequiredBlock = requiredBlocks.find((block) => !block.studentStatus?.isCompleted);
 
    const studentProgress: Course['studentProgress'] = {
      progressPercentage,
      completedBlocks: completedRequired,
      totalBlocks: totalRequired,
      nextUncompletedTitle: nextRequiredBlock?.title,
      nextUncompletedBlockId: nextRequiredBlock?.id
    };
 
    let nextContent: Course['nextContent'];
 
    if (nextRequiredBlock) {
      nextContent = {
        blockId: nextRequiredBlock.id,
        type: nextRequiredBlock.type,
        title: nextRequiredBlock.title,
        isRequired: nextRequiredBlock.isRequired !== false,
        status: 'pending',
        progressPercentage:
          nextRequiredBlock.type === 'video'
            ? nextRequiredBlock.studentStatus?.progressPercentage ?? 0
            : undefined,
        videoId:
          nextRequiredBlock.type === 'video'
            ? (nextRequiredBlock.content as any)?.videoId ?? null
            : undefined,
        testId:
          nextRequiredBlock.type === 'test'
            ? Number((nextRequiredBlock.content as any)?.testId) || null
            : undefined
      };
    } else if (contentBlocks.length > 0) {
      const fallbackBlock =
        requiredBlocks.length > 0
          ? requiredBlocks[requiredBlocks.length - 1]
          : contentBlocks[contentBlocks.length - 1];
 
      if (fallbackBlock) {
        nextContent = {
          blockId: fallbackBlock.id,
          type: fallbackBlock.type,
          title: fallbackBlock.title,
          isRequired: fallbackBlock.isRequired !== false,
          status: 'completed',
          progressPercentage:
            fallbackBlock.type === 'video'
              ? fallbackBlock.studentStatus?.progressPercentage ?? 100
              : undefined,
          videoId:
            fallbackBlock.type === 'video'
              ? (fallbackBlock.content as any)?.videoId ?? null
              : undefined,
          testId:
            fallbackBlock.type === 'test'
              ? Number((fallbackBlock.content as any)?.testId) || null
              : undefined
        };
      }
    }
 
    return {
      contentBlocks,
      studentProgress,
      nextContent
    };
  }
 
  static async getAllCourses(options?: { onlyPublished?: boolean }): Promise<Course[]> {
    return await CourseModel.findAll(options);
  }

  static async getAdminCourseSummaries(): Promise<any[]> {
    return await CourseModel.findAllWithRelations({ onlyPublished: false });
  }

  static async getCourseById(id: number, options?: { onlyPublished?: boolean }): Promise<Course | null> {
    const course = await CourseModel.findById(id, options);
    if (!course) {
      return null;
    }
    const assignedStudents = await CourseModel.getCourseStudents(course.id);
    course.assignedStudents = assignedStudents;
    return course;
  }

  static async getCourseWithContent(courseId: number, options?: { onlyPublished?: boolean }) {
    const course = await CourseModel.findById(courseId, options);
    if (!course) {
      return null;
    }
    const blocks = await CourseModel.getContentBlocks(courseId);
    const assignedStudents = await CourseModel.getCourseStudents(courseId);
    return {
      ...course,
      contentBlocks: blocks.map(parseContent),
      assignedStudents
    };
  }

  static async prepareCourseForViewer(course: any, viewer: Requester) {
    const result: any = {
      ...course,
      contentBlocks: Array.isArray(course?.contentBlocks) ? [...course.contentBlocks] : []
    };

    if (viewer.role === 'student') {
      const blocks = result.contentBlocks as ContentBlock[];
      const videoDetails = await VideoService.getStudentCourseVideoDetails(viewer.id, [course.id]);
      const videoDetailByBlock = new Map<number, StudentVideoDetail>();
      videoDetails.forEach((detail) => {
        videoDetailByBlock.set(detail.blockId, detail);
      });

      const submissionMap = await TestModel.getStudentSubmissionMap(viewer.id);
      const learnerData = this.buildStudentCourseData(blocks, videoDetailByBlock, submissionMap);

      result.contentBlocks = learnerData.contentBlocks;
      result.studentProgress = learnerData.studentProgress;
      result.nextContent = learnerData.nextContent;
    } else if (viewer.role === 'teacher' || viewer.role === 'admin') {
      try {
        result.videoSummary = await VideoService.getCourseVideoSummary(course.id);
      } catch (error) {
        result.videoSummary = [];
      }
    }

    return result;
  }

  static async getCoursesByClassId(classId: number, options?: { onlyPublished?: boolean }): Promise<Course[]> {
    return await CourseModel.findByClassId(classId, options);
  }

  static async getCoursesByTeacherId(teacherId: number, options?: { onlyPublished?: boolean }): Promise<Course[]> {
    return await CourseModel.findByTeacherId(teacherId, options);
  }

  static async getCoursesByStudentId(studentId: number): Promise<Course[]> {
    return await CourseModel.findByStudentId(studentId);
  }

  static async isStudentAssignedToCourse(courseId: number, studentId: number): Promise<boolean> {
    const directlyAssigned = await CourseModel.isStudentAssigned(courseId, studentId);
    if (directlyAssigned) {
      return true;
    }

    const course = await CourseModel.findById(courseId, { onlyPublished: false });
    if (!course) {
      return false;
    }

    const classStudents = await StudentModel.findActiveByClassIds([course.classId]);
    return classStudents.some((student) => student.userId === studentId);
  }

  static async isAnyStudentAssignedToCourse(courseId: number, studentIds: number[]): Promise<boolean> {
    if (!studentIds.length) {
      return false;
    }

    const hasDirect = await CourseModel.isAnyStudentAssigned(courseId, studentIds);
    if (hasDirect) {
      return true;
    }

    const course = await CourseModel.findById(courseId, { onlyPublished: false });
    if (!course) {
      return false;
    }

    const classStudents = await StudentModel.findActiveByClassIds([course.classId]);
    if (!classStudents.length) {
      return false;
    }

    const classStudentSet = new Set(classStudents.map((student) => student.userId));
    return studentIds.some((id) => classStudentSet.has(id));
  }

  static async getStudentCourseSummaries(studentId: number): Promise<Course[]> {
    const courses = await CourseModel.findByStudentId(studentId);

    if (courses.length === 0) {
      return [];
    }

    const visibleCourses = courses.filter((course) => course.isPublished);
    if (!visibleCourses.length) {
      return [];
    }

    const courseIds = visibleCourses.map((course) => course.id);

    const [videoDetails, submissionMap, rawBlocks] = await Promise.all([
      VideoService.getStudentCourseVideoDetails(studentId, courseIds) as Promise<StudentVideoDetail[]>,
      TestModel.getStudentSubmissionMap(studentId),
      CourseModel.getContentBlocksForCourses(courseIds)
    ]);

    const parsedBlocks = rawBlocks.map(parseContent);

    const blocksByCourse = new Map<number, ContentBlock[]>();
    parsedBlocks.forEach((block) => {
      if (!blocksByCourse.has(block.courseId)) {
        blocksByCourse.set(block.courseId, []);
      }
      blocksByCourse.get(block.courseId)!.push(block);
    });

    const videoDetailByBlock = new Map<number, StudentVideoDetail>();
    videoDetails.forEach((detail) => {
      videoDetailByBlock.set(detail.blockId, detail);
    });

    return visibleCourses.map((course) => {
      const courseBlocks = (blocksByCourse.get(course.id) || []).map((block) => {
        const studentStatus: ContentBlockStudentStatus = {
          isCompleted: false
        };

        const isRequired = block.isRequired !== false;

        if (block.type === 'video') {
          const detail = videoDetailByBlock.get(block.id);
          studentStatus.progressPercentage = detail ? detail.progressPercentage : 0;
          studentStatus.isCompleted = detail ? detail.isCompleted : false;
          if (detail && typeof detail.watchedDuration === 'number') {
            studentStatus.watchedDuration = detail.watchedDuration;
          }
          if (detail && typeof detail.totalDuration === 'number') {
            studentStatus.totalDuration = detail.totalDuration;
          }
          studentStatus.lastWatchedAt = detail?.lastWatchedAt ?? null;
        } else if (block.type === 'test') {
          const testId = Number((block.content as any)?.testId);
          const submission: TestSubmission | undefined =
            Number.isInteger(testId) && testId > 0 ? submissionMap[testId] : undefined;

          studentStatus.isCompleted = Boolean(submission);
          studentStatus.hasSubmission = Boolean(submission);
          studentStatus.submissionStatus = submission
            ? {
                submissionId: submission.id,
                isGraded: submission.isGraded,
                isPublished: submission.isPublished,
                score: submission.score ?? null,
                submittedAt: submission.submittedAt ?? null
              }
            : null;
        } else {
          // Non-tracked block types are considered completed for progress purposes.
          studentStatus.isCompleted = true;
        }

        return {
          ...block,
          isRequired,
          studentStatus
        };
      });

      const requiredBlocks = courseBlocks.filter(
        (block) => block.isRequired !== false && (block.type === 'video' || block.type === 'test')
      );
      const totalRequired = requiredBlocks.length;
      const completedRequired = requiredBlocks.filter((block) => block.studentStatus?.isCompleted).length;
      const progressPercentageRaw =
        totalRequired > 0
          ? (completedRequired / totalRequired) * 100
          : courseBlocks.length > 0
            ? 100
            : 0;
      const progressPercentage = Math.min(100, progressPercentageRaw);

      const nextRequiredBlock = requiredBlocks.find((block) => !block.studentStatus?.isCompleted);

      const studentProgress = {
        progressPercentage,
        completedBlocks: completedRequired,
        totalBlocks: totalRequired,
        nextUncompletedTitle: nextRequiredBlock?.title,
        nextUncompletedBlockId: nextRequiredBlock?.id
      };

      let nextContent: Course['nextContent'];

      if (nextRequiredBlock) {
        nextContent = {
          blockId: nextRequiredBlock.id,
          type: nextRequiredBlock.type,
          title: nextRequiredBlock.title,
          isRequired: nextRequiredBlock.isRequired !== false,
          status: 'pending',
          progressPercentage: nextRequiredBlock.type === 'video'
            ? nextRequiredBlock.studentStatus?.progressPercentage ?? 0
            : undefined,
          videoId: nextRequiredBlock.type === 'video'
            ? (nextRequiredBlock.content as any)?.videoId ?? null
            : undefined,
          testId: nextRequiredBlock.type === 'test'
            ? Number((nextRequiredBlock.content as any)?.testId) || null
            : undefined
        };
      } else if (courseBlocks.length > 0) {
        const fallbackBlock =
          requiredBlocks.length > 0
            ? requiredBlocks[requiredBlocks.length - 1]
            : courseBlocks[courseBlocks.length - 1];

        if (fallbackBlock) {
          nextContent = {
            blockId: fallbackBlock.id,
            type: fallbackBlock.type,
            title: fallbackBlock.title,
            isRequired: fallbackBlock.isRequired !== false,
            status: 'completed',
            progressPercentage: fallbackBlock.type === 'video'
              ? fallbackBlock.studentStatus?.progressPercentage ?? 100
              : undefined,
            videoId: fallbackBlock.type === 'video'
              ? (fallbackBlock.content as any)?.videoId ?? null
              : undefined,
            testId: fallbackBlock.type === 'test'
              ? Number((fallbackBlock.content as any)?.testId) || null
              : undefined
          };
        }
      }

      return {
        ...course,
        studentProgress,
        nextContent
      };
    });
  }

  private static async ensureClassExists(classId: number) {
    const classRecord = await ClassModel.findById(classId);
    if (!classRecord) {
      throw createValidationError('Class not found', 404);
    }
    return classRecord;
  }

  private static async ensureTeacherExists(teacherId: number) {
    const teacher = await UserModel.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      throw createValidationError('Teacher not found', 404);
    }
    if (!teacher.isApproved) {
      throw createValidationError('Teacher not approved', 400);
    }
    if (!teacher.isActive) {
      throw createValidationError('Teacher is inactive', 400);
    }
    return teacher;
  }

  private static ensureCanEditCourse(requester: Requester, course: Course, classTeacherId?: number | null) {
    if (requester.role === 'admin') {
      return;
    }

    if (requester.role === 'teacher') {
      if (course.teacherId !== requester.id && classTeacherId !== requester.id) {
        throw createValidationError('Insufficient permissions to modify this course', 403);
      }
      return;
    }

    throw createValidationError('Insufficient permissions', 403);
  }

  static async createCourse(requester: Requester, data: {
    title: string;
    description?: string;
    classId: number;
    teacherId?: number;
    isPublished?: boolean;
    initialVideoUrl: string;
    initialVideoTitle?: string;
  }): Promise<Course> {
    if (requester.role !== 'admin' && requester.role !== 'teacher') {
      throw createValidationError('Insufficient permissions to create course', 403);
    }

    const classRecord = await this.ensureClassExists(data.classId);

    let teacherId: number;
    if (requester.role === 'teacher') {
      if (classRecord.teacherId && classRecord.teacherId !== requester.id) {
        throw createValidationError('You are not assigned to this class', 403);
      }
      teacherId = requester.id;
    } else {
      if (data.teacherId) {
        await this.ensureTeacherExists(data.teacherId);
        teacherId = data.teacherId;
      } else if (classRecord.teacherId) {
        teacherId = classRecord.teacherId;
      } else {
        throw createValidationError('Teacher must be assigned to the course', 400);
      }
    }

    const normalizedVideo = validateYouTubeUrl(data.initialVideoUrl);
    if (!normalizedVideo.videoId) {
      throw createValidationError('A valid YouTube video URL is required for the initial video.', 400);
    }
    const initialVideoTitle = (data.initialVideoTitle ?? '').trim() || '첫 학습 영상';
    const initialPublishState = data.isPublished === undefined ? false : Boolean(data.isPublished);

    let courseId: number | null = null;

    try {
      courseId = await CourseModel.create({
        title: data.title,
        description: data.description,
        classId: data.classId,
        teacherId,
        isPublished: initialPublishState
      });

      const orderIndex = await CourseModel.getNextOrderIndex(courseId);
      await CourseModel.createContentBlock({
        courseId,
        type: 'video',
        title: initialVideoTitle,
        content: {
          url: normalizedVideo.url,
          videoId: normalizedVideo.videoId
        },
        orderIndex,
        isRequired: true
      });

      const created = await CourseModel.findById(courseId, { onlyPublished: false });
      if (!created) {
        throw createValidationError('Failed to create course', 500);
      }

      created.assignedStudents = [];

      // Notify teacher on admin-created course assignment
      if (requester.role === 'admin' && created.teacherId) {
        await NotificationService.createCourseAssignedNotification(created.teacherId, created.title, created.id);
      }

      return created;
    } catch (error) {
      if (courseId !== null) {
        try {
          await CourseModel.delete(courseId);
        } catch (cleanupError) {
          console.error('Failed to rollback course creation', cleanupError);
        }
      }
      throw error;
    }
  }

  static async updateCourse(requester: Requester, courseId: number, updates: {
    title?: string;
    description?: string;
    classId?: number;
    teacherId?: number;
    isPublished?: boolean;
  }): Promise<Course> {
    const course = await CourseModel.findById(courseId, { onlyPublished: false });
    if (!course) {
      throw createValidationError('Course not found', 404);
    }

    const prevTeacherId = course.teacherId ?? null;

    let classTeacherId: number | null | undefined;
    if (updates.classId !== undefined) {
      const classRecord = await this.ensureClassExists(updates.classId);
      classTeacherId = classRecord.teacherId;
    } else {
      const currentClass = await ClassModel.findById(course.classId);
      classTeacherId = currentClass?.teacherId;
    }

    this.ensureCanEditCourse(requester, course, classTeacherId);

    const payload: any = {};

    if (updates.title !== undefined) {
      payload.title = updates.title;
    }
    if (updates.description !== undefined) {
      payload.description = updates.description;
    }
    if (updates.classId !== undefined) {
      payload.classId = updates.classId;
    }

    if (requester.role === 'admin' && updates.teacherId !== undefined) {
      await this.ensureTeacherExists(updates.teacherId);
      payload.teacherId = updates.teacherId;
    } else if (requester.role === 'teacher') {
      payload.teacherId = requester.id;
    }

    if (updates.isPublished !== undefined) {
      payload.isPublished = updates.isPublished;
    }

    await CourseModel.update(courseId, payload);

    const updated = await CourseModel.findById(courseId, { onlyPublished: false });
    if (!updated) {
      throw createValidationError('Course not found', 404);
    }

    const assigned = await CourseModel.getCourseStudents(courseId);
    updated.assignedStudents = assigned;

    // Notifications: only when admin performs the change to avoid noise
    if (requester.role === 'admin') {
      const nextTeacherId = updated.teacherId ?? null;
      const courseTitle = updated.title;

      if (prevTeacherId && prevTeacherId !== nextTeacherId) {
        await NotificationService.createCourseUnassignedNotification(prevTeacherId, courseTitle, courseId);
      }
      if (nextTeacherId && prevTeacherId !== nextTeacherId) {
        await NotificationService.createCourseAssignedNotification(nextTeacherId, courseTitle, courseId);
      }

      const hasNonTeacherChange = Object.keys(updates).some((k) => k !== 'teacherId' && k !== 'isPublished');
      if (nextTeacherId && hasNonTeacherChange) {
        await NotificationService.createCourseUpdatedNotification(nextTeacherId, courseTitle, courseId);
      }

      if (updates.isPublished !== undefined && course.isPublished !== updated.isPublished && nextTeacherId) {
        await NotificationService.createCoursePublishStateChangedNotification(nextTeacherId, courseTitle, courseId, updated.isPublished!);
      }
    }

    return updated;
  }

  static async deleteCourse(requester: Requester, courseId: number): Promise<void> {
    const course = await CourseModel.findById(courseId, { onlyPublished: false });
    if (!course) {
      throw createValidationError('Course not found', 404);
    }

    const classRecord = await ClassModel.findById(course.classId);
    this.ensureCanEditCourse(requester, course, classRecord?.teacherId);

    const courseTitle = course.title;
    const teacherId = course.teacherId ?? null;

    // Gather related entities for safe hard delete
    const blocks = await CourseModel.getContentBlocks(courseId);
    const videoBlockIds = blocks.filter((b) => b.type === 'video').map((b) => b.id);
    const testIds = blocks
      .filter((b) => b.type === 'test')
      .map((b) => {
        try {
          const content = typeof b.content === 'string' ? JSON.parse(b.content as any) : (b.content as any);
          const id = Number(content?.testId);
          return Number.isInteger(id) && id > 0 ? id : null;
        } catch {
          return null;
        }
      })
      .filter((v): v is number => typeof v === 'number');

    // Delete dependent rows
    if (videoBlockIds.length) {
      await VideoService.getCourseAggregates([]); // no-op to ensure import is used
    }
    if (videoBlockIds.length) {
      const { VideoModel } = await import('../models/videoModel');
      await VideoModel.deleteProgressByBlockIds(videoBlockIds);
    }
    if (testIds.length) {
      await TestModel.deleteDeepByIds(testIds);
    }
    await QnaModel.deleteByCourse(courseId);

    // Remove content blocks and course-student mapping
    await CourseModel.deleteCourseStudents(courseId);
    await CourseModel.deleteContentBlocksByCourse(courseId);

    // Finally delete the course
    await CourseModel.delete(courseId);

    if (requester.role === 'admin' && teacherId) {
      await NotificationService.createCourseDeletedNotification(teacherId, courseTitle);
    }
  }

  static async publishCourse(requester: Requester, courseId: number, isPublished: boolean): Promise<void> {
    const course = await CourseModel.findById(courseId, { onlyPublished: false });
    if (!course) {
      throw createValidationError('Course not found', 404);
    }

    if (requester.role === 'admin') {
      // admins always allowed
    } else if (requester.role === 'teacher') {
      if (course.teacherId !== requester.id) {
        const classRecord = await ClassModel.findById(course.classId);
        if (!classRecord || classRecord.teacherId !== requester.id) {
          throw createValidationError('Insufficient permissions to change publish state', 403);
        }
      }
    } else {
      throw createValidationError('Insufficient permissions to change publish state', 403);
    }

    const previousState = course.isPublished;
    await CourseModel.publishCourse(courseId, isPublished);

    // Notify teacher only when someone else toggles the state
    const teacherId = course.teacherId ?? null;
    if (teacherId && requester.id !== teacherId && previousState !== isPublished) {
      await NotificationService.createCoursePublishStateChangedNotification(teacherId, course.title, courseId, isPublished);
    }
  }

  static async getContentBlocks(courseId: number): Promise<ContentBlock[]> {
    const blocks = await CourseModel.getContentBlocks(courseId);
    return blocks.map(parseContent);
  }

  static async createContentBlock(requester: Requester, blockData: {
    courseId: number;
    type: string;
    title: string;
    content: any;
    isRequired?: boolean;
  }): Promise<ContentBlock> {
    const course = await CourseModel.findById(blockData.courseId, { onlyPublished: false });
    if (!course) {
      throw createValidationError('Course not found', 404);
    }
    const classRecord = await ClassModel.findById(course.classId);
    this.ensureCanEditCourse(requester, course, classRecord?.teacherId);

    const orderIndex = await CourseModel.getNextOrderIndex(blockData.courseId);
    const normalizedContent = this.normalizeBlockContent(blockData.type, blockData.content);
    const blockId = await CourseModel.createContentBlock({
      courseId: blockData.courseId,
      type: blockData.type,
      title: blockData.title,
      content: normalizedContent,
      orderIndex,
      isRequired: blockData.isRequired ?? true
    });

    const created = await CourseModel.getContentBlockById(blockId);
    if (!created) {
      throw createValidationError('Failed to create content block', 500);
    }
    return parseContent(created);
  }

  static async updateContentBlock(requester: Requester, courseId: number, blockId: number, updates: {
    title?: string;
    type?: string;
    content?: any;
    isRequired?: boolean;
  }): Promise<ContentBlock> {
    const course = await CourseModel.findById(courseId, { onlyPublished: false });
    if (!course) {
      throw createValidationError('Course not found', 404);
    }

    const classRecord = await ClassModel.findById(course.classId);
    this.ensureCanEditCourse(requester, course, classRecord?.teacherId);

    const block = await CourseModel.getContentBlockById(blockId);
    if (!block || block.courseId !== courseId) {
      throw createValidationError('Content block not found', 404);
    }

    const payload: any = { ...updates };

    if (updates.content !== undefined) {
      const nextType = updates.type ?? block.type;
      payload.content = this.normalizeBlockContent(nextType, updates.content);
    }

    await CourseModel.updateContentBlock(blockId, payload);
    const updated = await CourseModel.getContentBlockById(blockId);
    if (!updated) {
      throw createValidationError('Content block not found', 404);
    }
    return parseContent(updated);
  }

  static async deleteContentBlock(requester: Requester, courseId: number, blockId: number): Promise<void> {
    const course = await CourseModel.findById(courseId, { onlyPublished: false });
    if (!course) {
      throw createValidationError('Course not found', 404);
    }
    const classRecord = await ClassModel.findById(course.classId);
    this.ensureCanEditCourse(requester, course, classRecord?.teacherId);

    const block = await CourseModel.getContentBlockById(blockId);
    if (!block || block.courseId !== courseId) {
      throw createValidationError('Content block not found', 404);
    }

    await CourseModel.deleteContentBlock(blockId);
  }

  static async reorderContentBlocks(requester: Requester, courseId: number, orderedIds: number[]): Promise<void> {
    const course = await CourseModel.findById(courseId, { onlyPublished: false });
    if (!course) {
      throw createValidationError('Course not found', 404);
    }

    const classRecord = await ClassModel.findById(course.classId);
    this.ensureCanEditCourse(requester, course, classRecord?.teacherId);

    const blocks = await CourseModel.getContentBlocks(courseId);
    const blockIds = new Set<number>(blocks.map((block: ContentBlock) => block.id));

    if (orderedIds.length !== blocks.length || !orderedIds.every((id) => blockIds.has(id))) {
      throw createValidationError('Invalid block order payload', 400);
    }

    await CourseModel.reorderContentBlocks(courseId, orderedIds);
  }

}

function createValidationError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}
