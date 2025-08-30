import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { hashPassword, generateTemporaryPassword } from '../utils/password';
import { User, UserRole, SubjectType } from '../types';
import {
  loadUsers,
  saveUsers,
  loadClasses,
  saveClasses,
  loadEnrollments,
  saveEnrollments,
  loadSubjects
} from '../utils/dataStorage';

// 사용자 승인 대기 목록 조회
export const getPendingUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = loadUsers();
    const pendingUsers = users
      .filter(u => !u.is_approved)
      .map(({ password_hash, ...user }) => user)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ users: pendingUsers });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 사용자 승인/거부
export const approveUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { approve } = req.body;
    
    let users = loadUsers();

    if (approve) {
      users = users.map(u => 
        u.id === parseInt(userId) 
          ? { ...u, is_approved: true, updated_at: new Date().toISOString() }
          : u
      );
      saveUsers(users);
      res.json({ message: '사용자가 승인되었습니다.' });
    } else {
      users = users.filter(u => u.id !== parseInt(userId));
      saveUsers(users);
      res.json({ message: '사용자가 거부되었습니다.' });
    }
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 모든 사용자 조회
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    
    let users = loadUsers();
    
    // 역할별 필터링
    if (role && typeof role === 'string') {
      users = users.filter(u => u.role === role);
    }
    
    // 비밀번호 제거
    const usersWithoutPassword = users.map(({ password_hash, ...user }) => user);
    
    // 페이지네이션
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedUsers = usersWithoutPassword.slice(startIndex, endIndex);
    
    res.json({ 
      users: paginatedUsers,
      total: usersWithoutPassword.length,
      page: pageNum,
      limit: limitNum
    });
    return;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT id, username, email, name, phone, role, is_approved, created_at, updated_at 
      FROM users 
      WHERE 1=1
    `;
    let queryParams: any[] = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      queryParams.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(Number(limit), offset);

    const result = await pool.query(query, queryParams);

    // 총 사용자 수 조회
    let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    let countParams: any[] = [];
    if (role) {
      countQuery += ' AND role = $1';
      countParams.push(role);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalUsers = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 사용자 생성 (관리자가 직접 생성)
export const createUserValidation = [
  body('username').isLength({ min: 3, max: 50 }).withMessage('사용자명은 3-50자여야 합니다.'),
  body('email').isEmail().withMessage('유효한 이메일을 입력하세요.'),
  body('name').isLength({ min: 2, max: 50 }).withMessage('이름은 2-50자여야 합니다.'),
  body('role').isIn(['teacher', 'student', 'parent']).withMessage('유효한 역할을 선택하세요.')
];

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, name, phone, role } = req.body;

    // 중복 체크
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: '이미 존재하는 사용자명 또는 이메일입니다.' });
    }

    // 임시 비밀번호 생성
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, name, phone, role, is_approved) 
       VALUES ($1, $2, $3, $4, $5, $6, TRUE) 
       RETURNING id, username, email, name, phone, role, is_approved, created_at`,
      [username, email, passwordHash, name, phone, role]
    );

    const user = result.rows[0];

    res.status(201).json({
      message: '사용자가 생성되었습니다.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        is_approved: user.is_approved
      },
      temporaryPassword: tempPassword
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, role, classIds } = req.body;
  
  try {
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === parseInt(id));

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[userIndex];
    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.phone = phone ?? user.phone;
    user.role = role ?? user.role;
    user.updated_at = new Date().toISOString();
    
    saveUsers(users);

    // Update class enrollments if student
    if (user.role === 'student' && classIds) {
        const enrollments = loadEnrollments();
        // Remove existing enrollments
        const updatedEnrollments = enrollments.filter(e => e.student_id !== user.id);
        // Add new enrollments
        classIds.forEach((class_id: number) => {
            updatedEnrollments.push({
                id: generateId(),
                student_id: user.id,
                class_id,
                enrolled_at: new Date().toISOString(),
                status: 'active'
            });
        });
        saveEnrollments(updatedEnrollments);
    }
    
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const users = loadUsers();
    const updatedUsers = users.filter(u => u.id !== parseInt(id));
    
    if (users.length === updatedUsers.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    saveUsers(updatedUsers);
    
    // Also remove from enrollments
    const enrollments = loadEnrollments();
    const updatedEnrollments = enrollments.filter(e => e.student_id !== parseInt(id));
    saveEnrollments(updatedEnrollments);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const createClass = async (req: AuthRequest, res: Response) => {
  const { name, grade, subject, teacher_ids, max_students, schedule, description } = req.body;
  if (!name || !grade || !subject || !teacher_ids || !Array.isArray(teacher_ids)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const classes = loadClasses();
    const newClass = {
      id: generateId(),
      name,
      grade,
      subject,
      teacherIds: teacher_ids,
      studentIds: [],
      max_students: max_students || 20,
      schedule: schedule || '',
      description: description || '',
      created_at: new Date().toISOString()
    };
    classes.push(newClass);
    saveClasses(classes);
    res.status(201).json({ message: 'Class created successfully', class: newClass });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create class' });
  }
};


export const assignStudentsToClass = async (req: AuthRequest, res: Response) => {
  const { class_id } = req.params;
  const { student_ids } = req.body;

  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    return res.status(400).json({ error: '학생 ID 목록이 필요합니다.' });
  }

  // 트랜잭션 시작
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const studentId of student_ids) {
      await client.query(
        `INSERT INTO class_students (class_id, student_id) 
         VALUES ($1, $2) 
         ON CONFLICT (class_id, student_id) DO NOTHING`,
        [class_id, studentId]
      );
    }

    await client.query('COMMIT');

    res.json({ message: '학생들이 반에 배정되었습니다.' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  console.error('Assign students error:', error);
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
}
};

// 모든 반 목록 조회
export const getAllClasses = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as teacher_name 
       FROM classes c 
       LEFT JOIN users u ON c.teacher_id = u.id 
       ORDER BY c.created_at DESC`
    );

    res.json({ classes: result.rows });
  } catch (error) {
    console.error('Get all classes error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 반 정보 수정
export const updateClass = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { name, subject, teacher_id, description } = req.body;

    const result = await pool.query(
      `UPDATE classes 
       SET name = COALESCE($1, name), 
           subject = COALESCE($2, subject),
           teacher_id = COALESCE($3, teacher_id),
           description = COALESCE($4, description)
       WHERE id = $5 
       RETURNING *`,
      [name, subject, teacher_id, description, classId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '반을 찾을 수 없습니다.' });
    }

    res.json({
      message: '반 정보가 수정되었습니다.',
      class: result.rows[0]
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

export const deleteClass = async (req: AuthRequest, res: Response) => {
  const { class_id } = req.params;
  try {
    const classes = loadClasses();
    const updatedClasses = classes.filter(c => c.id !== parseInt(class_id));
    if (classes.length === updatedClasses.length) {
      return res.status(404).json({ error: 'Class not found' });
    }
    saveClasses(updatedClasses);

    // Remove enrollments for this class
    const enrollments = loadEnrollments();
    const updatedEnrollments = enrollments.filter(e => e.class_id !== parseInt(class_id));
    saveEnrollments(updatedEnrollments);

    res.status(200).json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete class' });
  }
};

export const removeStudentFromClass = async (req: AuthRequest, res: Response) => {
  const { class_id } = req.params;
  const { student_ids } = req.body;
  if (!student_ids || !Array.isArray(student_ids)) {
    return res.status(400).json({ error: 'student_ids array is required' });
  }

  try {
    const enrollments = loadEnrollments();
    const updatedEnrollments = enrollments.filter(e => 
      !(e.class_id === parseInt(class_id) && student_ids.includes(e.student_id))
    );
    saveEnrollments(updatedEnrollments);
    res.status(200).json({ message: 'Students removed from class successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove students' });
  }
};