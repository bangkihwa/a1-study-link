import { query } from '../config/database';

export class ReportModel {
  // 학생의 학습 리포트 조회
  static async getStudentReport(studentId: number, startDate: string, endDate: string) {
    // 동영상 시청 기록
    const videoProgress = await query(
      `SELECT 
         COUNT(*) as totalVideos,
         SUM(CASE WHEN is_completed = TRUE THEN 1 ELSE 0 END) as completedVideos,
         AVG(progress_percentage) as averageProgress
       FROM video_progress 
       WHERE student_id = ? AND last_watched_at BETWEEN ? AND ?`,
      [studentId, startDate, endDate]
    ) as any[];

    // 테스트 제출 기록
    const testSubmissions = await query(
      `SELECT 
         COUNT(*) as totalTests,
         SUM(CASE WHEN is_graded = TRUE THEN 1 ELSE 0 END) as gradedTests,
         AVG(score) as averageScore
       FROM test_submissions 
       WHERE student_id = ? AND submitted_at BETWEEN ? AND ?`,
      [studentId, startDate, endDate]
    ) as any[];

    // 질문 기록
    const questions = await query(
      `SELECT 
         COUNT(*) as totalQuestions,
         SUM(CASE WHEN answered_at IS NOT NULL THEN 1 ELSE 0 END) as answeredQuestions
       FROM qna 
       WHERE student_id = ? AND created_at BETWEEN ? AND ?`,
      [studentId, startDate, endDate]
    ) as any[];

    // 로그인 기록
    const loginActivity = await query(
      `SELECT 
         COUNT(*) as totalLogins
       FROM activity_logs 
       WHERE student_id = ? AND activity_type = 'login' AND created_at BETWEEN ? AND ?`,
      [studentId, startDate, endDate]
    ) as any[];

    return {
      videoProgress: videoProgress[0],
      testSubmissions: testSubmissions[0],
      questions: questions[0],
      loginActivity: loginActivity[0]
    };
  }

  // 반별 학습 리포트 조회 (교사용)
  static async getClassReport(classId: number, startDate: string, endDate: string) {
    // 반에 속한 학생 수
    const studentCount = await query(
      'SELECT COUNT(*) as count FROM students WHERE class_id = ?',
      [classId]
    ) as any[];

    // 반별 동영상 시청 통계
    const classVideoStats = await query(
      `SELECT 
         COUNT(DISTINCT vp.student_id) as activeStudents,
         COUNT(*) as totalViews,
         AVG(vp.progress_percentage) as averageProgress
       FROM video_progress vp
       JOIN students s ON vp.student_id = s.user_id
       WHERE s.class_id = ? AND vp.last_watched_at BETWEEN ? AND ?`,
      [classId, startDate, endDate]
    ) as any[];

    // 반별 테스트 통계
    const classTestStats = await query(
      `SELECT 
         COUNT(DISTINCT ts.student_id) as activeStudents,
         COUNT(*) as totalSubmissions,
         AVG(ts.score) as averageScore
       FROM test_submissions ts
       JOIN students s ON ts.student_id = s.user_id
       WHERE s.class_id = ? AND ts.submitted_at BETWEEN ? AND ?`,
      [classId, startDate, endDate]
    ) as any[];

    return {
      studentCount: studentCount[0].count,
      videoStats: classVideoStats[0],
      testStats: classTestStats[0]
    };
  }

  // 전체 학습 활동 로그 조회 (관리자용)
  static async getAdminActivityReport(startDate: string, endDate: string) {
    // 일별 활동 통계
    const dailyActivity = await query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as totalActivities,
         COUNT(DISTINCT student_id) as activeStudents
       FROM activity_logs 
       WHERE created_at BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [startDate, endDate]
    ) as any[];

    // 활동 유형별 통계
    const activityByType = await query(
      `SELECT 
         activity_type as activityType,
         COUNT(*) as count
       FROM activity_logs 
       WHERE created_at BETWEEN ? AND ?
       GROUP BY activity_type
       ORDER BY count DESC`,
      [startDate, endDate]
    ) as any[];

    return {
      dailyActivity,
      activityByType
    };
  }
}
