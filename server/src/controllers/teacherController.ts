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
  saveClasses,
  saveLectures,
  saveLectureContents
} from '../utils/dataStorage';

// 교사가 담당하는 반 목록 조회
export const getMyClasses = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user!.userId;
    
    const classes = loadClasses();
    const enrollments = loadEnrollments();
    const subjects = loadSubjects();
    
    // 교사가 담당하는 반 찾기
    const teacherClasses = classes.filter(c => c.teacher_id === teacherId);
    
    // 각 반의 학생 수 계산
    const classesWithCount = teacherClasses.map(classInfo => {
      const studentCount = enrollments.filter(
        e => e.class_id === classInfo.id && e.status === 'active'
      ).length;
      
      const subject = subjects.find(s => s.id === classInfo.subject_id);
      
      return {
        ...classInfo,
        student_count: studentCount,
        subject_name: subject?.name || '미정'
      };
    });

    res.json({ classes: classesWithCount });
  } catch (error) {
    console.error('Get my classes error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 특정 반의 학생 목록 조회
export const getClassStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user!.userId;
    
    const classes = loadClasses();
    const enrollments = loadEnrollments();
    const users = loadUsers();

    // 교사 권한 확인
    const classInfo = classes.find(
      c => c.id === parseInt(classId) && c.teacher_id === teacherId
    );

    if (!classInfo) {
      return res.status(403).json({ error: '해당 반에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `SELECT u.id, u.username, u.name, u.email, u.phone,
              cs.enrolled_at
       FROM users u
       JOIN class_students cs ON u.id = cs.student_id
       WHERE cs.class_id = $1 AND u.role = 'student'
       ORDER BY u.name`,
      [classId]
    );

    res.json({ students: result.rows });
  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 강의 생성
export const createLectureValidation = [
  body('title').isLength({ min: 2, max: 200 }).withMessage('강의 제목은 2-200자여야 합니다.'),
  body('class_id').isInt().withMessage('유효한 반 ID를 입력하세요.')
];

export const createLecture = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, class_id, order_index = 0 } = req.body;
    const teacherId = req.user!.userId;

    // 교사 권한 확인
    const classCheck = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [class_id, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 반에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `INSERT INTO lectures (title, description, class_id, teacher_id, order_index)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, class_id, teacherId, order_index]
    );

    res.status(201).json({
      message: '강의가 생성되었습니다.',
      lecture: result.rows[0]
    });
  } catch (error) {
    console.error('Create lecture error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 교사의 강의 목록 조회
export const getMyLectures = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user!.userId;
    const { class_id } = req.query;

    let query = `
      SELECT l.*, c.name as class_name, c.subject
      FROM lectures l
      JOIN classes c ON l.class_id = c.id
      WHERE l.teacher_id = $1
    `;
    let params: any[] = [teacherId];

    if (class_id) {
      query += ' AND l.class_id = $2';
      params.push(parseInt(class_id as string));
    }

    query += ' ORDER BY l.order_index, l.created_at';

    const result = await pool.query(query, params);
    res.json({ lectures: result.rows });
  } catch (error) {
    console.error('Get my lectures error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 강의 수정
export const updateLecture = async (req: AuthRequest, res: Response) => {
  try {
    const { lectureId } = req.params;
    const { title, description, order_index, is_published } = req.body;
    const teacherId = req.user!.userId;

    // 교사 권한 확인
    const lectureCheck = await pool.query(
      'SELECT id FROM lectures WHERE id = $1 AND teacher_id = $2',
      [lectureId, teacherId]
    );

    if (lectureCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 강의에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `UPDATE lectures 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           order_index = COALESCE($3, order_index),
           is_published = COALESCE($4, is_published),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title, description, order_index, is_published, lectureId]
    );

    res.json({
      message: '강의가 수정되었습니다.',
      lecture: result.rows[0]
    });
  } catch (error) {
    console.error('Update lecture error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 강의 콘텐츠 추가
export const addLectureContent = async (req: AuthRequest, res: Response) => {
  try {
    const { lectureId } = req.params;
    const { type, title, content_url, content_data, order_index = 0 } = req.body;
    const teacherId = req.user!.userId;

    // 교사 권한 확인
    const lectureCheck = await pool.query(
      'SELECT id FROM lectures WHERE id = $1 AND teacher_id = $2',
      [lectureId, teacherId]
    );

    if (lectureCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 강의에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `INSERT INTO lecture_contents (lecture_id, type, title, content_url, content_data, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [lectureId, type, title, content_url, content_data, order_index]
    );

    res.status(201).json({
      message: '콘텐츠가 추가되었습니다.',
      content: result.rows[0]
    });
  } catch (error) {
    console.error('Add lecture content error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 학생 질문 목록 조회
export const getStudentQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user!.userId;
    const { class_id, is_resolved } = req.query;

    let query = `
      SELECT sq.*, u.name as student_name, l.title as lecture_title,
             lc.title as content_title
      FROM student_questions sq
      JOIN users u ON sq.student_id = u.id
      JOIN lectures l ON sq.lecture_id = l.id
      LEFT JOIN lecture_contents lc ON sq.content_id = lc.id
      WHERE l.teacher_id = $1
    `;
    let params: any[] = [teacherId];
    let paramCount = 1;

    if (class_id) {
      paramCount++;
      query += ` AND l.class_id = $${paramCount}`;
      params.push(parseInt(class_id as string));
    }

    if (is_resolved !== undefined) {
      paramCount++;
      query += ` AND sq.is_resolved = $${paramCount}`;
      params.push(is_resolved === 'true' ? true : false);
    }

    query += ' ORDER BY sq.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ questions: result.rows });
  } catch (error) {
    console.error('Get student questions error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 학생 질문에 피드백 제공
export const provideFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { questionId } = req.params;
    const { feedback_text } = req.body;
    const teacherId = req.user!.userId;

    if (!feedback_text) {
      return res.status(400).json({ error: '피드백 내용을 입력하세요.' });
    }

    // 질문 권한 확인
    const questionCheck = await pool.query(
      `SELECT sq.id, sq.student_id 
       FROM student_questions sq
       JOIN lectures l ON sq.lecture_id = l.id
       WHERE sq.id = $1 AND l.teacher_id = $2`,
      [questionId, teacherId]
    );

    if (questionCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 질문에 대한 권한이 없습니다.' });
    }

    const studentId = questionCheck.rows[0].student_id;

    // 트랜잭션 시작
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 피드백 추가
      const feedbackResult = await client.query(
        `INSERT INTO teacher_feedback (teacher_id, student_id, question_id, feedback_text)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [teacherId, studentId, questionId, feedback_text]
      );

      // 질문을 해결됨으로 표시
      await client.query(
        'UPDATE student_questions SET is_resolved = TRUE WHERE id = $1',
        [questionId]
      );

      await client.query('COMMIT');

      res.json({
        message: '피드백이 제공되었습니다.',
        feedback: feedbackResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Provide feedback error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 과제 생성
export const createAssignmentValidation = [
  body('title').isLength({ min: 2, max: 200 }).withMessage('과제 제목은 2-200자여야 합니다.'),
  body('class_id').isInt().withMessage('유효한 반 ID를 입력하세요.')
];

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, class_id, due_date } = req.body;
    const teacherId = req.user!.userId;

    // 교사 권한 확인
    const classCheck = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [class_id, teacherId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 반에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `INSERT INTO assignments (title, description, class_id, teacher_id, due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, class_id, teacherId, due_date]
    );

    res.status(201).json({
      message: '과제가 생성되었습니다.',
      assignment: result.rows[0]
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 과제 제출 현황 조회
export const getAssignmentSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user!.userId;

    // 교사 권한 확인
    const assignmentCheck = await pool.query(
      'SELECT id FROM assignments WHERE id = $1 AND teacher_id = $2',
      [assignmentId, teacherId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 과제에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `SELECT sa.*, u.name as student_name, u.username as student_username
       FROM student_assignments sa
       JOIN users u ON sa.student_id = u.id
       WHERE sa.assignment_id = $1
       ORDER BY sa.submitted_at DESC NULLS LAST`,
      [assignmentId]
    );

    res.json({ submissions: result.rows });
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 과제 채점
export const gradeAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { score, teacher_comment } = req.body;
    const teacherId = req.user!.userId;

    // 교사 권한 확인
    const submissionCheck = await pool.query(
      `SELECT sa.id 
       FROM student_assignments sa
       JOIN assignments a ON sa.assignment_id = a.id
       WHERE sa.id = $1 AND a.teacher_id = $2`,
      [submissionId, teacherId]
    );

    if (submissionCheck.rows.length === 0) {
      return res.status(403).json({ error: '해당 과제에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      `UPDATE student_assignments 
       SET score = $1, teacher_comment = $2, is_graded = TRUE
       WHERE id = $3
       RETURNING *`,
      [score, teacher_comment, submissionId]
    );

    res.json({
      message: '과제가 채점되었습니다.',
      submission: result.rows[0]
    });
  } catch (error) {
    console.error('Grade assignment error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};