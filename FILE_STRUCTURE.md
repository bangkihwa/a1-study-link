# A1 StudyLink 파일 구조 설명

## 📍 프로젝트 위치
`C:\Users\82103\a1-studylink\`

## 📂 주요 컴포넌트 파일

### 🔐 인증/로그인
- `client/src/pages/Login.tsx` - 로그인 페이지
- `client/src/pages/Register.tsx` - 회원가입 페이지
- `client/src/pages/Dashboard.tsx` - 메인 대시보드 라우터

### 👨‍💼 관리자 기능
- `client/src/components/admin/AdminDashboardFixed.tsx` - 관리자 대시보드
- `client/src/components/admin/IntegratedUserManagement.tsx` - 통합 사용자 관리
- `client/src/components/admin/EnhancedClassManagement.tsx` - 반 관리
- `client/src/components/admin/AllLecturesView.tsx` - 전체 강의 관리
- `client/src/components/admin/LearningMonitoring.tsx` - 학습 모니터링
- `client/src/components/admin/QAMonitoring.tsx` - Q&A 모니터링

### 👨‍🏫 교사 기능
- `client/src/components/dashboard/TeacherDashboard.tsx` - 교사 대시보드
- `client/src/components/teacher/LectureManagement.tsx` - 강의 관리
- `client/src/components/teacher/MyClassManagement.tsx` - 내 반 관리
- `client/src/components/teacher/EnhancedStudentFeedbackView.tsx` - 학생 피드백
- `client/src/components/teacher/StudentReportGenerator.tsx` - 성적표 생성

### 👨‍🎓 학생 기능
- `client/src/components/dashboard/StudentDashboard.tsx` - 학생 대시보드
- `client/src/components/student/StudentLectureView.tsx` - 강의 수강
- `client/src/components/student/StudentQuestionsView.tsx` - 내 질문 보기

### 📋 공통 기능
- `client/src/components/class/ClassBulletinBoard.tsx` - 반 게시판
- `client/src/components/debug/DataDebugger.tsx` - 데이터 디버거
- `client/src/utils/initializeData.ts` - 초기 데이터 설정
- `client/src/utils/dataStorage.ts` - 데이터 저장 유틸리티

### ⚙️ 설정 파일
- `client/package.json` - 프로젝트 의존성
- `client/vite.config.ts` - Vite 설정
- `client/tsconfig.json` - TypeScript 설정
- `client/src/App.css` - 글로벌 스타일

## 💾 데이터 저장 위치
브라우저의 localStorage에 저장됩니다:
- Chrome: F12 → Application → Local Storage
- 실제 파일 위치: `C:\Users\82103\AppData\Local\Google\Chrome\User Data\Default\Local Storage\`

## 🚀 실행 명령어
```bash
# 프로젝트 폴더로 이동
cd C:\Users\82103\a1-studylink\client

# 개발 서버 실행
npm run dev

# 네트워크 접근 가능하게 실행
npm run dev -- --host

# 프로덕션 빌드
npm run build
```

## 📦 백업 방법
전체 프로젝트를 백업하려면 다음 폴더를 복사:
```
C:\Users\82103\a1-studylink\
```

## 🔧 코드 수정 위치
1. **로그인 페이지 수정**: `client/src/pages/Login.tsx`
2. **관리자 기능 수정**: `client/src/components/admin/` 폴더
3. **교사 기능 수정**: `client/src/components/teacher/` 폴더
4. **학생 기능 수정**: `client/src/components/student/` 폴더
5. **스타일 수정**: `client/src/App.css`

## 📱 현재 실행 중인 서버
- 로컬: http://localhost:3000/
- 네트워크: http://192.168.219.105:3000/