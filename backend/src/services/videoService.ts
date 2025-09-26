import { VideoModel } from '../models/videoModel';
import { VideoProgress, VideoProgressSummary } from '../types';
import ActivityLogService from './activityLogService';
import { CourseModel } from '../models/courseModel';

function createValidationError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

export class VideoService {
  // 동영상 진행 상황 조회
  static async getProgress(studentId: number, videoBlockId: number): Promise<VideoProgress | null> {
    return await VideoModel.getProgress(studentId, videoBlockId);
  }

  // 동영상 진행 상황 업데이트
  static async updateProgress(progressData: {
    studentId: number;
    videoBlockId: number;
    watchedDuration: number;
    totalDuration: number;
  }): Promise<VideoProgress> {
    // 접근 제어: 해당 블록이 비디오이며, 학생이 강의에 배정되어 있는지 확인
    const block = await CourseModel.getContentBlockById(progressData.videoBlockId);
    if (!block || block.type !== 'video') {
      throw createValidationError('Invalid video block', 400);
    }
    const isAssigned = await CourseModel.isStudentAssigned(block.courseId, progressData.studentId);
    if (!isAssigned) {
      throw createValidationError('Insufficient permissions for this content', 403);
    }

    const existing = await VideoModel.getProgress(progressData.studentId, progressData.videoBlockId);

    const previousWatched = existing?.watchedDuration ?? 0;
    const previousTotal = existing?.totalDuration ?? 0;
    const candidateTotal = Math.max(progressData.totalDuration, previousTotal, 1);
    const candidateWatched = Math.max(progressData.watchedDuration, previousWatched, 0);
    const normalizedWatched = Math.min(candidateTotal, candidateWatched);

    const progressPercentage = candidateTotal > 0
      ? Math.min(100, Math.round((normalizedWatched / candidateTotal) * 10000) / 100)
      : 0;

    const isCompleted = progressPercentage >= 95 || existing?.isCompleted === true;

    await VideoModel.upsertProgress({
      studentId: progressData.studentId,
      videoBlockId: progressData.videoBlockId,
      watchedDuration: normalizedWatched,
      totalDuration: candidateTotal,
      progressPercentage,
      isCompleted
    });

    const updated = await VideoModel.getProgress(progressData.studentId, progressData.videoBlockId);

    if (updated) {
      const delta = normalizedWatched - previousWatched;
      if (delta > 0 || (isCompleted && !existing?.isCompleted)) {
        await ActivityLogService.logVideoProgress({
          userId: progressData.studentId,
          videoBlockId: progressData.videoBlockId,
          watchedDuration: normalizedWatched,
          totalDuration: candidateTotal,
          progressPercentage,
          completed: isCompleted,
          deltaWatched: delta > 0 ? delta : undefined
        });
      }
    }

    return updated!;
  }

  // 특정 학생의 모든 동영상 진행 상황 조회
  static async getStudentProgress(studentId: number): Promise<VideoProgress[]> {
    return await VideoModel.getStudentProgress(studentId);
  }

  // 특정 강의의 모든 동영상 진행 상황 조회
  static async getCourseVideoProgress(courseId: number): Promise<VideoProgress[]> {
    return await VideoModel.getCourseVideoProgress(courseId);
  }
  

  // 특정 학생의 특정 강의 동영상 진행 상황 조회
  static async getStudentCourseProgress(studentId: number, courseId: number): Promise<VideoProgress[]> {
    return await VideoModel.getStudentCourseProgress(studentId, courseId);
  }

  static async getCourseVideoSummary(courseId: number): Promise<VideoProgressSummary[]> {
    return await VideoModel.getCourseSummary(courseId);
  }

  static async getCourseAggregates(courseIds: number[]) {
    return await VideoModel.getCourseAggregates(courseIds);
  }

  static async getTeacherCourseVideoProgress(teacherId: number) {
    return await VideoModel.getTeacherCourseVideoProgress(teacherId);
  }

  static async getStudentCourseVideoDetails(studentId: number, courseIds: number[]) {
    return await VideoModel.getStudentCourseVideoDetails(studentId, courseIds);
  }
}
