# 에이원 스터디링크 개발 구현 계획서

## 1. 프로젝트 디렉토리 구조

```
porting-a1-study-link/
├── docker/
│   ├── docker-compose.yml
│   ├── nginx/
│   │   └── nginx.conf
│   ├── mysql/
│   │   └── init.sql
│   └── app/
│       └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # 공통 컴포넌트
│   │   │   ├── auth/             # 인증 관련
│   │   │   ├── admin/            # 관리자 전용
│   │   │   ├── teacher/          # 교사 전용
│   │   │   ├── student/          # 학생 전용
│   │   │   └── parent/           # 학부모 전용
│   │   ├── pages/
│   │   │   ├── auth/             # 로그인/회원가입
│   │   │   ├── dashboard/        # 역할별 대시보드
│   │   │   ├── courses/          # 강의 관리
│   │   │   ├── tests/            # 테스트 관리
│   │   │   ├── reports/          # 리포트
│   │   │   └── profile/          # 프로필 관리
│   │   ├── hooks/                # Custom React Hooks
│   │   ├── services/             # API 서비스
│   │   ├── utils/                # 유틸리티 함수
│   │   ├── types/                # TypeScript 타입 정의
│   │   ├── contexts/             # React Context
│   │   └── styles/               # Tailwind CSS 설정
│   ├── package.json
│   └── tsconfig.json
├── backend/
│   ├── src/
│   │   ├── controllers/          # API 컨트롤러
│   │   ├── middlewares/          # 미들웨어
│   │   ├── models/               # 데이터베이스 모델
│   │   ├── routes/               # API 라우트
│   │   ├── services/             # 비즈니스 로직
│   │   ├── utils/                # 유틸리티 함수
│   │   ├── config/               # 설정 파일
│   │   └── types/                # TypeScript 타입
│   ├── tests/                    # 테스트 파일
│   ├── package.json
│   └── tsconfig.json
├── docs/                         # 프로젝트 문서
└── README.md
```

## 2. 사용자 역할별 페이지 구조

### 2.1 공통 페이지
```
/                           - 랜딩 페이지 (로그인 전 메인)
/login                      - 로그인 페이지
/register/student           - 학생 회원가입
/register/parent            - 학부모 회원가입 (고유번호 입력)
/register/teacher           - 교사 회원가입 (관리자 승인 대기)
/forgot-password            - 비밀번호 찾기
```

### 2.2 관리자 (Admin) 페이지
```
/admin/dashboard            - 관리자 대시보드
├── /admin/users            - 사용자 관리
│   ├── /teachers           - 교사 관리 (승인/거부)
│   ├── /students           - 학생 관리
│   └── /parents            - 학부모 관리
├── /admin/academy-courses  - 과목·반·강의 통합 관리(탭 UI)
│   ├── subjects tab        - 과목 CRUD, 비활성 토글
│   ├── classes tab         - 반 정보 + 학생 배정 패널 + KPI
│   └── courses tab         - 강의 요약/관리(확장 예정)
├── /admin/reports          - 전체 학습 현황 모니터링
└── /admin/settings         - 시스템 설정 (알림, 정책)
```

### 2.3 교사 (Teacher) 페이지
```
/teacher/dashboard          - 교사 대시보드
├── /teacher/classes        - 담당 반 관리
├── /teacher/courses        - 강의 관리
│   ├── /create             - 강의 생성
│   ├── /edit/:id           - 강의 편집
│   └── /blocks             - 콘텐츠 블록 관리
├── /teacher/tests          - 테스트 관리
│   ├── /builder            - 테스트 빌더
│   ├── /grading            - 채점 관리
│   └── /results            - 결과 공개
├── /teacher/students       - 학생 관리
│   ├── /progress           - 학습 진도 모니터링
│   └── /video-tracking     - 동영상 시청 현황
├── /teacher/qna            - Q&A 관리
├── /teacher/reports        - 학습 보고서 생성
└── /teacher/notifications  - 알림 관리
```

### 2.4 학생 (Student) 페이지
```
/student/dashboard          - 학생 대시보드
├── /student/courses        - 수강 강의 목록
│   └── /course/:id         - 강의 상세 (블록별 학습)
├── /student/tests          - 테스트 응시
│   ├── /available          - 응시 가능한 테스트
│   ├── /taking/:id         - 테스트 응시 중
│   └── /results            - 결과 확인
├── /student/progress       - 학습 진도 확인
├── /student/qna            - 질문 등록/답변 확인
├── /student/calendar       - 학습 활동 달력
├── /student/reports        - 개인 학습 보고서
└── /student/notifications  - 알림 확인
```

### 2.5 학부모 (Parent) 페이지
```
/parent/dashboard           - 학부모 대시보드
├── /parent/child-progress  - 자녀 학습 현황
├── /parent/child-courses   - 자녀 수강 강의 (읽기 전용)
├── /parent/child-tests     - 자녀 테스트 결과 (읽기 전용)
├── /parent/child-qna       - 자녀 Q&A 내역 (읽기 전용)
├── /parent/child-calendar  - 자녀 학습 활동 달력
├── /parent/reports         - 자녀 학습 보고서
└── /parent/notifications   - 알림 확인
```

## 3. API 엔드포인트 설계

### 3.1 인증 관련 API
```javascript
// 인증 및 권한
POST   /api/auth/login                    // 로그인
POST   /api/auth/logout                   // 로그아웃
POST   /api/auth/refresh                  // 토큰 갱신
POST   /api/auth/forgot-password          // 비밀번호 찾기

// 회원가입
POST   /api/auth/register/student         // 학생 회원가입
POST   /api/auth/register/parent          // 학부모 회원가입
POST   /api/auth/register/teacher         // 교사 회원가입

// 계정 연동
GET    /api/auth/student/:studentNumber   // 학생 고유번호 유효성 검사
POST   /api/auth/link-parent-student      // 학부모-학생 연동
```

### 3.2 사용자 관리 API
```javascript
// 사용자 관리 (관리자)
GET    /api/admin/users                   // 전체 사용자 조회
GET    /api/admin/users/pending           // 승인 대기 사용자
PUT    /api/admin/users/:id/approve       // 사용자 승인
PUT    /api/admin/users/:id               // 사용자 정보 수정
DELETE /api/admin/users/:id               // 사용자 삭제

// 학원 관리
GET    /api/admin/subjects                // 과목 목록
POST   /api/admin/subjects                // 과목 생성
PUT    /api/admin/subjects/:id            // 과목 수정
DELETE /api/admin/subjects/:id            // 과목 삭제

GET    /api/admin/classes                 // 반 목록
POST   /api/admin/classes                 // 반 생성
PUT    /api/admin/classes/:id             // 반 수정
DELETE /api/admin/classes/:id             // 반 삭제
```

### 3.3 강의 관리 API
```javascript
// 강의 관리
GET    /api/courses                       // 강의 목록 (역할별 필터링)
GET    /api/courses/:id                   // 강의 상세
POST   /api/courses                       // 강의 생성 (교사/관리자)
PUT    /api/courses/:id                   // 강의 수정
DELETE /api/courses/:id                   // 강의 삭제

// 콘텐츠 블록 관리
GET    /api/courses/:id/blocks            // 블록 목록
POST   /api/courses/:id/blocks            // 블록 생성
PUT    /api/courses/:id/blocks/:blockId   // 블록 수정
DELETE /api/courses/:id/blocks/:blockId   // 블록 삭제
PUT    /api/courses/:id/blocks/reorder    // 블록 순서 변경
```

### 3.4 YouTube 시청 추적 API
```javascript
// 동영상 시청 추적
GET    /api/video-progress/:studentId/:blockId   // 시청 진도 조회
POST   /api/video-progress                       // 시청 진도 업데이트
PUT    /api/video-progress/:id/complete          // 완료 처리

// 교사용 모니터링
GET    /api/teacher/video-progress                // 반 전체 시청 현황
GET    /api/teacher/video-progress/:studentId    // 특정 학생 시청 현황
```

### 3.5 테스트 관리 API
```javascript
// 테스트 빌더
GET    /api/tests                         // 테스트 목록
GET    /api/tests/:id                     // 테스트 상세
POST   /api/tests                         // 테스트 생성
PUT    /api/tests/:id                     // 테스트 수정
DELETE /api/tests/:id                     // 테스트 삭제

// 문제 관리
POST   /api/tests/:id/questions           // 문제 추가
PUT    /api/tests/:id/questions/:qId      // 문제 수정
DELETE /api/tests/:id/questions/:qId      // 문제 삭제

// 테스트 응시
GET    /api/tests/:id/attempt             // 테스트 응시 시작
POST   /api/tests/:id/submit              // 답안 제출
GET    /api/tests/:id/result              // 결과 조회

// 채점 관리 (교사)
GET    /api/teacher/tests/:id/submissions // 제출된 답안 목록
PUT    /api/teacher/tests/grade            // 서술형 채점
PUT    /api/teacher/tests/:id/publish      // 결과 공개
```

### 3.6 학습 리포트 API
```javascript
// 리포트 생성
GET    /api/reports/student/:id           // 학생 리포트 데이터
GET    /api/reports/class/:id             // 반 리포트 데이터
POST   /api/reports/generate              // 리포트 생성 요청
GET    /api/reports/download/:id          // PDF 다운로드

// 학습 활동 로그
GET    /api/activity-logs/:studentId      // 학생 활동 로그
POST   /api/activity-logs                 // 활동 로그 기록
```

### 3.7 Q&A 및 알림 API
```javascript
// Q&A 시스템
GET    /api/qna                           // 질문 목록
GET    /api/qna/:id                       // 질문 상세
POST   /api/qna                           // 질문 등록
PUT    /api/qna/:id/answer                // 답변 등록

// 알림 시스템
GET    /api/notifications                 // 알림 목록
GET    /api/notifications/unread          // 읽지 않은 알림
PUT    /api/notifications/:id/read        // 알림 읽음 처리
POST   /api/notifications                 // 알림 발송
```

## 4. 데이터베이스 스키마 설계

### 4.1 핵심 테이블 상세 구조

```sql
-- 사용자 기본 정보
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  is_approved BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_username (username),
  INDEX idx_email (email)
);

-- 학생 전용 정보
CREATE TABLE students (
  user_id INT PRIMARY KEY,
  student_number VARCHAR(8) UNIQUE NOT NULL,
  grade INT,
  class_id INT,
  enrollment_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  INDEX idx_student_number (student_number),
  INDEX idx_class (class_id)
);

-- 학부모-학생 연결
CREATE TABLE parent_student_relations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parent_id INT NOT NULL,
  student_id INT NOT NULL,
  relationship ENUM('father', 'mother', 'guardian') DEFAULT 'guardian',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_parent_student (parent_id, student_id),
  INDEX idx_parent (parent_id),
  INDEX idx_student (student_id)
);

-- 과목 관리
CREATE TABLE subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  grade_level INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_grade (grade_level)
);

-- 반 관리
CREATE TABLE classes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT,
  grade_level INT,
  max_students INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  INDEX idx_subject (subject_id),
  INDEX idx_teacher (teacher_id)
);

-- 강의 관리
CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  class_id INT NOT NULL,
  teacher_id INT NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  INDEX idx_class (class_id),
  INDEX idx_teacher (teacher_id)
);

-- 콘텐츠 블록
CREATE TABLE content_blocks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  type ENUM('video', 'test', 'mindmap', 'text') NOT NULL,
  title VARCHAR(200) NOT NULL,
  content JSON NOT NULL, -- 유형별 데이터 저장
  order_index INT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course_order (course_id, order_index)
);

-- 동영상 시청 진도
CREATE TABLE video_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  video_block_id INT NOT NULL,
  watched_duration INT DEFAULT 0,
  total_duration INT DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  is_completed BOOLEAN DEFAULT FALSE,
  last_watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (video_block_id) REFERENCES content_blocks(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_video (student_id, video_block_id),
  INDEX idx_student (student_id),
  INDEX idx_progress (progress_percentage),
  INDEX idx_completed (is_completed)
);

-- 테스트 관리
CREATE TABLE tests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  teacher_id INT NOT NULL,
  time_limit INT, -- 분 단위
  total_score INT DEFAULT 100,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  INDEX idx_teacher (teacher_id)
);

-- 테스트 문제
CREATE TABLE test_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_id INT NOT NULL,
  type ENUM('ox', 'short_answer', 'multiple_choice', 'essay') NOT NULL,
  question_text TEXT NOT NULL,
  question_data JSON NOT NULL, -- 유형별 데이터 (선택지, 정답 등)
  points INT DEFAULT 10,
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  INDEX idx_test_order (test_id, order_index)
);

-- 테스트 제출
CREATE TABLE test_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_id INT NOT NULL,
  student_id INT NOT NULL,
  answers JSON NOT NULL,
  score DECIMAL(5,2),
  is_graded BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  graded_at TIMESTAMP NULL,
  FOREIGN KEY (test_id) REFERENCES tests(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  UNIQUE KEY unique_test_student (test_id, student_id),
  INDEX idx_test (test_id),
  INDEX idx_student (student_id)
);

-- Q&A 시스템
CREATE TABLE qna (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  student_id INT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  teacher_id INT,
  answered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  INDEX idx_course (course_id),
  INDEX idx_student (student_id)
);

-- 알림 시스템
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('assignment', 'answer', 'grade', 'announcement') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id INT, -- 관련 객체 ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_created (created_at)
);

-- 학습 활동 로그
CREATE TABLE activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  activity_type ENUM('video_watch', 'test_complete', 'question_ask', 'login') NOT NULL,
  related_id INT, -- 관련 객체 ID
  metadata JSON, -- 추가 데이터
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_date (student_id, created_at),
  INDEX idx_type (activity_type)
);
```

## 5. 컴포넌트 설계 가이드라인

### 5.1 React 컴포넌트 구조

```typescript
// 공통 컴포넌트 예시
src/components/common/
├── Layout/
│   ├── Header.tsx              // 상단 헤더 (역할별 메뉴)
│   ├── Sidebar.tsx             // 사이드바 네비게이션
│   ├── Footer.tsx              // 하단 푸터
│   └── Layout.tsx              // 전체 레이아웃 래퍼
├── Navigation/
│   ├── Breadcrumb.tsx          // 경로 표시
│   └── TabNavigation.tsx       // 탭 네비게이션
├── UI/
│   ├── Button.tsx              // 재사용 가능한 버튼
│   ├── Input.tsx               // 폼 입력 필드
│   ├── Modal.tsx               // 모달 창
│   ├── Table.tsx               // 데이터 테이블
│   ├── Card.tsx                // 카드 컴포넌트
│   ├── Badge.tsx               // 상태 배지
│   ├── ProgressBar.tsx         // 진도율 표시바
│   └── LoadingSpinner.tsx      // 로딩 스피너
├── Forms/
│   ├── LoginForm.tsx           // 로그인 폼
│   ├── RegisterForm.tsx        // 회원가입 폼
│   └── ProfileForm.tsx         // 프로필 수정 폼
└── Media/
    ├── YouTubePlayer.tsx       // YouTube 플레이어
    ├── VideoProgress.tsx       // 시청 진도 표시
    └── ImageUpload.tsx         // 이미지 업로드
```

### 5.2 페이지 컴포넌트 구조

```typescript
// 강의 상세 페이지 예시
// src/pages/courses/CourseDetail.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../../components/common/Layout';
import { ContentBlock } from '../../components/courses/ContentBlock';
import { ProgressTracker } from '../../components/courses/ProgressTracker';
import { useCourse } from '../../hooks/useCourse';
import { useAuth } from '../../contexts/AuthContext';

interface CourseDetailProps {}

const CourseDetail: React.FC<CourseDetailProps> = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { course, loading, error } = useCourse(id);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);

  // 컴포넌트 로직...

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* 강의 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{course?.title}</h1>
          <ProgressTracker 
            completed={completedBlocks} 
            total={totalBlocks} 
          />
        </div>

        {/* 콘텐츠 블록 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 사이드바: 블록 목록 */}
          <div className="lg:col-span-1">
            <BlockList 
              blocks={course?.blocks} 
              currentIndex={currentBlockIndex}
              onBlockSelect={setCurrentBlockIndex}
            />
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            <ContentBlock 
              block={currentBlock}
              onComplete={handleBlockComplete}
              userRole={user?.role}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetail;
```

### 5.3 Custom Hooks 설계

```typescript
// src/hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials: LoginCredentials) => {
    // 로그인 로직
  };

  const logout = async () => {
    // 로그아웃 로직
  };

  return { user, loading, login, logout };
};

// src/hooks/useVideoProgress.ts
export const useVideoProgress = (studentId: number, blockId: number) => {
  const [progress, setProgress] = useState<VideoProgress | null>(null);

  const updateProgress = async (currentTime: number, duration: number) => {
    // 진도 업데이트 로직
  };

  const markCompleted = async () => {
    // 완료 처리 로직
  };

  return { progress, updateProgress, markCompleted };
};

// src/hooks/useCourse.ts
export const useCourse = (courseId: string) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 강의 데이터 로드
  }, [courseId]);

  return { course, loading, error };
};
```

## 6. 개발 워크플로우

### 6.1 Git 브랜치 전략

```
main                    // 프로덕션 브랜치
├── develop             // 개발 통합 브랜치
├── feature/auth        // 인증 기능
├── feature/courses     // 강의 관리 기능
├── feature/tests       // 테스트 기능
├── feature/reports     // 리포트 기능
└── hotfix/bug-fix      // 긴급 버그 수정
```

### 6.2 개발 환경 설정

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd porting-a1-study-link

# 2. Docker 환경 구성
cd docker
docker-compose up -d

# 3. 백엔드 개발 환경
cd ../backend
npm install
npm run dev

# 4. 프론트엔드 개발 환경
cd ../frontend
npm install
npm run dev
```

### 6.3 코딩 컨벤션

```typescript
// 파일명: PascalCase for components, camelCase for others
// 컴포넌트명: PascalCase
// 변수/함수명: camelCase
// 상수명: UPPER_SNAKE_CASE
// 타입/인터페이스명: PascalCase

// TypeScript 인터페이스 예시
interface User {
  id: number;
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

// API 응답 타입
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// React 컴포넌트 Props
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
```

## 7. 주요 기능 구현 가이드

### 7.1 YouTube 시청 추적 구현

```typescript
// src/components/media/YouTubePlayer.tsx
import React, { useEffect, useRef } from 'react';
import { useVideoProgress } from '../../hooks/useVideoProgress';

interface YouTubePlayerProps {
  videoId: string;
  studentId: number;
  blockId: number;
  onComplete: () => void;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  studentId,
  blockId,
  onComplete
}) => {
  const playerRef = useRef<YT.Player | null>(null);
  const { updateProgress, markCompleted } = useVideoProgress(studentId, blockId);

  useEffect(() => {
    // YouTube IFrame API 로드
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
      
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }
  }, [videoId]);

  const initializePlayer = () => {
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId,
      events: {
        onStateChange: handleStateChange,
        onReady: handlePlayerReady
      }
    });
  };

  const handleStateChange = (event: YT.OnStateChangeEvent) => {
    if (event.data === YT.PlayerState.ENDED) {
      markCompleted();
      onComplete();
    }
  };

  const handlePlayerReady = () => {
    // 10초마다 진도 업데이트
    setInterval(() => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        updateProgress(currentTime, duration);
      }
    }, 10000);
  };

  return <div id="youtube-player" className="w-full aspect-video" />;
};
```

### 7.2 테스트 빌더 구현

```typescript
// src/components/tests/TestBuilder.tsx
interface Question {
  id: string;
  type: 'ox' | 'short_answer' | 'multiple_choice' | 'essay';
  questionText: string;
  points: number;
  data: any; // 유형별 데이터
}

const TestBuilder: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'ox',
    points: 10
  });

  const addQuestion = () => {
    const newQuestion: Question = {
      id: generateId(),
      ...currentQuestion as Question
    };
    setQuestions([...questions, newQuestion]);
    resetCurrentQuestion();
  };

  const renderQuestionForm = () => {
    switch (currentQuestion.type) {
      case 'ox':
        return <OXQuestionForm 
          question={currentQuestion} 
          onChange={setCurrentQuestion} 
        />;
      case 'multiple_choice':
        return <MultipleChoiceForm 
          question={currentQuestion} 
          onChange={setCurrentQuestion} 
        />;
      // ... 다른 유형들
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 문제 작성 폼 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">문제 작성</h2>
          {renderQuestionForm()}
          <Button onClick={addQuestion}>문제 추가</Button>
        </div>

        {/* 문제 목록 */}
        <div>
          <h2 className="text-xl font-semibold">문제 목록</h2>
          <QuestionList 
            questions={questions}
            onEdit={editQuestion}
            onDelete={deleteQuestion}
            onReorder={reorderQuestions}
          />
        </div>
      </div>
    </div>
  );
};
```

### 7.3 학습 리포트 생성

```typescript
// src/services/reportService.ts
export class ReportService {
  static async generateStudentReport(
    studentId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<StudentReport> {
    
    const [
      courseProgress,
      testResults,
      videoProgress,
      qnaActivity
    ] = await Promise.all([
      this.getCourseProgress(studentId, startDate, endDate),
      this.getTestResults(studentId, startDate, endDate),
      this.getVideoProgress(studentId, startDate, endDate),
      this.getQnAActivity(studentId, startDate, endDate)
    ]);

    return {
      studentInfo: await this.getStudentInfo(studentId),
      period: { startDate, endDate },
      courseProgress,
      testResults,
      videoProgress,
      qnaActivity,
      summary: this.calculateSummary({
        courseProgress,
        testResults,
        videoProgress
      })
    };
  }

  static async generatePDFReport(reportData: StudentReport): Promise<Blob> {
    // PDF 생성 로직 (예: jsPDF 사용)
    const pdf = new jsPDF();
    
    // 헤더
    pdf.setFontSize(18);
    pdf.text('학습 리포트', 20, 30);
    
    // 학생 정보
    pdf.setFontSize(12);
    pdf.text(`학생: ${reportData.studentInfo.name}`, 20, 50);
    pdf.text(`기간: ${formatDateRange(reportData.period)}`, 20, 60);
    
    // 진도율 차트
    this.addProgressChart(pdf, reportData.courseProgress);
    
    // 테스트 결과
    this.addTestResults(pdf, reportData.testResults);
    
    return pdf.output('blob');
  }
}
```

## 8. 테스트 전략

### 8.1 단위 테스트 (Jest + React Testing Library)

```typescript
// src/__tests__/components/YouTubePlayer.test.tsx
import { render, screen } from '@testing-library/react';
import { YouTubePlayer } from '../components/media/YouTubePlayer';

describe('YouTubePlayer', () => {
  it('should render YouTube player container', () => {
    render(
      <YouTubePlayer 
        videoId="test-video-id"
        studentId={1}
        blockId={1}
        onComplete={jest.fn()}
      />
    );
    
    expect(screen.getByTestId('youtube-player')).toBeInTheDocument();
  });

  it('should call onComplete when video ends', async () => {
    const onComplete = jest.fn();
    // 테스트 구현...
  });
});
```

### 8.2 API 테스트 (Supertest)

```typescript
// backend/tests/auth.test.ts
import request from 'supertest';
import app from '../src/app';

describe('Auth API', () => {
  describe('POST /api/auth/register/student', () => {
    it('should register student and generate student number', async () => {
      const response = await request(app)
        .post('/api/auth/register/student')
        .send({
          username: 'test_student',
          password: 'password123',
          name: '테스트 학생',
          email: 'student@test.com'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.studentNumber).toMatch(/^[A-Z0-9]{8}$/);
    });
  });
});
```

## 9. 배포 및 운영

### 9.1 Docker 설정

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ../frontend/build:/usr/share/nginx/html
    depends_on:
      - backend

  backend:
    build: 
      context: ../backend
      dockerfile: ../docker/app/Dockerfile
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=a1_studylink
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=admin
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
      - MYSQL_DATABASE=a1_studylink
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

### 9.2 환경 변수 설정

```bash
# .env
DB_PASSWORD=secure_password_123
JWT_SECRET=your_jwt_secret_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
YOUTUBE_API_KEY=your_youtube_api_key
```

이 계획서를 바탕으로 개발팀이 체계적으로 개발을 진행할 수 있습니다. 각 섹션별로 구체적인 구현 가이드와 코드 예시를 포함하여 개발 착수 시 참고할 수 있도록 작성했습니다.
