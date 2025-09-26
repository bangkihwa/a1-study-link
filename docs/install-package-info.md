# A1 StudyLink LMS - 패키지 정보

이 문서는 A1 StudyLink LMS 프로젝트에서 사용되는 모든 패키지와 도구들에 대한 정보를 제공합니다.

## 📋 목차

- [프로젝트 구조](#프로젝트-구조)
- [프론트엔드 패키지](#프론트엔드-패키지)
- [백엔드 패키지](#백엔드-패키지)
- [인프라 & DevOps](#인프라--devops)
- [설치 및 실행](#설치-및-실행)

---

## 🏗️ 프로젝트 구조

```
a-one-study-lms/
├── frontend/          # React TypeScript 프론트엔드
├── backend/           # Node.js TypeScript 백엔드
├── docker/           # Docker 설정 파일들
└── docs/             # 프로젝트 문서
```

---

## 🎨 프론트엔드 패키지

### 핵심 프레임워크
- **React**: `^19.1.1` - UI 라이브러리
- **React DOM**: `^19.1.1` - React DOM 렌더러
- **TypeScript**: `^4.9.5` - 정적 타입 검사
- **React Scripts**: `5.0.1` - Create React App 빌드 도구

### 라우팅 & 상태관리
- **React Router DOM**: `^7.9.1` - 클라이언트 사이드 라우팅

### UI 컴포넌트 & 스타일링
- **Tailwind CSS**: `^3.4.17` - 유틸리티 우선 CSS 프레임워크
- **PostCSS**: `^8.5.6` - CSS 변환 도구
- **Autoprefixer**: `^10.4.21` - CSS 벤더 프리픽스 자동 추가
- **Headless UI**: `^2.2.8` - 접근성 중심의 unstyled UI 컴포넌트
- **Heroicons**: `^2.2.0` - 아이콘 라이브러리
- **react-window**: `^1.8.10` - 대용량 리스트 가상 스크롤 컴포넌트
- **react-virtualized-auto-sizer**: `^1.0.23` - 컨테이너 크기에 맞춰 가상 리스트 자동 리사이즈

### HTTP 통신
- **Axios**: `^1.12.2` - HTTP 클라이언트

### 테스팅
- **Testing Library (React)**: `^16.3.0` - React 컴포넌트 테스트
- **Testing Library (DOM)**: `^10.4.1` - DOM 테스트 유틸리티
- **Testing Library (Jest DOM)**: `^6.8.0` - Jest DOM 매처
- **Testing Library (User Event)**: `^13.5.0` - 사용자 이벤트 시뮬레이션

### 성능 모니터링
- **Web Vitals**: `^2.1.4` - 웹 성능 지표 측정

### TypeScript 타입 정의
- `@types/jest`: `^27.5.2`
- `@types/node`: `^16.18.126`
- `@types/react`: `^19.1.13`
- `@types/react-dom`: `^19.1.9`
- `@types/react-router-dom`: `^5.3.3`
- `@types/react-window`: `^1.8.8`

---

## ⚙️ 백엔드 패키지

### 핵심 프레임워크
- **Express**: `^5.1.0` - Node.js 웹 프레임워크
- **TypeScript**: `^5.9.2` - 정적 타입 검사
- **Node.js**: 18+ (Docker 이미지 기준)

### 보안
- **bcryptjs**: `^3.0.2` - 비밀번호 해싱
- **jsonwebtoken**: `^9.0.2` - JWT 토큰 생성/검증
- **helmet**: `^8.1.0` - 보안 헤더 설정
- **cors**: `^2.8.5` - CORS 정책 관리
- **express-rate-limit**: `^8.1.0` - API 요청 제한

### 데이터베이스
- **mysql2**: `^3.15.0` - MySQL 데이터베이스 드라이버

### 유효성 검사 & 파일 처리
- **express-validator**: `^7.2.1` - 요청 데이터 유효성 검사
- **multer**: `^2.0.2` - 파일 업로드 처리

### 환경 설정
- **dotenv**: `^17.2.2` - 환경 변수 관리

### 개발 도구
- **nodemon**: `^3.1.10` - 개발 중 자동 재시작
- **ts-node**: `^10.9.2` - TypeScript 직접 실행

### 테스팅
- **Jest**: `^29.7.0` - JavaScript 테스트 프레임워크
- **ts-jest**: `^29.4.4` - TypeScript Jest 변환기

### 코드 품질
- **ESLint**: `^9.36.0` - JavaScript/TypeScript 린터
- **@typescript-eslint/eslint-plugin**: `^8.44.0` - TypeScript ESLint 플러그인
- **@typescript-eslint/parser**: `^8.44.0` - TypeScript ESLint 파서

### TypeScript 타입 정의
- `@types/bcryptjs`: `^2.4.6`
- `@types/cors`: `^2.8.19`
- `@types/express`: `^5.0.3`
- `@types/jest`: `^30.0.0`
- `@types/jsonwebtoken`: `^9.0.10`
- `@types/multer`: `^2.0.0`
- `@types/node`: `^24.5.2`

---

## 🐳 인프라 & DevOps

### 컨테이너화
- **Docker**: 컨테이너 플랫폼
- **Docker Compose**: 멀티 컨테이너 애플리케이션 정의

### 서비스 구성
- **Nginx**: `alpine` - 웹 서버 및 리버스 프록시
- **Node.js**: `18-alpine` - 백엔드 런타임
- **MySQL**: `8.0` - 관계형 데이터베이스
- **Redis**: `alpine` - 인메모리 데이터 구조 저장소

### 플랫폼
- **linux/amd64** - Docker 이미지 플랫폼 (Apple Silicon 호환)

---

## 🚀 설치 및 실행

### 전체 시스템 실행 (Docker)
```bash
# 프론트엔드 빌드
cd frontend
npm install
npm run build

# Docker 컨테이너 실행
cd ../docker
docker-compose up -d
```

### 개발 환경 실행
```bash
# 백엔드 개발 서버
cd backend
npm install
npm run dev

# 프론트엔드 개발 서버
cd frontend
npm install
npm start
```

### 테스트 실행
```bash
# 백엔드 테스트
cd backend
npm test

# 프론트엔드 테스트
cd frontend
npm test
```

---

## 📚 주요 기능별 패키지 매핑

### 인증 시스템
- **bcryptjs**: 비밀번호 암호화
- **jsonwebtoken**: JWT 토큰 관리
- **express-validator**: 로그인 데이터 검증

### UI/UX
- **Tailwind CSS**: 빠른 스타일링
- **Headless UI**: 접근성 우수한 컴포넌트
- **Heroicons**: 일관된 아이콘 시스템

### 데이터 통신
- **axios**: HTTP 요청 처리
- **cors**: 크로스 오리진 요청 허용

### 보안
- **helmet**: HTTP 보안 헤더
- **express-rate-limit**: DDoS 방지
- **CORS**: 출처 기반 보안

### 파일 시스템
- **multer**: 파일 업로드
- **nginx**: 정적 파일 서빙

---

## 🔧 버전 관리 정책

- **Node.js**: 18+ LTS 버전 사용
- **React**: 최신 안정 버전 사용
- **TypeScript**: 프로젝트 간 호환성 유지
- **보안 패키지**: 정기적 업데이트 필수

---

## 📞 문의 및 지원

패키지 관련 문제나 업데이트가 필요한 경우:
1. GitHub Issues 등록
2. 개발팀 Slack 채널 문의
3. 기술 문서 Wiki 참조

---

*마지막 업데이트: 2025년 9월 21일*
