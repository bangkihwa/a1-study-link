import { query } from '../config/database';
import { VideoProgress, VideoProgressSummary } from '../types';

export class VideoModel {
  // 동영상 진행 상황 조회
  static async getProgress(studentId: number, videoBlockId: number): Promise<VideoProgress | null> {
    const progress = await query(
      `SELECT id, student_id as studentId, video_block_id as videoBlockId, watched_duration as watchedDuration, 
              total_duration as totalDuration, progress_percentage as progressPercentage, is_completed as isCompleted, 
              last_watched_at as lastWatchedAt, created_at as createdAt, updated_at as updatedAt
       FROM video_progress 
       WHERE student_id = ? AND video_block_id = ?`,
      [studentId, videoBlockId]
    ) as VideoProgress[];
    
    return progress.length > 0 ? progress[0] : null;
  }

  // 동영상 진행 상황 업데이트 또는 생성
  static async upsertProgress(progressData: {
    studentId: number;
    videoBlockId: number;
    watchedDuration: number;
    totalDuration: number;
    progressPercentage: number;
    isCompleted: boolean;
  }): Promise<number> {
    // 먼저 기존 진행 상황이 있는지 확인
    const existing = await this.getProgress(progressData.studentId, progressData.videoBlockId);
    
    if (existing) {
      // 기존 진행 상황 업데이트
      await query(
        `UPDATE video_progress 
         SET watched_duration = ?, total_duration = ?, progress_percentage = ?, is_completed = ?, last_watched_at = NOW(), updated_at = NOW()
         WHERE student_id = ? AND video_block_id = ?`,
        [
          progressData.watchedDuration,
          progressData.totalDuration,
          progressData.progressPercentage,
          progressData.isCompleted,
          progressData.studentId,
          progressData.videoBlockId
        ]
      );
      return existing.id;
    } else {
      // 새로운 진행 상황 생성
      const result = await query(
        `INSERT INTO video_progress 
         (student_id, video_block_id, watched_duration, total_duration, progress_percentage, is_completed, last_watched_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          progressData.studentId,
          progressData.videoBlockId,
          progressData.watchedDuration,
          progressData.totalDuration,
          progressData.progressPercentage,
          progressData.isCompleted
        ]
      ) as any;
      return result.insertId;
    }
  }

  // 특정 학생의 모든 동영상 진행 상황 조회
  static async getStudentProgress(studentId: number): Promise<VideoProgress[]> {
    const progress = await query(
      `SELECT id, student_id as studentId, video_block_id as videoBlockId, watched_duration as watchedDuration, 
              total_duration as totalDuration, progress_percentage as progressPercentage, is_completed as isCompleted, 
              last_watched_at as lastWatchedAt, created_at as createdAt, updated_at as updatedAt
       FROM video_progress 
       WHERE student_id = ?
       ORDER BY last_watched_at DESC`,
      [studentId]
    ) as VideoProgress[];
    
    return progress;
  }

  // 특정 강의의 모든 동영상 진행 상황 조회
  static async getCourseVideoProgress(courseId: number): Promise<VideoProgress[]> {
    const progress = await query(
      `SELECT vp.id,
              vp.student_id as studentId,
              u.name as studentName,
              vp.video_block_id as videoBlockId,
              cb.title as blockTitle,
              cb.type as blockType,
              vp.watched_duration as watchedDuration,
              vp.total_duration as totalDuration,
              vp.progress_percentage as progressPercentage,
              vp.is_completed as isCompleted,
              vp.last_watched_at as lastWatchedAt,
              vp.created_at as createdAt,
              vp.updated_at as updatedAt
       FROM video_progress vp
       JOIN content_blocks cb ON vp.video_block_id = cb.id
       JOIN users u ON vp.student_id = u.id
       WHERE cb.course_id = ?
       ORDER BY u.name ASC, cb.order_index ASC`,
      [courseId]
    ) as VideoProgress[];
    
    return progress;
  }

  // 특정 학생의 특정 강의 동영상 진행 상황 조회
  static async getStudentCourseProgress(studentId: number, courseId: number): Promise<VideoProgress[]> {
    const progress = await query(
      `SELECT vp.id, vp.student_id as studentId, vp.video_block_id as videoBlockId, vp.watched_duration as watchedDuration, 
              vp.total_duration as totalDuration, vp.progress_percentage as progressPercentage, vp.is_completed as isCompleted, 
              vp.last_watched_at as lastWatchedAt, vp.created_at as createdAt, vp.updated_at as updatedAt
       FROM video_progress vp
       JOIN content_blocks cb ON vp.video_block_id = cb.id
       WHERE vp.student_id = ? AND cb.course_id = ?
       ORDER BY vp.last_watched_at DESC`,
      [studentId, courseId]
    ) as VideoProgress[];
    
    return progress;
  }

  static async getCourseSummary(courseId: number): Promise<VideoProgressSummary[]> {
    const rows = await query(
      `SELECT 
         cb.id as blockId,
         cb.title as blockTitle,
         cb.order_index as orderIndex,
         cb.is_required as isRequired,
         COUNT(vp.id) as trackedStudents,
         SUM(CASE WHEN vp.is_completed = TRUE THEN 1 ELSE 0 END) as completedCount,
         AVG(vp.progress_percentage) as averageProgress,
         MAX(vp.updated_at) as lastActivityAt
       FROM content_blocks cb
       LEFT JOIN video_progress vp ON vp.video_block_id = cb.id
       WHERE cb.course_id = ? AND cb.type = 'video'
       GROUP BY cb.id, cb.title, cb.order_index, cb.is_required
       ORDER BY cb.order_index ASC`,
      [courseId]
    ) as any[];

    return rows.map((row) => ({
      blockId: row.blockId,
      blockTitle: row.blockTitle,
      orderIndex: row.orderIndex,
      isRequired: Boolean(row.isRequired),
      trackedStudents: Number(row.trackedStudents || 0),
      completedCount: Number(row.completedCount || 0),
      averageProgress: row.averageProgress !== null ? Number(row.averageProgress) : 0,
      lastActivityAt: row.lastActivityAt ? new Date(row.lastActivityAt) : null
    }));
  }

  static async getCourseAggregates(courseIds: number[]): Promise<Array<{
    courseId: number;
    averageProgress: number;
    uniqueStudents: number;
    videoBlockCount: number;
  }>> {
    if (courseIds.length === 0) {
      return [];
    }

    const placeholders = courseIds.map(() => '?').join(', ');

    const rows = await query(
      `SELECT 
         c.id as courseId,
         COUNT(DISTINCT CASE WHEN cb.type = 'video' THEN cb.id END) as videoBlockCount,
         COUNT(DISTINCT CASE WHEN cb.type = 'video' THEN vp.student_id END) as uniqueStudents,
         AVG(vp.progress_percentage) as averageProgress
       FROM courses c
       LEFT JOIN content_blocks cb ON cb.course_id = c.id AND cb.type = 'video'
       LEFT JOIN video_progress vp ON vp.video_block_id = cb.id
       WHERE c.id IN (${placeholders})
       GROUP BY c.id`,
      courseIds
    ) as Array<{
      courseId: number;
      videoBlockCount: number | null;
      uniqueStudents: number | null;
      averageProgress: number | null;
    }>;

    return rows.map((row) => ({
      courseId: row.courseId,
      videoBlockCount: Number(row.videoBlockCount || 0),
      uniqueStudents: Number(row.uniqueStudents || 0),
      averageProgress: row.averageProgress !== null ? Number(row.averageProgress) : 0
    }));
  }

  static async getTeacherCourseVideoProgress(teacherId: number): Promise<Array<VideoProgress & { courseId: number }>> {
    const rows = await query(
      `SELECT 
         vp.id,
         cb.course_id as courseId,
         vp.student_id as studentId,
         u.name as studentName,
         vp.video_block_id as videoBlockId,
         cb.title as blockTitle,
         cb.type as blockType,
         vp.watched_duration as watchedDuration,
         vp.total_duration as totalDuration,
         vp.progress_percentage as progressPercentage,
         vp.is_completed as isCompleted,
         vp.last_watched_at as lastWatchedAt,
         vp.created_at as createdAt,
         vp.updated_at as updatedAt
       FROM video_progress vp
       JOIN content_blocks cb ON vp.video_block_id = cb.id
       JOIN courses c ON cb.course_id = c.id
       JOIN users u ON vp.student_id = u.id
       WHERE c.teacher_id = ?
       ORDER BY cb.course_id ASC, u.name ASC, cb.order_index ASC`,
      [teacherId]
    ) as Array<VideoProgress & { courseId: number }>;

    return rows;
  }

  static async getStudentCourseVideoDetails(studentId: number, courseIds: number[]): Promise<Array<{
    courseId: number;
    blockId: number;
    blockTitle: string;
    orderIndex: number;
    progressPercentage: number;
    isCompleted: boolean;
  }>> {
    if (courseIds.length === 0) {
      return [];
    }

    const placeholders = courseIds.map(() => '?').join(', ');

    const rows = await query(
      `SELECT
         cb.course_id as courseId,
         cb.id as blockId,
         cb.title as blockTitle,
         cb.order_index as orderIndex,
         COALESCE(vp.progress_percentage, 0) as progressPercentage,
         COALESCE(vp.is_completed, FALSE) as isCompleted,
         vp.watched_duration as watchedDuration,
         vp.total_duration as totalDuration,
         vp.last_watched_at as lastWatchedAt
       FROM content_blocks cb
       LEFT JOIN video_progress vp ON vp.video_block_id = cb.id AND vp.student_id = ?
       WHERE cb.course_id IN (${placeholders}) AND cb.type = 'video'
       ORDER BY cb.course_id ASC, cb.order_index ASC`,
     [studentId, ...courseIds]
  ) as Array<{
     courseId: number;
     blockId: number;
     blockTitle: string;
     orderIndex: number;
     progressPercentage: number;
     isCompleted: number;
     watchedDuration: number | null;
     totalDuration: number | null;
     lastWatchedAt: Date | null;
   }>;

  return rows.map((row) => ({
    courseId: row.courseId,
    blockId: row.blockId,
    blockTitle: row.blockTitle,
    orderIndex: row.orderIndex,
    progressPercentage: Number(row.progressPercentage || 0),
    isCompleted: Boolean(row.isCompleted),
    watchedDuration: row.watchedDuration !== null ? Number(row.watchedDuration) : undefined,
    totalDuration: row.totalDuration !== null ? Number(row.totalDuration) : undefined,
    lastWatchedAt: row.lastWatchedAt ? new Date(row.lastWatchedAt) : undefined
  }));
}

/**
 * Delete all video_progress rows for given content block ids
 */
static async deleteProgressByBlockIds(blockIds: number[]): Promise<void> {
  if (!Array.isArray(blockIds) || blockIds.length === 0) {
    return;
  }
  const placeholders = blockIds.map(() => '?').join(', ');
  await query(
    `DELETE FROM video_progress WHERE video_block_id IN (${placeholders})`,
    blockIds
  );
}
}
