import { Request, Response } from 'express';
import pool from '../database/connection';
import { AuthRequest } from '../middleware/auth';

// 자녀 목록 조회
export const getMyChildren = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user!.userId;

    const result = await pool.query(
      `SELECT u.id, u.username, u.name, u.email, u.phone,
              ps.relationship, ps.parent_id
       FROM users u
       JOIN parent_students ps ON u.id = ps.student_id
       WHERE ps.parent_id = $1
       ORDER BY u.name`,
      [parentId]
    );

    res.json({ children: result.rows });
  } catch (error) {
    console.error('Get my children error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 특정 자녀의 학습 현황 대시보드
export const getChildDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const { childId } = req.params;
    const parentId = req.user!.userId;

    // 학부모-자녀 관계 확인
    const relationshipCheck = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
      [parentId, childId]
    );

    if (relationshipCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 학생에 대한 권한이 없습니다.' });
    }

    // 전체 강의 수 및 완료한 강의 수
    const lectureStats = await pool.query(
      `SELECT 
         COUNT(l.id) as total_lectures,
         COUNT(CASE WHEN slp.is_completed = TRUE THEN 1 END) as completed_lectures,
         ROUND(AVG(CASE WHEN slp.is_completed = TRUE THEN slp.study_time_minutes END), 2) as avg_study_time
       FROM lectures l
       JOIN classes c ON l.class_id = c.id
       JOIN class_students cs ON c.id = cs.class_id
       LEFT JOIN student_lecture_progress slp ON l.id = slp.lecture_id AND slp.student_id = $1
       WHERE cs.student_id = $1 AND l.is_published = TRUE`,
      [childId]
    );

    // 미해결 질문 수
    const questionStats = await pool.query(
      'SELECT COUNT(*) as pending_questions FROM student_questions WHERE student_id = $1 AND is_resolved = FALSE',
      [childId]
    );

    // 과제 제출 현황
    const assignmentStats = await pool.query(
      `SELECT 
         COUNT(a.id) as total_assignments,
         COUNT(CASE WHEN sa.id IS NOT NULL THEN 1 END) as submitted_assignments,
         COUNT(CASE WHEN sa.is_graded = TRUE THEN 1 END) as graded_assignments,
         ROUND(AVG(CASE WHEN sa.is_graded = TRUE THEN sa.score END), 2) as avg_score
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       JOIN class_students cs ON c.id = cs.class_id
       LEFT JOIN student_assignments sa ON a.id = sa.assignment_id AND sa.student_id = $1
       WHERE cs.student_id = $1 AND a.is_published = TRUE`,
      [childId]
    );

    // 최근 활동
    const recentActivity = await pool.query(
      `(SELECT 'lecture_completed' as type, l.title as title, slp.completion_date as date, 'completed' as status
        FROM student_lecture_progress slp
        JOIN lectures l ON slp.lecture_id = l.id
        WHERE slp.student_id = $1 AND slp.completion_date IS NOT NULL
        ORDER BY slp.completion_date DESC LIMIT 5)
       UNION ALL
       (SELECT 'question_asked' as type, 
               CASE WHEN LENGTH(sq.question) > 50 
                    THEN LEFT(sq.question, 47) || '...'
                    ELSE sq.question
               END as title, 
               sq.created_at as date, 
               CASE WHEN sq.is_resolved THEN 'resolved' ELSE 'pending' END as status
        FROM student_questions sq
        WHERE sq.student_id = $1
        ORDER BY sq.created_at DESC LIMIT 5)
       UNION ALL
       (SELECT 'assignment_submitted' as type, a.title as title, sa.submitted_at as date, 
               CASE WHEN sa.is_graded THEN 'graded' ELSE 'submitted' END as status
        FROM student_assignments sa
        JOIN assignments a ON sa.assignment_id = a.id
        WHERE sa.student_id = $1 AND sa.submitted_at IS NOT NULL
        ORDER BY sa.submitted_at DESC LIMIT 5)
       ORDER BY date DESC LIMIT 15`,
      [childId]
    );

    res.json({
      stats: {
        lectures: lectureStats.rows[0],
        questions: questionStats.rows[0],
        assignments: assignmentStats.rows[0]
      },
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    console.error('Get child dashboard error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 자녀의 반 목록 조회
export const getChildClasses = async (req: AuthRequest, res: Response) => {
  try {
    const { childId } = req.params;
    const parentId = req.user!.userId;

    // 학부모-자녀 관계 확인
    const relationshipCheck = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
      [parentId, childId]
    );

    if (relationshipCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 학생에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `SELECT c.*, u.name as teacher_name,
              cs.enrolled_at,
              COUNT(l.id) as total_lectures,
              COUNT(CASE WHEN slp.is_completed = TRUE THEN 1 END) as completed_lectures
       FROM classes c
       JOIN class_students cs ON c.id = cs.class_id
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN lectures l ON c.id = l.class_id AND l.is_published = TRUE
       LEFT JOIN student_lecture_progress slp ON l.id = slp.lecture_id AND slp.student_id = $1
       WHERE cs.student_id = $1
       GROUP BY c.id, u.name, cs.enrolled_at
       ORDER BY c.created_at DESC`,
      [childId]
    );

    res.json({ classes: result.rows });
  } catch (error) {
    console.error('Get child classes error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 자녀의 강의 진행 상황
export const getChildLectureProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { childId } = req.params;
    const { classId } = req.query;
    const parentId = req.user!.userId;

    // 학부모-자녀 관계 확인
    const relationshipCheck = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
      [parentId, childId]
    );

    if (relationshipCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 학생에 대한 권한이 없습니다.' });
    }

    let query = `
      SELECT l.*, c.name as class_name,
             slp.is_completed, slp.completion_date, slp.study_time_minutes,
             slp.replay_count
      FROM lectures l
      JOIN classes c ON l.class_id = c.id
      JOIN class_students cs ON c.id = cs.class_id
      LEFT JOIN student_lecture_progress slp ON l.id = slp.lecture_id AND slp.student_id = $1
      WHERE cs.student_id = $1 AND l.is_published = TRUE
    `;
    let params = [childId];

    if (classId) {
      query += ' AND l.class_id = $2';
      params.push(classId as string);
    }

    query += ' ORDER BY l.order_index, l.created_at';

    const result = await pool.query(query, params);
    res.json({ lectures: result.rows });
  } catch (error) {
    console.error('Get child lecture progress error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 자녀의 질문 및 피드백 내역
export const getChildQuestionsAndFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { childId } = req.params;
    const parentId = req.user!.userId;

    // 학부모-자녀 관계 확인
    const relationshipCheck = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
      [parentId, childId]
    );

    if (relationshipCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 학생에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `SELECT sq.*, l.title as lecture_title,
              lc.title as content_title,
              tf.feedback_text, tf.created_at as feedback_date,
              u.name as teacher_name
       FROM student_questions sq
       JOIN lectures l ON sq.lecture_id = l.id
       LEFT JOIN lecture_contents lc ON sq.content_id = lc.id
       LEFT JOIN teacher_feedback tf ON sq.id = tf.question_id
       LEFT JOIN users u ON tf.teacher_id = u.id
       WHERE sq.student_id = $1
       ORDER BY sq.created_at DESC`,
      [childId]
    );

    res.json({ questions: result.rows });
  } catch (error) {
    console.error('Get child questions and feedback error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 자녀의 과제 현황
export const getChildAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const { childId } = req.params;
    const parentId = req.user!.userId;

    // 학부모-자녀 관계 확인
    const relationshipCheck = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
      [parentId, childId]
    );

    if (relationshipCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 학생에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `SELECT a.*, c.name as class_name,
              sa.submitted_at, sa.score, sa.teacher_comment, sa.is_graded,
              CASE WHEN sa.id IS NOT NULL THEN TRUE ELSE FALSE END as is_submitted,
              CASE 
                WHEN a.due_date < CURRENT_TIMESTAMP AND sa.id IS NULL THEN TRUE 
                ELSE FALSE 
              END as is_overdue
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       JOIN class_students cs ON c.id = cs.class_id
       LEFT JOIN student_assignments sa ON a.id = sa.assignment_id AND sa.student_id = $1
       WHERE cs.student_id = $1 AND a.is_published = TRUE
       ORDER BY a.due_date DESC NULLS LAST`,
      [childId]
    );

    res.json({ assignments: result.rows });
  } catch (error) {
    console.error('Get child assignments error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 자녀의 성적 현황
export const getChildGrades = async (req: AuthRequest, res: Response) => {
  try {
    const { childId } = req.params;
    const parentId = req.user!.userId;

    // 학부모-자녀 관계 확인
    const relationshipCheck = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
      [parentId, childId]
    );

    if (relationshipCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 학생에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `SELECT g.*, c.name as class_name, c.subject
       FROM grades g
       JOIN classes c ON g.class_id = c.id
       WHERE g.student_id = $1
       ORDER BY g.test_date DESC, g.created_at DESC`,
      [childId]
    );

    res.json({ grades: result.rows });
  } catch (error) {
    console.error('Get child grades error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 자녀의 학습 분석 데이터 (성실도, 집중도)
export const getChildLearningAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { childId } = req.params;
    const { startDate, endDate } = req.query;
    const parentId = req.user!.userId;

    // 학부모-자녀 관계 확인
    const relationshipCheck = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
      [parentId, childId]
    );

    if (relationshipCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 학생에 대한 권한이 없습니다.' });
    }

    let query = `
      SELECT la.*, l.title as lecture_title
      FROM learning_analytics la
      JOIN lectures l ON la.lecture_id = l.id
      WHERE la.student_id = $1
    `;
    let params = [childId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND la.session_date >= $${paramCount}`;
      params.push(startDate as string);
    }

    if (endDate) {
      paramCount++;
      query += ` AND la.session_date <= $${paramCount}`;
      params.push(endDate as string);
    }

    query += ' ORDER BY la.session_date DESC';

    const result = await pool.query(query, params);

    // 평균 성실도 및 집중도 계산
    const avgStats = await pool.query(
      `SELECT 
         ROUND(AVG(focus_score), 2) as avg_focus_score,
         ROUND(AVG(engagement_score), 2) as avg_engagement_score,
         ROUND(AVG(study_duration_minutes), 2) as avg_study_duration
       FROM learning_analytics 
       WHERE student_id = $1
       ${startDate ? `AND session_date >= $2` : ''}
       ${endDate ? `AND session_date <= $${startDate ? 3 : 2}` : ''}`,
      params
    );

    res.json({ 
      analytics: result.rows,
      averageStats: avgStats.rows[0]
    });
  } catch (error) {
    console.error('Get child learning analytics error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};