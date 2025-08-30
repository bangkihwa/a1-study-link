# A1 StudyLink 배포 가이드

## 1. Vercel로 배포하기 (추천)

### 준비사항
1. GitHub 계정
2. Vercel 계정 (GitHub로 로그인 가능)

### 배포 단계

#### Step 1: GitHub에 코드 업로드
```bash
# 프로젝트 루트에서
git init
git add .
git commit -m "Initial commit - A1 StudyLink Beta"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/a1-studylink.git
git push -u origin main
```

#### Step 2: Vercel 배포
1. [Vercel](https://vercel.com) 접속
2. "New Project" 클릭
3. GitHub 레포지토리 연결
4. 프로젝트 설정:
   - Framework Preset: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. "Deploy" 클릭

배포 후 URL: `https://a1-studylink.vercel.app`

---

## 2. Netlify로 배포하기 (무료)

### 배포 단계
1. [Netlify](https://www.netlify.com) 접속
2. GitHub 계정으로 로그인
3. "New site from Git" 선택
4. 설정:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/dist`
5. Deploy 클릭

---

## 3. GitHub Pages로 배포하기 (무료)

### vite.config.ts 수정
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/a1-studylink/', // GitHub 레포지토리 이름
})
```

### package.json에 추가
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### 배포
```bash
npm install --save-dev gh-pages
npm run deploy
```

URL: `https://YOUR_USERNAME.github.io/a1-studylink`

---

## 4. 로컬 네트워크에서 테스트 (즉시 가능)

### 같은 와이파이에서 테스트
```bash
# client 폴더에서
npm run dev -- --host

# 출력 예시:
# Local: http://localhost:3000/
# Network: http://192.168.1.100:3000/  <- 이 주소를 공유
```

다른 기기(스마트폰, 태블릿, 다른 컴퓨터)에서 Network URL로 접속 가능

---

## 베타 테스트 준비 사항

### 1. 테스트 계정 정보
```
관리자: admin / admin
교사: teacher1 / 1234
학생: hong / 1234
```

### 2. 테스트 시나리오
- [ ] 회원가입 및 로그인
- [ ] 관리자: 사용자 관리, 반 관리, 강의 관리
- [ ] 교사: 강의 생성, 학생 관리, 성적표 생성
- [ ] 학생: 강의 수강, 질문하기, 과제 제출
- [ ] 실시간 데이터 동기화 확인
- [ ] 모바일 반응형 테스트

### 3. 피드백 수집 방법
- Google Forms 설문지 생성
- 이메일: feedback@a1academy.com
- 카카오톡 오픈채팅
- GitHub Issues (개발자용)

### 4. 알려진 제한사항
- 데이터는 브라우저 localStorage에 저장 (서버 없음)
- 브라우저별로 데이터가 독립적
- 시크릿 모드에서는 데이터 저장 안됨
- 브라우저 캐시 삭제 시 데이터 초기화

### 5. 베타 테스트 안내문
```
🔬 A1 StudyLink 베타 테스트에 참여해주셔서 감사합니다!

이 시스템은 현재 베타 버전으로, 다음과 같은 특징이 있습니다:
- 모든 데이터는 브라우저에 저장됩니다
- 실제 학원 운영에는 아직 사용하지 마세요
- 버그나 개선사항을 발견하시면 알려주세요

테스트 URL: https://a1-studylink.vercel.app
테스트 기간: 2025년 1월 1일 ~ 1월 31일
```

---

## 프로덕션 준비 (향후)

### 필요한 추가 작업
1. **백엔드 서버 구축**
   - Node.js + Express 또는 Python FastAPI
   - 데이터베이스 (PostgreSQL/MySQL)
   - 인증 시스템 (JWT)

2. **보안 강화**
   - HTTPS 적용
   - 비밀번호 암호화
   - API 보안

3. **성능 최적화**
   - 코드 스플리팅
   - 이미지 최적화
   - 캐싱 전략

4. **추가 기능**
   - 이메일 알림
   - 파일 업로드
   - 실시간 채팅
   - 모바일 앱

---

## 문의사항
- 이메일: dev@a1academy.com
- GitHub: https://github.com/YOUR_USERNAME/a1-studylink