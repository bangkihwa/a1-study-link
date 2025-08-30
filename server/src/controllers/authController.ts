import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { hashPassword, comparePassword } from '../utils/password';
import { UserRole } from '../types';
import { loadUsers, saveUsers, SimpleUser } from '../utils/dataStorage';

export const registerValidation = [
  body('username').isLength({ min: 3, max: 50 }).withMessage('사용자명은 3-50자여야 합니다.'),
  body('email').isEmail().withMessage('유효한 이메일을 입력하세요.'),
  body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자여야 합니다.'),
  body('name').isLength({ min: 2, max: 50 }).withMessage('이름은 2-50자여야 합니다.'),
  body('role').isIn(['teacher', 'student', 'parent']).withMessage('유효한 역할을 선택하세요.')
];

export const loginValidation = [
  body('username').notEmpty().withMessage('사용자명을 입력하세요.'),
  body('password').notEmpty().withMessage('비밀번호를 입력하세요.')
];

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, name, phone, role } = req.body;
    
    // 최신 사용자 데이터 로드
    const users = loadUsers();

    // 중복 체크 - 더 명확한 에러 메시지
    const existingUsername = users.find(u => u.username === username);
    if (existingUsername) {
      return res.status(400).json({ 
        error: '이미 사용 중인 아이디입니다.',
        field: 'username'
      });
    }
    
    const existingEmail = users.find(u => u.email === email);
    if (existingEmail) {
      return res.status(400).json({ 
        error: '이미 등록된 이메일입니다.',
        field: 'email'
      });
    }

    const passwordHash = await hashPassword(password);

    const newUser: SimpleUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      email,
      password_hash: passwordHash,
      name,
      phone,
      role,
      is_approved: false, // 기본적으로 미승인 상태로 생성
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);

    const { password_hash, ...userResponse } = newUser;

    res.status(201).json({
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.',
      user: userResponse
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    
    // 최신 사용자 데이터 로드
    console.log('Attempting login for user:', username);
    const users = loadUsers();
    console.log(`Loaded ${users.length} users.`);

    const user = users.find(u => u.username === username);
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ error: '잘못된 사용자명 또는 비밀번호입니다.' });
    }
    console.log('User found:', user.username, 'Hashed password from DB:', user.password_hash);

    const isValidPassword = await comparePassword(password, user.password_hash);
    console.log('Password validation result:', isValidPassword);
    if (!isValidPassword) {
      console.log('Password mismatch for user:', username);
      return res.status(401).json({ error: '잘못된 사용자명 또는 비밀번호입니다.' });
    }

    if (!user.is_approved) {
      return res.status(403).json({ error: '계정이 아직 승인되지 않았습니다. 관리자에게 문의하세요.' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const { password_hash, ...userResponse } = user;

    res.json({
      message: '로그인 성공',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
    }

    const users = loadUsers();
    const usersWithoutPasswords = users.map(({ password_hash, ...user }) => user);

    res.json({ users: usersWithoutPasswords });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const users = loadUsers();
    
    const stats = {
      total_users: users.length,
      admin_count: users.filter(u => u.role === 'admin').length,
      teacher_count: users.filter(u => u.role === 'teacher').length,
      student_count: users.filter(u => u.role === 'student').length,
      parent_count: users.filter(u => u.role === 'parent').length,
      approved_count: users.filter(u => u.is_approved === true).length,
      pending_count: users.filter(u => u.is_approved === false).length
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

export const toggleUserApproval = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
    }

    const { userId } = req.params;
    
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    users[userIndex].is_approved = !users[userIndex].is_approved;
    users[userIndex].updated_at = new Date().toISOString();
    saveUsers(users);

    res.json({ 
      message: `사용자가 ${users[userIndex].is_approved ? '승인' : '승인 취소'}되었습니다.`,
      user: users[userIndex]
    });
  } catch (error) {
    console.error('Toggle user approval error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

export const changeUserRole = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'teacher', 'student', 'parent'].includes(role)) {
      return res.status(400).json({ error: '유효하지 않은 역할입니다.' });
    }

    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    users[userIndex].role = role as UserRole;
    users[userIndex].updated_at = new Date().toISOString();
    saveUsers(users);

    res.json({ 
      message: '사용자 역할이 변경되었습니다.',
      user: users[userIndex]
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
    }

    const { username, email, password, name, phone, role } = req.body;

    if (!username || !email || !password || !name || !role) {
      return res.status(400).json({ error: '모든 필수 필드를 입력해주세요.' });
    }

    const users = loadUsers();
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: '이미 존재하는 사용자명 또는 이메일입니다.' });
    }

    const passwordHash = await hashPassword(password);

    const newUser: SimpleUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      email,
      password_hash: passwordHash,
      name,
      phone: phone || '',
      role,
      is_approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);

    const { password_hash, ...userResponse } = newUser;

    res.status(201).json({
      message: '사용자가 생성되었습니다.',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};