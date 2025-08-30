import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import subjectRoutes from './routes/subjects';
// import adminRoutes from './routes/admin';
// import teacherRoutes from './routes/teacher';
// import studentRoutes from './routes/student';
import parentRoutes from './routes/parent';
import reportsRoutes from './routes/reports';
import quizRoutes from './routes/quiz';
import analyticsRoutes from './routes/analytics';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// 미들웨어
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/teacher', teacherRoutes);
// app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/analytics', analyticsRoutes);

// 임시 학생 대시보드 API
app.get('/api/student/dashboard', (req, res) => {
  res.json({
    stats: {
      lectures: { total_lectures: 10, completed_lectures: 7 },
      questions: { pending_questions: 2 },
      assignments: { total_assignments: 5, submitted_assignments: 4, graded_assignments: 3 }
    },
    recentActivity: [
      { type: 'lecture', title: '중등3 물리 - 힘과 운동', date: new Date().toISOString() },
      { type: 'question', title: '속도와 가속도의 차이점은?', date: new Date(Date.now() - 3600000).toISOString() },
      { type: 'assignment', title: '물리 문제집 1-10번', date: new Date(Date.now() - 7200000).toISOString() }
    ]
  });
});

// 관리자 통계 API
app.get('/api/auth/stats', (req, res) => {
  try {
    const { loadUsers } = require('./utils/dataStorage');
    const users = loadUsers();
    
    const stats = {
      total_users: users.length,
      admin_count: users.filter((u: any) => u.role === 'admin').length,
      teacher_count: users.filter((u: any) => u.role === 'teacher').length,
      student_count: users.filter((u: any) => u.role === 'student').length,
      parent_count: users.filter((u: any) => u.role === 'parent').length,
      approved_count: users.filter((u: any) => u.is_approved === true).length,
      pending_count: users.filter((u: any) => u.is_approved === false).length
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({ error: '통계 데이터를 불러올 수 없습니다.' });
  }
});

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ error: '요청한 경로를 찾을 수 없습니다.' });
});

// 에러 핸들러
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 시작되었습니다.`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
});

export default app;