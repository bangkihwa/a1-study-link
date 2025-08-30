# 노트북을 임시 서버로 사용하기

## 방법 1: ngrok으로 인터넷에 공개하기 (무료)

### 1단계: ngrok 설치
1. https://ngrok.com 접속
2. 회원가입 (무료)
3. Windows용 ngrok 다운로드
4. C:\ngrok\ 폴더에 압축 해제

### 2단계: ngrok 설정
```bash
# ngrok 인증 (회원가입 후 대시보드에서 토큰 확인)
ngrok authtoken YOUR_AUTH_TOKEN
```

### 3단계: 서버 시작
```bash
# 터미널 1: React 앱 실행
cd C:\Users\82103\a1-studylink\client
npm run dev

# 터미널 2: ngrok 터널 열기
ngrok http 3000
```

### 4단계: 공개 URL 확인
```
ngrok 실행 결과:
Forwarding: https://abc123.ngrok.io → http://localhost:3000

이제 전 세계에서 접속 가능:
https://abc123.ngrok.io
```

### 장점
- ✅ 전 세계 어디서나 접속 가능
- ✅ HTTPS 자동 지원
- ✅ 무료 사용 가능
- ✅ 방화벽 설정 불필요

### 단점
- ❌ 무료 버전은 URL이 매번 바뀜
- ❌ 세션당 8시간 제한 (무료)
- ❌ 동시 접속자 40명 제한 (무료)

---

## 방법 2: 포트포워딩 (공유기 설정)

### 1단계: 내부 IP 고정
1. Windows 설정 → 네트워크 → Wi-Fi → 속성
2. IP 할당: 수동
3. IP 주소: 192.168.219.105
4. 서브넷: 255.255.255.0
5. 게이트웨이: 192.168.219.1

### 2단계: 공유기 관리 페이지 접속
```
http://192.168.219.1
또는
http://192.168.0.1
```
- KT: homehub / kttelecop
- SKT: admin / admin
- LG U+: admin / admin

### 3단계: 포트포워딩 설정
1. 고급설정 → NAT/포트포워딩
2. 새 규칙 추가:
   - 외부 포트: 3000
   - 내부 IP: 192.168.219.105
   - 내부 포트: 3000
   - 프로토콜: TCP

### 4단계: 외부 IP 확인
```
https://whatismyipaddress.com
예: 123.456.789.012
```

### 5단계: 접속
```
http://123.456.789.012:3000
```

---

## 방법 3: Cloudflare Tunnel (고급)

### 장점
- ✅ 고정 도메인
- ✅ 무료
- ✅ DDoS 방어
- ✅ SSL 자동

### 설치
```bash
# Cloudflare Tunnel 설치
winget install Cloudflare.cloudflared

# 로그인
cloudflared tunnel login

# 터널 생성
cloudflared tunnel create studylink

# 설정 파일 생성
cloudflared tunnel route dns studylink studylink.example.com

# 실행
cloudflared tunnel run studylink
```

---

## 서버 자동 시작 설정

### PM2로 프로세스 관리
```bash
# PM2 설치
npm install -g pm2

# 앱 시작
cd C:\Users\82103\a1-studylink\client
pm2 start "npm run dev" --name studylink

# 시작 프로그램 등록
pm2 startup
pm2 save

# 상태 확인
pm2 status

# 로그 보기
pm2 logs studylink

# 재시작
pm2 restart studylink

# 중지
pm2 stop studylink
```

---

## 성능 최적화

### 프로덕션 모드로 실행
```bash
# 빌드
cd C:\Users\82103\a1-studylink\client
npm run build

# serve로 실행 (더 빠름)
npm install -g serve
serve -s dist -p 3000
```

### 또는 Express 서버 사용
```javascript
// server.js
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 노트북 서버 체크리스트

### 하드웨어 요구사항
- ✅ RAM: 최소 4GB (8GB 권장)
- ✅ 저장공간: 10GB 이상
- ✅ 인터넷: 안정적인 연결

### 설정 확인
- [ ] Windows 방화벽에서 포트 3000 허용
- [ ] 절전 모드 해제
- [ ] 자동 업데이트 비활성화
- [ ] 백신 프로그램 예외 처리

### Windows 방화벽 설정
```bash
# 관리자 권한 PowerShell
New-NetFirewallRule -DisplayName "StudyLink" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 절전 모드 방지
```bash
# 전원 설정
powercfg /change standby-timeout-ac 0
powercfg /change standby-timeout-dc 0
powercfg /change monitor-timeout-ac 0
powercfg /change monitor-timeout-dc 0
```

---

## 보안 주의사항 ⚠️

1. **임시 사용만**: 장기간 서버로 사용하지 마세요
2. **백업**: 정기적으로 데이터 백업
3. **모니터링**: 접속 로그 확인
4. **비밀번호**: 강력한 비밀번호 사용
5. **업데이트**: 보안 패치 적용

---

## 추천 순서

### 초보자
1. ngrok 사용 (가장 쉬움)
2. 테스트 완료 후 Vercel 배포

### 중급자
1. 포트포워딩 설정
2. PM2로 프로세스 관리
3. 도메인 연결 (선택)

### 전문가
1. Cloudflare Tunnel
2. Docker 컨테이너화
3. 실제 서버로 이전