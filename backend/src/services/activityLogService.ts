import ActivityLogModel, { ActivityLogRecord } from '../models/activityLogModel';

type ActivityType = 'video_watch' | 'test_complete' | 'question_ask' | 'login';

export class ActivityLogService {
  static async log(options: {
    userId: number;
    activityType: ActivityType;
    relatedId?: number | null;
    metadata?: any;
  }): Promise<void> {
    await ActivityLogModel.create({
      userId: options.userId,
      activityType: options.activityType,
      relatedId: options.relatedId,
      metadata: options.metadata
    });
  }

  static async logLogin(userId: number, metadata?: any): Promise<void> {
    await this.log({
      userId,
      activityType: 'login',
      metadata
    });
  }

  static async logVideoProgress(options: {
    userId: number;
    videoBlockId: number;
    watchedDuration: number;
    totalDuration: number;
    progressPercentage: number;
    completed: boolean;
    deltaWatched?: number;
  }): Promise<void> {
    await this.log({
      userId: options.userId,
      activityType: 'video_watch',
      relatedId: options.videoBlockId,
      metadata: {
        event: options.completed ? 'completed' : 'progress',
        watchedDuration: options.watchedDuration,
        totalDuration: options.totalDuration,
        progressPercentage: options.progressPercentage,
        completed: options.completed,
        deltaWatched: options.deltaWatched,
        loggedAt: new Date().toISOString()
      }
    });
  }

  static async getRecentForUser(userId: number, limit = 20): Promise<ActivityLogRecord[]> {
    return await ActivityLogModel.getRecentByUser(userId, limit);
  }

  static async getLogs(options: {
    userId?: number;
    activityType?: ActivityType;
    limit?: number;
  }): Promise<ActivityLogRecord[]> {
    return await ActivityLogModel.getLogs(options);
  }
}

export default ActivityLogService;
