import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import { authenticateToken, checkMaintenanceMode } from './middlewares/auth';
import { authRoutes } from './routes/authRoutes';
import { userRoutes } from './routes/userRoutes';
import { courseRoutes } from './routes/courseRoutes';
import { testRoutes } from './routes/testRoutes';
import { videoRoutes } from './routes/videoRoutes';
import { notificationRoutes } from './routes/notificationRoutes';
import { reportRoutes } from './routes/reportRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { activityRoutes } from './routes/activityRoutes';
import { qnaRoutes } from './routes/qnaRoutes';
import { parentRoutes } from './routes/parentRoutes';
import { publicRoutes } from './routes/publicRoutes';
import { createConnection, waitForDatabase } from './config/database';
import AdminService from './services/adminService';
import { calendarRoutes } from './routes/calendarRoutes';

dotenv.config();

const app = express();

// readiness flag: false until initializeApplication completes
app.locals.isReady = false;

// When running behind nginx or another reverse proxy, trust the X-Forwarded-* headers
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const apiRateLimit = parseInt(process.env.API_RATE_LIMIT ?? '600', 10);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: apiRateLimit,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Liveness check endpoint (always 200 if process is up)
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Readiness check endpoint (503 until initialization completes)
 */
app.get('/readiness', (req, res) => {
  const isReady = app.locals.isReady === true;
  return res.status(isReady ? 200 : 503).json({
    status: isReady ? 'READY' : 'NOT_READY',
    isReady
  });
});

/**
 * Readiness guard middleware for all protected APIs
 * Allows: /health, /readiness, /api/public/*
 */
const ensureReady: express.RequestHandler = (_req, res, next) => {
  if (app.locals.isReady === true) return next();
  return res.status(503).json({
    success: false,
    message: 'Service is initializing. Please retry shortly.'
  });
};

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);

// 인증이 필요한 라우트들에 점검 모드 및 준비 상태 가드 적용
app.use('/api/users', ensureReady, authenticateToken, checkMaintenanceMode, userRoutes);
app.use('/api/courses', ensureReady, authenticateToken, checkMaintenanceMode, courseRoutes);
app.use('/api/tests', ensureReady, authenticateToken, checkMaintenanceMode, testRoutes);
app.use('/api/video-progress', ensureReady, authenticateToken, checkMaintenanceMode, videoRoutes);
app.use('/api/notifications', ensureReady, authenticateToken, checkMaintenanceMode, notificationRoutes);
app.use('/api/reports', ensureReady, authenticateToken, checkMaintenanceMode, reportRoutes);
app.use('/api/parent', ensureReady, authenticateToken, checkMaintenanceMode, parentRoutes);
app.use('/api/admin', ensureReady, authenticateToken, checkMaintenanceMode, adminRoutes);
app.use('/api/activity', ensureReady, authenticateToken, checkMaintenanceMode, activityRoutes);
app.use('/api/qna', ensureReady, authenticateToken, checkMaintenanceMode, qnaRoutes);
app.use('/api/calendar', ensureReady, authenticateToken, checkMaintenanceMode, calendarRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorHandler);

/**
 * 데이터베이스 초기화 및 어드민 계정 생성
 */
export async function initializeApplication() {
  try {
    console.log('🔧 Initializing application...');
    
    // 데이터베이스 연결 풀 생성
    createConnection();
    console.log('📊 Database connection established');

    // 데이터베이스가 준비될 때까지 대기 (컨테이너 초기 부팅 대비)
    await waitForDatabase();
    console.log('✅ Database connection verified');
    
    // 어드민 계정 초기화
    const adminResult = await AdminService.initializeAdminAccount();
    
    if (adminResult.success) {
      console.log('👨‍💼 Admin account initialization completed');
      
      // 어드민 계정 정보 출력 (디버깅용)
      if (process.env.NODE_ENV === 'development') {
        const adminInfo = await AdminService.getAdminInfo();
        if (adminInfo) {
          console.log('📋 Admin Account Info:');
          console.log(`   - ID: ${adminInfo.id}`);
          console.log(`   - Username: ${adminInfo.username}`);
          console.log(`   - Name: ${adminInfo.name}`);
          console.log(`   - Email: ${adminInfo.email}`);
          console.log(`   - Created: ${adminInfo.created_at}`);
        }
      }
    } else {
      console.error('❌ Admin account initialization failed:', adminResult.message);
      // 어드민 계정 생성 실패 시에도 서버는 계속 실행
    }
    
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    // 초기화 실패 시에도 서버는 계속 실행 (운영 환경에서 중요)
  }
}

export default app;
