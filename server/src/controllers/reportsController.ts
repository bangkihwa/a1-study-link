import { Request, Response } from 'express';
import pool from '../database/connection';
import { AuthRequest } from '../middleware/auth';

// 학생의 상세 학습 리포트 생성
export const generateStudentReport = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // 권한 체크 (본인, 학부모, 교사, 관리자만 조회 가능)
    if (userRole === 'student' && userId !== parseInt(studentId)) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    
    if (userRole === 'parent') {
      const parentCheck = await pool.query(
        'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
        [userId, studentId]
      );
      if (parentCheck.rows.length === 0) {
        return res.status(403).json({ error: '해당 학생에 대한 권한이 없습니다.' });
      }
    }

    let dateFilter = '';
    let params = [studentId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      dateFilter += ` AND DATE(created_at) >= $${paramCount}`;
      params.push(startDate as string);
    }

    if (endDate) {
      paramCount++;
      dateFilter += ` AND DATE(created_at) <= $${paramCount}`;
      params.push(endDate as string);
    }

    // 기본 정보
    const studentInfo = await pool.query(
      'SELECT id, name, email, username FROM users WHERE id = $1',
      [studentId]
    );

    // 강의 진행 현황
    const lectureStats = await pool.query(
      `SELECT 
         COUNT(l.id) as total_lectures,
         COUNT(CASE WHEN slp.is_completed = TRUE THEN 1 END) as completed_lectures,
         ROUND(AVG(CASE WHEN slp.is_completed = TRUE THEN slp.study_time_minutes END), 2) as avg_study_time,
         SUM(CASE WHEN slp.is_completed = TRUE THEN slp.study_time_minutes END) as total_study_time
       FROM lectures l
       JOIN classes c ON l.class_id = c.id
       JOIN class_students cs ON c.id = cs.class_id
       LEFT JOIN student_lecture_progress slp ON l.id = slp.lecture_id AND slp.student_id = $1
       WHERE cs.student_id = $1 AND l.is_published = TRUE`,
      [studentId]
    );

    // 과목별 진행 현황
    const subjectProgress = await pool.query(
      `SELECT 
         c.subject,
         COUNT(l.id) as total_lectures,
         COUNT(CASE WHEN slp.is_completed = TRUE THEN 1 END) as completed_lectures,
         ROUND(
           CASE WHEN COUNT(l.id) > 0 
           THEN (COUNT(CASE WHEN slp.is_completed = TRUE THEN 1 END)::numeric / COUNT(l.id)::numeric) * 100 
           ELSE 0 END, 2
         ) as completion_rate
       FROM classes c
       JOIN class_students cs ON c.id = cs.class_id
       LEFT JOIN lectures l ON c.id = l.class_id AND l.is_published = TRUE
       LEFT JOIN student_lecture_progress slp ON l.id = slp.lecture_id AND slp.student_id = $1
       WHERE cs.student_id = $1
       GROUP BY c.subject
       ORDER BY completion_rate DESC`,
      [studentId]
    );

    // 질문 및 피드백 현황
    const questionStats = await pool.query(
      `SELECT 
         COUNT(*) as total_questions,
         COUNT(CASE WHEN is_resolved = TRUE THEN 1 END) as resolved_questions,
         ROUND(AVG(difficulty_level), 2) as avg_difficulty
       FROM student_questions 
       WHERE student_id = $1 ${dateFilter}`,
      params
    );

    // 과제 현황
    const assignmentStats = await pool.query(
      `SELECT 
         COUNT(a.id) as total_assignments,
         COUNT(CASE WHEN sa.id IS NOT NULL THEN 1 END) as submitted_assignments,
         COUNT(CASE WHEN sa.is_graded = TRUE THEN 1 END) as graded_assignments,
         ROUND(AVG(CASE WHEN sa.is_graded = TRUE THEN sa.score END), 2) as avg_score,
         COUNT(CASE WHEN a.due_date < CURRENT_TIMESTAMP AND sa.id IS NULL THEN 1 END) as overdue_assignments
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       JOIN class_students cs ON c.id = cs.class_id
       LEFT JOIN student_assignments sa ON a.id = sa.assignment_id AND sa.student_id = $1
       WHERE cs.student_id = $1 AND a.is_published = TRUE`,
      [studentId]
    );

    // 성적 현황
    const gradeStats = await pool.query(
      `SELECT 
         c.subject,
         COUNT(g.id) as test_count,
         ROUND(AVG(g.score), 2) as avg_score,
         MAX(g.score) as max_score,
         MIN(g.score) as min_score
       FROM grades g
       JOIN classes c ON g.class_id = c.id
       WHERE g.student_id = $1 ${dateFilter.replace('created_at', 'test_date')}
       GROUP BY c.subject
       ORDER BY avg_score DESC`,
      params
    );

    // 학습 분석 데이터 (성실도, 집중도)
    const analyticsStats = await pool.query(
      `SELECT 
         ROUND(AVG(focus_score), 2) as avg_focus_score,
         ROUND(AVG(engagement_score), 2) as avg_engagement_score,
         ROUND(AVG(study_duration_minutes), 2) as avg_study_duration,
         COUNT(*) as total_sessions
       FROM learning_analytics 
       WHERE student_id = $1 ${dateFilter.replace('created_at', 'session_date')}`,
      params
    );

    // 월별 학습 활동
    const monthlyActivity = await pool.query(
      `SELECT 
         DATE_TRUNC('month', slp.completion_date) as month,
         COUNT(*) as lectures_completed
       FROM student_lecture_progress slp
       WHERE slp.student_id = $1 
         AND slp.is_completed = TRUE 
         AND slp.completion_date IS NOT NULL
         ${dateFilter.replace('created_at', 'completion_date')}
       GROUP BY DATE_TRUNC('month', slp.completion_date)
       ORDER BY month`,
      params
    );

    // 최근 활동 내역
    const recentActivity = await pool.query(
      `(SELECT 'lecture_completed' as type, l.title as title, slp.completion_date as date
        FROM student_lecture_progress slp
        JOIN lectures l ON slp.lecture_id = l.id
        WHERE slp.student_id = $1 AND slp.completion_date IS NOT NULL ${dateFilter.replace('created_at', 'slp.completion_date')}
        ORDER BY slp.completion_date DESC LIMIT 10)
       UNION ALL
       (SELECT 'question_asked' as type, 
               CASE WHEN LENGTH(sq.question) > 50 
                    THEN LEFT(sq.question, 47) || '...'
                    ELSE sq.question
               END as title, 
               sq.created_at as date
        FROM student_questions sq
        WHERE sq.student_id = $1 ${dateFilter.replace('created_at', 'sq.created_at')}
        ORDER BY sq.created_at DESC LIMIT 10)
       UNION ALL
       (SELECT 'assignment_submitted' as type, a.title as title, sa.submitted_at as date
        FROM student_assignments sa
        JOIN assignments a ON sa.assignment_id = a.id
        WHERE sa.student_id = $1 AND sa.submitted_at IS NOT NULL ${dateFilter.replace('created_at', 'sa.submitted_at')}
        ORDER BY sa.submitted_at DESC LIMIT 10)
       ORDER BY date DESC LIMIT 20`,
      params
    );

    // 종합 성취도 계산
    const lectureCompletionRate = lectureStats.rows[0].total_lectures > 0 ? 
      Math.round((lectureStats.rows[0].completed_lectures / lectureStats.rows[0].total_lectures) * 100) : 0;
    
    const assignmentCompletionRate = assignmentStats.rows[0].total_assignments > 0 ?
      Math.round((assignmentStats.rows[0].submitted_assignments / assignmentStats.rows[0].total_assignments) * 100) : 0;

    const overallPerformance = Math.round((lectureCompletionRate + assignmentCompletionRate) / 2);

    const report = {
      studentInfo: studentInfo.rows[0],
      reportPeriod: {
        startDate: startDate || null,
        endDate: endDate || null,
        generatedAt: new Date().toISOString()
      },
      summary: {
        overallPerformance,
        lectureCompletionRate,
        assignmentCompletionRate,
        totalStudyTime: lectureStats.rows[0].total_study_time || 0,
        avgFocusScore: analyticsStats.rows[0].avg_focus_score || 0,
        avgEngagementScore: analyticsStats.rows[0].avg_engagement_score || 0
      },
      lectureStats: lectureStats.rows[0],
      subjectProgress: subjectProgress.rows,
      questionStats: questionStats.rows[0],
      assignmentStats: assignmentStats.rows[0],
      gradeStats: gradeStats.rows,
      analyticsStats: analyticsStats.rows[0],
      monthlyActivity: monthlyActivity.rows,
      recentActivity: recentActivity.rows
    };

    res.json({ report });
  } catch (error) {
    console.error('Generate student report error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 교사용 반별 리포트
export const generateClassReport = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user!.userId;

    // 교사 권한 확인
    const classCheck = await pool.query(
      'SELECT id, name, subject FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 반에 대한 권한이 없습니다.' });
    }

    const classInfo = classCheck.rows[0];

    // 반 학생 목록
    const students = await pool.query(
      `SELECT u.id, u.name, u.username
       FROM users u
       JOIN class_students cs ON u.id = cs.student_id
       WHERE cs.class_id = $1
       ORDER BY u.name`,
      [classId]
    );

    // 학생별 진행 현황
    const studentProgress = await pool.query(
      `SELECT 
         u.id as student_id,
         u.name as student_name,
         COUNT(l.id) as total_lectures,
         COUNT(CASE WHEN slp.is_completed = TRUE THEN 1 END) as completed_lectures,
         ROUND(
           CASE WHEN COUNT(l.id) > 0 
           THEN (COUNT(CASE WHEN slp.is_completed = TRUE THEN 1 END)::numeric / COUNT(l.id)::numeric) * 100 
           ELSE 0 END, 2
         ) as completion_rate,
         COUNT(sq.id) as question_count,
         COUNT(CASE WHEN sq.is_resolved = FALSE THEN 1 END) as pending_questions
       FROM users u
       JOIN class_students cs ON u.id = cs.student_id
       LEFT JOIN lectures l ON cs.class_id = l.class_id AND l.is_published = TRUE
       LEFT JOIN student_lecture_progress slp ON l.id = slp.lecture_id AND slp.student_id = u.id
       LEFT JOIN student_questions sq ON l.id = sq.lecture_id AND sq.student_id = u.id
       WHERE cs.class_id = $1
       GROUP BY u.id, u.name
       ORDER BY completion_rate DESC, u.name`,
      [classId]
    );

    // 강의별 수강 현황
    const lectureProgress = await pool.query(
      `SELECT 
         l.id,
         l.title,
         l.order_index,
         COUNT(cs.student_id) as total_students,
         COUNT(slp.student_id) as completed_students,
         ROUND(
           CASE WHEN COUNT(cs.student_id) > 0 
           THEN (COUNT(slp.student_id)::numeric / COUNT(cs.student_id)::numeric) * 100 
           ELSE 0 END, 2
         ) as completion_rate
       FROM lectures l
       JOIN class_students cs ON l.class_id = cs.class_id
       LEFT JOIN student_lecture_progress slp ON l.id = slp.lecture_id 
         AND slp.student_id = cs.student_id 
         AND slp.is_completed = TRUE
       WHERE l.class_id = $1 AND l.is_published = TRUE
       GROUP BY l.id, l.title, l.order_index
       ORDER BY l.order_index`,
      [classId]
    );

    // 과제 현황
    const assignmentProgress = await pool.query(
      `SELECT 
         a.id,
         a.title,
         a.due_date,
         COUNT(cs.student_id) as total_students,
         COUNT(sa.student_id) as submitted_count,
         COUNT(CASE WHEN sa.is_graded = TRUE THEN 1 END) as graded_count,
         ROUND(AVG(CASE WHEN sa.is_graded = TRUE THEN sa.score END), 2) as avg_score
       FROM assignments a
       JOIN class_students cs ON a.class_id = cs.class_id
       LEFT JOIN student_assignments sa ON a.id = sa.assignment_id 
         AND sa.student_id = cs.student_id
       WHERE a.class_id = $1 AND a.is_published = TRUE
       GROUP BY a.id, a.title, a.due_date
       ORDER BY a.due_date DESC NULLS LAST`,
      [classId]
    );

    // 미해결 질문 목록
    const pendingQuestions = await pool.query(
      `SELECT 
         sq.id,
         sq.question,
         sq.difficulty_level,
         sq.created_at,
         u.name as student_name,
         l.title as lecture_title
       FROM student_questions sq
       JOIN users u ON sq.student_id = u.id
       JOIN lectures l ON sq.lecture_id = l.id
       WHERE l.class_id = $1 AND sq.is_resolved = FALSE
       ORDER BY sq.created_at DESC`,
      [classId]
    );

    const report = {
      classInfo,
      summary: {
        totalStudents: students.rows.length,
        totalLectures: lectureProgress.rows.length,
        totalAssignments: assignmentProgress.rows.length,
        pendingQuestionsCount: pendingQuestions.rows.length,
        avgClassProgress: Math.round(
          studentProgress.rows.reduce((sum, student) => sum + parseFloat(student.completion_rate), 0) / 
          Math.max(studentProgress.rows.length, 1)
        )
      },
      students: students.rows,
      studentProgress: studentProgress.rows,
      lectureProgress: lectureProgress.rows,
      assignmentProgress: assignmentProgress.rows,
      pendingQuestions: pendingQuestions.rows,
      generatedAt: new Date().toISOString()
    };

    res.json({ report });
  } catch (error) {
    console.error('Generate class report error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 관리자용 전체 통계
export const getAdminStatistics = async (req: AuthRequest, res: Response) => {
  try {
    // 사용자 통계
    const userStats = await pool.query(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      WHERE is_approved = TRUE
      GROUP BY role
    `);

    // 반 통계
    const classStats = await pool.query(`
      SELECT 
        subject,
        COUNT(*) as class_count,
        COUNT(DISTINCT teacher_id) as teacher_count
      FROM classes
      GROUP BY subject
    `);

    // 강의 통계
    const lectureStats = await pool.query(`
      SELECT 
        COUNT(*) as total_lectures,
        COUNT(CASE WHEN is_published = TRUE THEN 1 END) as published_lectures
      FROM lectures
    `);

    // 활동 통계 (최근 30일)
    const activityStats = await pool.query(`
      SELECT 
        COUNT(slp.id) as lectures_completed,
        COUNT(sq.id) as questions_asked,
        COUNT(sa.id) as assignments_submitted
      FROM student_lecture_progress slp
      FULL OUTER JOIN student_questions sq ON DATE(slp.completion_date) = DATE(sq.created_at)
      FULL OUTER JOIN student_assignments sa ON DATE(slp.completion_date) = DATE(sa.submitted_at)
      WHERE slp.completion_date >= CURRENT_DATE - INTERVAL '30 days'
         OR sq.created_at >= CURRENT_DATE - INTERVAL '30 days'
         OR sa.submitted_at >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // 일별 활동 (최근 30일)
    const dailyActivity = await pool.query(`
      SELECT 
        DATE(activity_date) as date,
        COUNT(*) as activity_count
      FROM (
        SELECT completion_date as activity_date FROM student_lecture_progress 
        WHERE completion_date >= CURRENT_DATE - INTERVAL '30 days'
        UNION ALL
        SELECT created_at FROM student_questions 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        UNION ALL
        SELECT submitted_at FROM student_assignments 
        WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'
      ) activities
      GROUP BY DATE(activity_date)
      ORDER BY date
    `);

    const statistics = {
      userStats: userStats.rows,
      classStats: classStats.rows,
      lectureStats: lectureStats.rows[0],
      activityStats: activityStats.rows[0],
      dailyActivity: dailyActivity.rows,
      generatedAt: new Date().toISOString()
    };

    res.json({ statistics });
  } catch (error) {
    console.error('Get admin statistics error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};