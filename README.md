# 에이원 스터디링크 (A1 StudyLink) LMS

에이원 과학학원을 위한 맞춤형 학습 관리 시스템(LMS)입니다.

## 🚀 프로젝트 개요

- **프로젝트명**: 에이원 스터디링크 (A1 StudyLink)
- **대상**: 에이원 과학학원 관리자, 교사, 학생 및 학부모 (30명 규모)
- **기술 스택**:
  - Frontend: React + TypeScript + Tailwind CSS
  - Backend: Node.js + Express.js + TypeScript
  - Database: MySQL
  - Infrastructure: Docker + Nginx

## 📋 주요 기능

### 👥 사용자 역할별 기능

#### 관리자 (Admin)
- 교사, 학생, 학부모 계정 생성, 승인 및 관리
- 과목 및 반 생성/관리
- 교사-반 배정 관리
- 전체 학생 학습 현황 모니터링

#### 교사 (Teacher)
- 담당 반 학생 관리 및 학습 현황 대시보드
- 강의 콘텐츠 블록 단위 생성 및 편집
- 온라인 테스트 빌더 (O/X, 단답형, 객관식, 서술형)
- 학생 과제 채점 및 피드백 제공
- 학생별 동영상 시청 진도 모니터링
- 학습 보고서 생성

#### 학생 (Student)
- 수강 강의 목록 확인 및 학습
- YouTube 동영상 시청 및 자동 진도율 추적
- 온라인 테스트 응시 및 과제 제출
- 교사 피드백 및 Q&A 답변 확인
- 개인별 학습 달력 및 리포트 확인

#### 학부모 (Parent)
- 자녀의 학습 과정 투명하게 파악
- 자녀 수강 강의 현황 확인 (읽기 전용)
- 자녀 테스트 결과 및 Q&A 내역 확인
- 자녀 학습 리포트 확인

### 🎯 핵심 기능

1. **회원가입 및 계정 연동**
   - 학생 회원가입 시 8자리 고유번호 자동 발급
   - 학부모 회원가입 시 학생 고유번호로 계정 연동
   - 교사 계정은 관리자 승인 필요

2. **YouTube 동영상 시청 추적**
   - YouTube IFrame Player API를 활용한 실시간 시청 진도 추적
   - 영상 길이의 95% 이상 시청 시 자동 완료 처리
   - 교사용 학생별 시청 진도 모니터링 대시보드

3. **모듈형 강의 콘텐츠 관리**
   - YouTube 동영상, 온라인 테스트, 마인드맵 URL 등을 블록처럼 자유롭게 조합
   - 유연한 강의 구성 및 순서 변경

4. **자체 온라인 테스트 빌더**
   - 4가지 유형 문제 출제: O/X, 단답형, 객관식, 서술형
   - 자동 채점 및 결과 분석
   - 교사 직접 채점 (서술형)

5. **학습 활동 이력 기반 리포트**
   - 모든 학습 활동 기록 및 추적
   - 기간별 학습 성취도, 과제 수행률 종합 리포트
   - PDF 저장 및 출력 기능

6. **통합 알림 시스템**
   - 웹사이트 내 실시간 알림
   - 새 과제, 답변 등록, 공지 등 역할별 맞춤 알림

## 🏗️ 프로젝트 구조

```
a-one-study-lms/
├── docker/                    # Docker 설정
│   ├── docker-compose.yml
│   ├── nginx/
│   │   └── nginx.conf
│   ├── mysql/
│   │   └── init.sql
│   └── app/
│       └── Dockerfile
├── backend/                   # Node.js 백엔드
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── config/
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
├── frontend/                  # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── types/
│   │   └── contexts/
│   ├── package.json
│   └── tsconfig.json
└── docs/                      # 프로젝트 문서
```

## 🐳 Docker를 활용한 개발 환경 구성

### 필수 요구사항

- Docker
- Docker Compose
- Node.js 18+ (로컬 개발용)

### 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
DB_PASSWORD=secure_password_123
JWT_SECRET=your_jwt_secret_key_change_this_in_production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
YOUTUBE_API_KEY=your_youtube_api_key
```

### 개발 환경 실행

1. **Docker 컨테이너 실행**
```bash
cd docker
docker-compose up -d
```

#### 백엔드 Docker 빌드 파이프라인
- `docker/app/Dockerfile`은 **멀티 스테이지**로 구성되어 있습니다.
  - `builder` 스테이지에서 `npm ci`로 devDependencies까지 설치한 뒤 `npm run build`로 TypeScript를 컴파일합니다.
  - `production` 스테이지에서는 `npm ci --omit=dev`로 런타임에 필요한 패키지만 설치하고, `builder` 스테이지에서 생성한 `dist` 산출물을 복사합니다.
- 새로운 빌드 타임 의존성을 추가했다면 반드시 `devDependencies`에 선언하고, 아래 명령으로 이미지를 다시 빌드해주세요.
```bash
cd docker
docker compose build backend
```

2. **백엔드 개발 서버 실행**
```bash
cd backend
npm install
npm run dev
```

3. **프론트엔드 개발 서버 실행**
```bash
cd frontend
npm install
npm start
```

### 접속 정보

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3000/api
- **MySQL**: localhost:3306
- **Nginx**: http://localhost (프로덕션 모드)

### 기본 관리자 계정

- **ID**: admin
- **PW**: admin

## 📚 데이터베이스 스키마

주요 테이블:
- `users`: 사용자 기본 정보
- `students`: 학생 전용 정보 (고유번호 포함)
- `parent_student_relations`: 학부모-학생 연결
- `courses`: 강의 정보
- `content_blocks`: 강의 콘텐츠 블록
- `video_progress`: 동영상 시청 진도
- `tests`: 테스트 정보
- `test_questions`: 테스트 문제
- `test_submissions`: 테스트 제출
- `notifications`: 알림
- `activity_logs`: 학습 활동 로그

## 🛠️ 개발 워크플로우

### Phase 1: 기반 설계 및 구축 ✅
- [x] 요구사항 분석 및 시스템 아키텍처 설계
- [x] Docker 환경 구성 및 개발 환경 설정
- [x] 데이터베이스 설계 및 초기화
- [x] React + Node.js 기본 프레임워크 구축
- [x] 사용자 인증 및 권한 관리 시스템

### Phase 2: 핵심 학습 기능 개발 🔄
- [ ] 강의 콘텐츠 관리(블록 시스템) 기능 개발
- [ ] YouTube API 연동 및 동영상 시청 추적 시스템 개발
- [ ] 온라인 테스트 빌더(4개 유형) 개발
- [ ] 과제 제출 및 Q&A 시스템 개발

### Phase 3: 데이터 및 리포트 기능 구현 ⏳
- [ ] 학습 활동 이력 추적 및 데이터 수집 기능 개발
- [ ] 리포트 및 달력 기능 개발
- [ ] 통합 알림 시스템 개발
- [ ] 모바일 반응형 UI/UX 최적화

### Phase 4: 통합 테스트 및 안정화 ⏳
- [ ] 전체 기능 통합 테스트 및 버그 수정
- [ ] 사용자 피드백 수렴 및 UI/UX 개선
- [ ] 성능 최적화 및 Docker 배포 환경 구성
- [ ] 최종 시스템 배포 및 오픈

## 🧪 테스트

```bash
# 백엔드 테스트
cd backend
npm test

# 프론트엔드 테스트
cd frontend
npm test
```

## 📈 성능 및 확장성

- **동시 접속자**: 30명 안정적 처리
- **페이지 로딩**: 평균 3초 이내
- **브라우저 호환성**: Chrome, Safari, Edge 최신 버전
- **모바일 지원**: 반응형 웹 디자인

## 🔐 보안

- JWT 기반 인증
- bcrypt를 이용한 비밀번호 암호화
- Helmet을 이용한 보안 헤더 설정
- Rate limiting을 통한 API 보호
- 역할 기반 접근 제어 (RBAC)