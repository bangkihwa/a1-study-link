import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { 
  loadUsers, 
  loadClasses, 
  loadEnrollments, 
  loadLectures, 
  loadLectureContents,
  loadSubjects,
  saveEnrollments
} from '../utils/dataStorage';

// 학생이 속한 반 목록 조회
export const getMyClasses = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    
    const classes = loadClasses();
    const enrollments = loadEnrollments();
    const users = loadUsers();
    const subjects = loadSubjects();
    
    // 학생이 등록된 수강 신청 찾기
    const studentEnrollments = enrollments.filter(e => 
      e.student_id === studentId && e.status === 'active'
    );
    
    // 등록된 반 정보 가져오기
    const myClasses = studentEnrollments.map(enrollment => {
      const classInfo = classes.find(c => c.id === enrollment.class_id);
      if (!classInfo) return null;
      
      const teacher = users.find(u => u.id === classInfo.teacher_id);
      const subject = subjects.find(s => s.id === classInfo.subject_id);
      
      return {
        ...classInfo,
        teacher_name: teacher?.name || '미정',
        subject_name: subject?.name || '미정',
        enrolled_at: enrollment.enrolled_at
      };
    }).filter(Boolean);

    res.json({ classes: myClasses });
  } catch (error) {
    console.error('Get student classes error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 특정 반의 강의 목록 조회 (학생용)
export const getClassLectures = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const studentId = req.user!.userId;
    
    const enrollments = loadEnrollments();
    const lectures = loadLectures();

    // 학생이 해당 반에 속해있는지 확인
    const isEnrolled = enrollments.some(e => 
      e.class_id === parseInt(classId) && 
      e.student_id === studentId && 
      e.status === 'active'
    );

    if (!isEnrolled) {
      return res.status(403).json({ error: '해당 반에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `SELECT l.*,
              slp.is_completed,
              slp.completion_date,
              slp.study_time_minutes
       FROM lectures l
       LEFT JOIN student_lecture_progress slp ON l.id = slp.lecture_id AND slp.student_id = $1
       WHERE l.class_id = $2 AND l.is_published = TRUE
       ORDER BY l.order_index, l.created_at`,
      [studentId, classId]
    );

    res.json({ lectures: result.rows });
  } catch (error) {
    console.error('Get class lectures error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 강의 상세 조회 (콘텐츠 포함)
export const getLectureDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { lectureId } = req.params;
    const studentId = req.user!.userId;

    // 학생 권한 확인
    const accessCheck = await pool.query(
      `SELECT l.id 
       FROM lectures l
       JOIN classes c ON l.class_id = c.id
       JOIN class_students cs ON c.id = cs.class_id
       WHERE l.id = $1 AND cs.student_id = $2 AND l.is_published = TRUE`,
      [lectureId, studentId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 강의에 대한 권한이 없습니다.' });
    }

    // 강의 정보 조회
    const lectureResult = await pool.query(
      `SELECT l.*,
              slp.is_completed,
              slp.completion_date,
              slp.study_time_minutes
       FROM lectures l
       LEFT JOIN student_lecture_progress slp ON l.id = slp.lecture_id AND slp.student_id = $1
       WHERE l.id = $2`,
      [studentId, lectureId]
    );

    // 강의 콘텐츠 조회
    const contentResult = await pool.query(
      `SELECT lc.*,
              scp.is_completed,
              scp.score,
              scp.attempts,
              scp.completion_date
       FROM lecture_contents lc
       LEFT JOIN student_content_progress scp ON lc.id = scp.content_id AND scp.student_id = $1
       WHERE lc.lecture_id = $2
       ORDER BY lc.order_index`,
      [studentId, lectureId]
    );

    const lecture = lectureResult.rows[0];
    const contents = contentResult.rows;

    res.json({ lecture, contents });
  } catch (error) {
    console.error('Get lecture detail error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 강의 수행 완료 표시
export const completeLecture = async (req: AuthRequest, res: Response) => {
  try {
    const { lectureId } = req.params;
    const { study_time_minutes = 0 } = req.body;
    const studentId = req.user!.userId;

    // 학생 권한 확인
    const accessCheck = await pool.query(
      `SELECT l.id 
       FROM lectures l
       JOIN classes c ON l.class_id = c.id
       JOIN class_students cs ON c.id = cs.class_id
       WHERE l.id = $1 AND cs.student_id = $2 AND l.is_published = TRUE`,
      [lectureId, studentId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 강의에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `INSERT INTO student_lecture_progress (student_id, lecture_id, is_completed, completion_date, study_time_minutes)
       VALUES ($1, $2, TRUE, CURRENT_TIMESTAMP, $3)
       ON CONFLICT (student_id, lecture_id)
       DO UPDATE SET is_completed = TRUE, 
                    completion_date = CURRENT_TIMESTAMP,
                    study_time_minutes = student_lecture_progress.study_time_minutes + EXCLUDED.study_time_minutes,
                    updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [studentId, lectureId, study_time_minutes]
    );

    res.json({
      message: '강의 수행이 완료되었습니다.',
      progress: result.rows[0]
    });
  } catch (error) {
    console.error('Complete lecture error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 콘텐츠 수행 완료 표시 (테스트 점수 포함)
export const completeContent = async (req: AuthRequest, res: Response) => {
  try {
    const { contentId } = req.params;
    const { score } = req.body;
    const studentId = req.user!.userId;

    // 학생 권한 확인
    const accessCheck = await pool.query(
      `SELECT lc.id 
       FROM lecture_contents lc
       JOIN lectures l ON lc.lecture_id = l.id
       JOIN classes c ON l.class_id = c.id
       JOIN class_students cs ON c.id = cs.class_id
       WHERE lc.id = $1 AND cs.student_id = $2 AND l.is_published = TRUE`,
      [contentId, studentId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 콘텐츠에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `INSERT INTO student_content_progress (student_id, content_id, is_completed, score, attempts, completion_date)
       VALUES ($1, $2, TRUE, $3, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (student_id, content_id)
       DO UPDATE SET is_completed = TRUE,
                    score = GREATEST(student_content_progress.score, EXCLUDED.score),
                    attempts = student_content_progress.attempts + 1,
                    completion_date = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [studentId, contentId, score]
    );

    res.json({
      message: '콘텐츠 수행이 완료되었습니다.',
      progress: result.rows[0]
    });
  } catch (error) {
    console.error('Complete content error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 질문하기
export const askQuestionValidation = [
  body('lecture_id').isInt().withMessage('유효한 강의 ID를 입력하세요.'),
  body('question').isLength({ min: 5, max: 1000 }).withMessage('질문은 5-1000자여야 합니다.'),
  body('difficulty_level').isInt({ min: 1, max: 5 }).withMessage('난이도는 1-5 사이여야 합니다.')
];

export const askQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lecture_id, content_id, question, difficulty_level, timestamp_in_content } = req.body;
    const studentId = req.user!.userId;

    // 학생 권한 확인
    const accessCheck = await pool.query(
      `SELECT l.id 
       FROM lectures l
       JOIN classes c ON l.class_id = c.id
       JOIN class_students cs ON c.id = cs.class_id
       WHERE l.id = $1 AND cs.student_id = $2`,
      [lecture_id, studentId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 강의에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `INSERT INTO student_questions (student_id, lecture_id, content_id, question, difficulty_level, timestamp_in_content)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [studentId, lecture_id, content_id, question, difficulty_level, timestamp_in_content]
    );

    res.status(201).json({
      message: '질문이 등록되었습니다.',
      question: result.rows[0]
    });
  } catch (error) {
    console.error('Ask question error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 내 질문 목록 조회
export const getMyQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { is_resolved } = req.query;

    let query = `
      SELECT sq.*, l.title as lecture_title,
             lc.title as content_title,
             tf.feedback_text, tf.created_at as feedback_date,
             u.name as teacher_name
      FROM student_questions sq
      JOIN lectures l ON sq.lecture_id = l.id
      LEFT JOIN lecture_contents lc ON sq.content_id = lc.id
      LEFT JOIN teacher_feedback tf ON sq.id = tf.question_id
      LEFT JOIN users u ON tf.teacher_id = u.id
      WHERE sq.student_id = $1
    `;
    let params: any[] = [studentId];

    if (is_resolved !== undefined) {
      query += ' AND sq.is_resolved = $2';
      params.push(is_resolved === 'true' ? true : false);
    }

    query += ' ORDER BY sq.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ questions: result.rows });
  } catch (error) {
    console.error('Get my questions error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 내 과제 목록 조회
export const getMyAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;

    const result = await pool.query(
      `SELECT a.*, c.name as class_name,
              sa.submitted_at, sa.score, sa.teacher_comment, sa.is_graded,
              CASE WHEN sa.id IS NOT NULL THEN TRUE ELSE FALSE END as is_submitted
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       JOIN class_students cs ON c.id = cs.class_id
       LEFT JOIN student_assignments sa ON a.id = sa.assignment_id AND sa.student_id = $1
       WHERE cs.student_id = $1 AND a.is_published = TRUE
       ORDER BY a.due_date DESC NULLS LAST`,
      [studentId]
    );

    res.json({ assignments: result.rows });
  } catch (error) {
    console.error('Get my assignments error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 과제 제출
export const submitAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { submission_text, file_url } = req.body;
    const studentId = req.user!.userId;

    // 학생 권한 확인
    const accessCheck = await pool.query(
      `SELECT a.id 
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       JOIN class_students cs ON c.id = cs.class_id
       WHERE a.id = $1 AND cs.student_id = $2`,
      [assignmentId, studentId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 과제에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `INSERT INTO student_assignments (assignment_id, student_id, submission_text, file_url, submitted_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (assignment_id, student_id)
       DO UPDATE SET submission_text = EXCLUDED.submission_text,
                    file_url = EXCLUDED.file_url,
                    submitted_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [assignmentId, studentId, submission_text, file_url]
    );

    res.json({
      message: '과제가 제출되었습니다.',
      submission: result.rows[0]
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 내 학습 현황 대시보드
export const getMyDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;

    // 간단한 더미 데이터 반환
    const stats = {
      lectures: {
        total_lectures: 10,
        completed_lectures: 7
      },
      questions: {
        pending_questions: 2
      },
      assignments: {
        total_assignments: 5,
        submitted_assignments: 4,
        graded_assignments: 3
      }
    };

    const recentActivity = [
      { type: 'lecture', title: '중등3 물리 - 힘과 운동', date: new Date().toISOString() },
      { type: 'question', title: '속도와 가속도의 차이점은?', date: new Date(Date.now() - 3600000).toISOString() },
      { type: 'assignment', title: '물리 문제집 1-10번', date: new Date(Date.now() - 7200000).toISOString() }
    ];

    res.json({
      stats,
      recentActivity
    });
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};