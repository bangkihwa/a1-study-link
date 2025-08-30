# 구글 드라이브를 활용한 웹 호스팅 방법

## ❌ 구글 드라이브의 한계

### 직접 호스팅 불가능한 이유:
1. **2016년부터 웹 호스팅 중단** - 보안상의 이유로 Google이 차단
2. **JavaScript 실행 불가** - React 앱 작동 안됨
3. **CORS 정책** - 외부 리소스 접근 제한
4. **URL 구조** - 깔끔한 URL 불가능

---

## ✅ 대체 방법들

### 방법 1: 구글 드라이브 + GitHub Pages (무료)

```mermaid
구글 드라이브 (데이터 저장) <-> GitHub Pages (React 앱) <-> 사용자
```

#### 구현 방법:
1. **GitHub Pages에 React 앱 배포**
2. **구글 드라이브를 데이터베이스로 활용**
3. **Google Sheets API 연동**

```javascript
// Google Sheets를 데이터베이스로 사용
const SHEET_ID = 'your-sheet-id';
const API_KEY = 'your-api-key';

async function loadData() {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1?key=${API_KEY}`
  );
  const data = await response.json();
  return data.values;
}

async function saveData(data) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1:append?valueInputOption=RAW&key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: data })
    }
  );
  return response.json();
}
```

---

### 방법 2: Google Apps Script (GAS) 백엔드

#### 1단계: Apps Script 프로젝트 생성
```javascript
// code.gs
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getStudents') {
    return ContentService.createTextOutput(
      JSON.stringify(getStudents())
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  if (data.action === 'addStudent') {
    addStudent(data.student);
    return ContentService.createTextOutput(
      JSON.stringify({success: true})
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getStudents() {
  const sheet = SpreadsheetApp.openById('SHEET_ID').getSheetByName('Students');
  const data = sheet.getDataRange().getValues();
  return data;
}

function addStudent(student) {
  const sheet = SpreadsheetApp.openById('SHEET_ID').getSheetByName('Students');
  sheet.appendRow([student.name, student.email, student.class]);
}
```

#### 2단계: 웹 앱으로 배포
1. 배포 → 새 배포
2. 유형: 웹 앱
3. 액세스: 모든 사용자
4. URL 생성됨: `https://script.google.com/macros/s/xxx/exec`

#### 3단계: React에서 호출
```javascript
// React 컴포넌트에서
const GAS_URL = 'https://script.google.com/macros/s/xxx/exec';

const fetchStudents = async () => {
  const response = await fetch(`${GAS_URL}?action=getStudents`);
  const data = await response.json();
  setStudents(data);
};

const addStudent = async (student) => {
  await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'addStudent', student })
  });
};
```

---

### 방법 3: Google Firebase (권장) 🔥

**무료 티어:**
- Firestore: 1GB 저장소
- 일일 50,000 읽기, 20,000 쓰기
- Hosting: 10GB 저장소, 360MB/일 전송
- Authentication: 무제한 사용자

#### 설정:
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login

# 프로젝트 초기화
firebase init

# 배포
firebase deploy
```

#### React에서 사용:
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

---

## 📊 비교표

| 방법 | 비용 | 난이도 | 성능 | 제한사항 |
|------|------|--------|------|----------|
| Google Drive 직접 | ❌ 불가능 | - | - | JavaScript 실행 불가 |
| Drive + Sheets API | 무료 | 중간 | 낮음 | API 할당량 제한 |
| Google Apps Script | 무료 | 쉬움 | 중간 | 실행 시간 6분 제한 |
| Firebase | 무료~유료 | 쉬움 | 높음 | 무료 할당량 제한 |
| GitHub Pages + Sheets | 무료 | 중간 | 중간 | 정적 사이트만 |

---

## 🎯 A1 StudyLink에 적용하기

### 옵션 1: Google Sheets 데이터베이스 (간단)

1. **Google Sheets 생성**
   - 학생 시트
   - 교사 시트
   - 강의 시트
   - 질문답변 시트

2. **API 연동 코드 추가**
```javascript
// utils/googleSheets.js
const SHEET_ID = 'YOUR_SHEET_ID';
const API_KEY = 'YOUR_API_KEY';
const SHEETS = {
  users: 'Users!A:F',
  classes: 'Classes!A:H',
  lectures: 'Lectures!A:J'
};

export const loadFromSheets = async (sheetName) => {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEETS[sheetName]}?key=${API_KEY}`
  );
  const data = await response.json();
  
  // 첫 행을 키로, 나머지를 데이터로 변환
  const headers = data.values[0];
  const rows = data.values.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
};

export const saveToSheets = async (sheetName, data) => {
  // Google Apps Script 웹 앱 호출
  const GAS_URL = 'YOUR_GAS_WEB_APP_URL';
  await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({
      sheet: sheetName,
      data: data
    })
  });
};
```

3. **localStorage 대체**
```javascript
// 기존 코드
localStorage.setItem('users', JSON.stringify(users));

// 새 코드
await saveToSheets('users', users);
```

### 옵션 2: Firebase 전체 마이그레이션 (권장)

1. **Firebase 프로젝트 생성**
2. **Firestore 데이터베이스 구조**
```
/users
  /{userId}
    - name
    - email
    - role
    - status

/classes
  /{classId}
    - name
    - teacherIds
    - studentIds

/lectures
  /{lectureId}
    - title
    - content
    - classId
```

3. **배포**
```bash
firebase deploy --only hosting
```

---

## 📝 결론

### 구글 드라이브만으로는 ❌
- 직접 서버로 사용 불가
- JavaScript 실행 불가

### 구글 서비스 조합으로는 ✅
- Google Sheets + GitHub Pages
- Google Apps Script 백엔드
- Firebase (구글 서비스)

### 추천 방법 🎯
1. **즉시 테스트**: 현재 노트북 서버
2. **베타 배포**: Vercel + Google Sheets API
3. **정식 운영**: Firebase

구글 드라이브를 데이터 저장소로 활용하면서 GitHub Pages나 Vercel에 호스팅하는 하이브리드 방식이 가장 현실적입니다!