# A1 과학학원 스터디링크 시스템

에이원 과학학원을 위한 종합 학습 관리 시스템입니다.

## 📚 프로젝트 개요

A1 과학학원 스터디링크는 다음과 같은 과목들을 지원하는 과학 전문 학습 플랫폼입니다:
- 중선 (중학교 선행)
- 중등1, 중등2, 중등3
- 통합과학
- 물리, 화학, 생명과학, 지구과학

## 🎯 주요 기능

### 1. 계정 및 권한 관리
- **관리자(Admin)**: 전체 시스템 관리, 사용자 승인, 반 배정
- **교사(Teacher)**: 강의 관리, 성적 관리, 피드백 제공
- **학생(Student)**: 강의 수강, 테스트 응시, 질문하기
- **학부모(Parent)**: 자녀 학습 현황 조회

### 2. 강의/콘텐츠 관리
- YouTube 동영상 삽입
- OX 테스트 및 SMO 테스트 (CodePen 연동)
- 마인드맵 삽입
- 블록 단위 콘텐츠 추가/관리

### 3. 학습 추적 및 피드백
- 실시간 학습 진도 추적
- 질문/어려웠던 점 표시 및 교사 피드백
- 수행 여부 자동 기록

### 4. 달력(Calendar) 뷰
- 학생/학부모/교사별 맞춤 달력
- 학습 활동, 과제 마감일, 피드백 일정 표시

### 5. 종합 리포트 시스템
- 개별 학생 학습 리포트
- 반별 진행 현황 리포트
- 성실도/집중도 지표 분석

## 🛠 기술 스택

### Backend
- **언어**: TypeScript
- **프레임워크**: Node.js + Express.js
- **데이터베이스**: PostgreSQL
- **인증**: JWT + bcrypt
- **보안**: Helmet, CORS

### Frontend
- **언어**: TypeScript
- **프레임워크**: React 18
- **스타일링**: Tailwind CSS
- **아이콘**: Heroicons
- **날짜 처리**: date-fns
- **HTTP 클라이언트**: Axios
- **상태 관리**: React Query

### 개발 도구
- **빌드 도구**: Vite
- **패키지 관리**: npm
- **타입 체킹**: TypeScript

## 📁 프로젝트 구조

```
a1-studylink/
├── server/                 # 백엔드 서버
│   ├── src/
│   │   ├── controllers/    # API 컨트롤러
│   │   ├── routes/         # 라우트 정의
│   │   ├── middleware/     # 미들웨어 (인증, 권한)
│   │   ├── database/       # DB 연결 및 스키마
│   │   ├── types/          # TypeScript 타입 정의
│   │   └── utils/          # 유틸리티 함수
│   ├── package.json
│   └── tsconfig.json
├── client/                 # 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── types/          # TypeScript 타입 정의
│   │   └── index.css       # 스타일 시트
│   ├── package.json
│   └── vite.config.ts
└── package.json            # 루트 패키지
```

## 🚀 설치 및 실행

### 1. 프로젝트 클론 및 의존성 설치

```bash
cd a1-studylink
npm install

# 서버 의존성 설치
cd server
npm install

# 클라이언트 의존성 설치
cd ../client
npm install
```

### 2. 환경 변수 설정

서버의 `.env` 파일을 생성하고 다음 내용을 입력합니다:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=a1_studylink
DB_USER=postgres
DB_PASSWORD=your_password

# JWT 설정
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 서버 설정
PORT=3001
NODE_ENV=development

# CORS 설정
CORS_ORIGIN=http://localhost:3000
```

### 3. 데이터베이스 설정

PostgreSQL 데이터베이스를 생성하고 스키마를 적용합니다:

```sql
-- 데이터베이스 생성
CREATE DATABASE a1_studylink;

-- 스키마 적용 (server/src/database/schema.sql 파일 실행)
\i server/src/database/schema.sql
```

### 4. 애플리케이션 실행

```bash
# 루트 디렉토리에서 개발 서버 실행 (서버와 클라이언트 동시 실행)
npm run dev

# 또는 개별 실행
npm run dev:server  # 서버만 실행 (포트 3001)
npm run dev:client  # 클라이언트만 실행 (포트 3000)
```

## 📊 데이터베이스 스키마

### 주요 테이블
- `users`: 사용자 정보 (학생, 교사, 학부모, 관리자)
- `classes`: 반/클래스 정보
- `lectures`: 강의 정보
- `lecture_contents`: 강의 콘텐츠 (동영상, 테스트, 마인드맵)
- `student_lecture_progress`: 학생 강의 진행 상황
- `student_questions`: 학생 질문
- `teacher_feedback`: 교사 피드백
- `assignments`: 과제
- `learning_analytics`: 학습 분석 데이터

## 🌟 핵심 기능 상세

### 콘텐츠 관리 시스템
- **YouTube 동영상**: URL 입력으로 자동 임베드
- **OX/SMO 테스트**: CodePen 또는 자체 제작 테스트 도구 연동
- **마인드맵**: 온라인 마인드맵 도구와 연동
- **블록 시스템**: 드래그 앤 드롭으로 콘텐츠 순서 조정

### 학습 추적
- 실시간 진도율 계산
- 학습 시간 자동 측정
- 반복 학습 횟수 추적
- 난이도별 질문 분류

### 리포트 시스템
- 개인별 상세 학습 리포트
- 과목별 성취도 분석
- 시간대별 학습 패턴 분석
- 학부모용 요약 리포트

## 🔐 보안 기능

- JWT 기반 인증
- 역할 기반 접근 제어 (RBAC)
- 비밀번호 해싱 (bcrypt)
- SQL 인젝션 방지
- XSS 방지 (Helmet)

## 📱 반응형 디자인

- 모바일, 태블릿, 데스크톱 지원
- Tailwind CSS 기반 반응형 UI
- 다크모드 지원 (선택사항)

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경 사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

에이원 과학학원 개발팀
- 이메일: [개발팀 이메일]
- 전화: [연락처]

---

© 2024 A1 Science Academy. All rights reserved.