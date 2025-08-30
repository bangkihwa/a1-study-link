# 🚀 Vercel 배포 가이드 (10분 완료)

## Step 1: GitHub에 코드 업로드 (3분)

### 1. GitHub 계정 만들기
- https://github.com 접속
- Sign up 클릭
- 이메일, 비밀번호 입력

### 2. 새 Repository 생성
1. GitHub 로그인 후 우측 상단 + 버튼 → "New repository"
2. Repository 이름: `a1-studylink`
3. Public 선택
4. "Create repository" 클릭

### 3. 코드 업로드
GitHub에서 제공하는 명령어를 복사해서 실행:

```bash
# Git Bash 또는 터미널에서 실행
cd C:/Users/82103/a1-studylink

# GitHub 원격 저장소 연결
git remote add origin https://github.com/YOUR_USERNAME/a1-studylink.git

# main 브랜치로 변경
git branch -M main

# 코드 푸시
git push -u origin main
```

⚠️ GitHub 로그인 창이 뜨면 로그인하세요.

---

## Step 2: Vercel 배포 (5분)

### 1. Vercel 가입
1. https://vercel.com 접속
2. "Sign Up" 클릭
3. "Continue with GitHub" 선택 (GitHub 계정으로 로그인)

### 2. 프로젝트 Import
1. Vercel 대시보드에서 "Add New..." → "Project" 클릭
2. "Import Git Repository" 섹션에서 `a1-studylink` 선택
3. "Import" 클릭

### 3. 빌드 설정 ⚙️
아래 설정을 정확히 입력하세요:

```
Framework Preset: Vite
Root Directory: client (⚠️ 중요: Edit 버튼 클릭 후 'client' 입력)
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 4. 배포
"Deploy" 버튼 클릭!

### 5. 완료! 🎉
- 1-2분 후 배포 완료
- URL 예시: `https://a1-studylink.vercel.app`

---

## Step 3: 테스트 및 공유 (2분)

### 배포된 사이트 확인
1. Vercel 대시보드에서 프로젝트 클릭
2. "Visit" 버튼 클릭
3. 사이트 접속 확인

### 테스트 계정
```
관리자: admin / admin
교사: teacher1 / 1234
학생: hong / 1234
```

### URL 공유
베타 테스터들에게 공유할 링크:
```
https://a1-studylink.vercel.app

또는

https://a1-studylink-YOUR_USERNAME.vercel.app
```

---

## 자동 업데이트 설정 ⚡

### 코드 수정 시 자동 배포
1. 로컬에서 코드 수정
2. Git 커밋 & 푸시:
```bash
git add .
git commit -m "Update features"
git push
```
3. Vercel이 자동으로 감지하고 재배포 (1-2분)

---

## 문제 해결 🔧

### "Root Directory" 설정 안했을 때
- 에러: `package.json not found`
- 해결: Settings → General → Root Directory를 `client`로 설정

### 빌드 실패
- 에러: `npm run build failed`
- 해결: 
  1. 로컬에서 `npm run build` 테스트
  2. 에러 수정 후 다시 푸시

### 404 에러
- 문제: 새로고침 시 404
- 해결: `client/vercel.json` 파일 생성:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

## 도메인 설정 (선택사항)

### 무료 도메인
- Vercel 제공: `a1-studylink.vercel.app`

### 커스텀 도메인
1. Settings → Domains
2. 도메인 입력 (예: `studylink.a1academy.com`)
3. DNS 설정 안내 따르기

---

## 환경 변수 설정 (향후 백엔드 연결 시)

1. Settings → Environment Variables
2. 변수 추가:
```
VITE_API_URL=https://api.example.com
VITE_FIREBASE_KEY=your-key
```

---

## 성능 모니터링

### Analytics (무료)
1. Analytics 탭 클릭
2. Enable Analytics
3. 방문자 수, 성능 지표 확인

### Speed Insights
- Core Web Vitals 확인
- 로딩 속도 최적화 제안

---

## 팀 협업

### 팀원 초대
1. Settings → Team
2. Invite Team Member
3. 이메일 입력

### 브랜치 배포
- `main`: 프로덕션 (a1-studylink.vercel.app)
- `dev`: 개발 (a1-studylink-dev.vercel.app)

---

## 체크리스트 ✅

- [ ] GitHub 계정 생성
- [ ] Repository 생성
- [ ] 코드 업로드
- [ ] Vercel 가입
- [ ] 프로젝트 Import
- [ ] Root Directory를 `client`로 설정
- [ ] Deploy 클릭
- [ ] 사이트 접속 확인
- [ ] 테스트 계정으로 로그인
- [ ] URL 공유

---

## 축하합니다! 🎊

이제 A1 StudyLink가 인터넷에 공개되었습니다!

- 배포 URL: https://a1-studylink.vercel.app
- 관리자 패널: https://a1-studylink.vercel.app/admin
- 상태 확인: https://vercel.com/dashboard

문제가 있으면 Vercel 대시보드의 로그를 확인하세요.