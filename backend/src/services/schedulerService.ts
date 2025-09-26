import cron from 'node-cron';
import { query } from '../config/database';
import { TestService } from './testService';

export class SchedulerService {
  public static start() {
    // 매 분마다 실행
    cron.schedule('* * * * *', async () => {
      console.log('Running scheduled job: Check for tests to publish...');
      try {
        const now = new Date();
        const testsToPublish = await query(
          `SELECT id FROM tests WHERE is_published = FALSE AND publish_at IS NOT NULL AND publish_at <= ?`,
          [now]
        ) as { id: number }[];

        if (testsToPublish.length > 0) {
          const testIds = testsToPublish.map(t => t.id);
          console.log(`Publishing tests with IDs: ${testIds.join(', ')}`);

          // TestService를 통해 공개 처리하여 캘린더 동기화까지 수행
          for (const id of testIds) {
            try {
              await TestService.publishTest(id, true);
            } catch (err) {
              console.error(`Failed to publish scheduled test ${id}:`, err);
            }
          }
        }
      } catch (error) {
        console.error('Error in scheduled job:', error);
      }
    });
  }
}