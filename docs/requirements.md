# '에이원 스터디링크' 개발 요구사항 정의서 (v2.0)

**문서 목적**: '에이원 스터디링크' LMS 구축에 필요한 기능 및 비기능 요구사항을 명확히 정의하여 개발팀과 프로젝트 이해관계자 간의 원활한 소통을 지원하는 것을 목적으로 한다.

## 1. 기능 요구사항 (Functional Requirements)

### 1.1. 사용자 및 권한 관리

**REQ-USR-001**: 시스템 사용자는 관리자, 교사, 학생, 학부모 4가지 역할로 구분된다.

**REQ-USR-002**: 관리자는 모든 사용자 계정(교사, 학생, 학부모)의 생성, 정보 수정, 삭제, 가입 승인 권한을 가진다.

**REQ-USR-003**: 각 사용자는 자신의 역할에 맞는 메뉴와 페이지만 접근할 수 있어야 한다.

**REQ-USR-004**: 학부모 계정은 특정 학생 계정과 연동되어야 하며, 해당 학생의 정보만 조회할 수 있다.

**REQ-USR-005**: 기본 관리자 계정은 Docker 환경변수로 관리되어야 한다. (기본값: ID=admin, PW=admin)

### 1.2. 회원가입 및 계정 연동

**REQ-REG-001**: 학생이 회원가입을 완료하면 시스템이 자동으로 8자리 고유번호(Student ID)를 발급해야 한다.

**REQ-REG-002**: 학생 고유번호는 중복되지 않아야 하며, 숫자와 영문 조합으로 생성되어야 한다.

**REQ-REG-003**: 학부모 회원가입 시 자녀의 학생 고유번호를 필수로 입력해야 한다.

**REQ-REG-004**: 학생 고유번호가 유효하지 않거나 이미 다른 학부모와 연동된 경우 회원가입이 거부되어야 한다.

**REQ-REG-005**: 학부모-학생 연동이 완료되면 학부모는 해당 학생의 모든 학습 현황을 조회할 수 있어야 한다.

**REQ-REG-006**: 한 명의 학생은 최대 2명의 학부모와 연동될 수 있어야 한다.

**REQ-REG-007**: 교사 계정은 관리자가 직접 생성하거나 승인해야 한다.

### 1.3. 강의 및 콘텐츠 관리

**REQ-CNT-001**: 관리자는 학원의 과목(예: 중등1 과학, 물리)과 반(예: 중1-A반)을 생성, 수정, 삭제할 수 있다.

**REQ-CNT-002**: 교사는 자신이 담당하는 반의 강의를 생성, 수정, 삭제할 수 있다.

**REQ-CNT-003**: 강의는 '콘텐츠 블록'의 집합으로 구성된다.

**REQ-CNT-004**: 콘텐츠 블록은 최소 다음 유형을 지원해야 한다: YouTube 동영상 URL 삽입, 온라인 테스트, 마인드맵 URL 삽입.

**REQ-CNT-005**: 교사는 강의 내 콘텐츠 블록의 순서를 자유롭게 변경할 수 있어야 한다.

### 1.4. YouTube 동영상 시청 추적

**REQ-VID-001**: YouTube 동영상은 IFrame Player API를 사용하여 웹사이트 내에서 재생되어야 한다.

**REQ-VID-002**: 시스템은 학생의 동영상 시청 시간을 실시간으로 추적하고 데이터베이스에 저장해야 한다.

**REQ-VID-003**: 동영상 길이의 95% 이상 시청 시 해당 블록을 자동으로 '완료' 상태로 변경해야 한다.

**REQ-VID-004**: 교사는 학생별 동영상 시청 진도를 대시보드에서 모니터링할 수 있어야 한다.

**REQ-VID-005**: 동영상 시청 데이터는 다음을 포함해야 한다: 시청 시간(초), 총 영상 길이(초), 진도율(%), 완료 여부, 마지막 시청 시간.

### 1.5. 온라인 테스트 빌더

**REQ-TST-001**: 교사는 '테스트 만들기' 기능에 접근할 수 있어야 한다.

**REQ-TST-002**: O/X 유형 문제 출제를 지원해야 한다. (입력 필드: 문제 내용, 정답(O/X), 정답 풀이)

**REQ-TST-003**: 단답형 유형 문제 출제를 지원해야 한다. (입력 필드: 문제 내용, 정답)  
시스템은 정답 문자열과 학생 답안이 일치할 경우 자동으로 채점한다.

**REQ-TST-004**: 5지선다 객관식 유형 문제 출제를 지원해야 한다. (입력 필드: 문제 내용, 5개의 선택지 내용, 정답, 정답 풀이)

**REQ-TST-005**: 서술형 유형 문제 출제를 지원해야 한다. (입력 필드: 문제 내용, 모범 답안)  
서술형 문제는 교사가 직접 채점해야 한다.

**REQ-TST-006**: 학생이 테스트를 제출하면 답안이 시스템에 저장되어야 한다.

**REQ-TST-007**: 교사는 학생의 답안을 확인하고 채점(서술형) 후, 결과를 '공개' 처리할 수 있다.

**REQ-TST-008**: 학생은 결과가 공개된 이후에만 자신의 점수, 정답, 문제 풀이를 확인할 수 있다.

### 1.6. 학습 활동 및 리포트

**REQ-ACT-001**: 학생은 동영상 시청, 테스트 응시 등 각 학습 활동을 완료하면 '완료' 상태로 직접 변경할 수 있어야 한다.

**REQ-ACT-002**: 시스템은 다음 공식으로 학습 진도율을 자동 계산해야 한다:  
`진도율 = (완료한 콘텐츠 블록 수 / 전체 콘텐츠 블록 수) × 100`

**REQ-ACT-003**: 학생은 강의별로 질문을 등록할 수 있으며, 이 질문은 해당 반의 담당 교사에게 전달되어야 한다.

**REQ-ACT-004**: 교사는 학생의 질문에 답변을 등록할 수 있다.

**REQ-ACT-005**: 교사는 기간을 설정하여 특정 학생의 학습 리포트를 생성할 수 있어야 한다.

**REQ-ACT-006**: 리포트에는 기간 내 학습 진행률, 동영상 시청 현황, 테스트 성적, Q&A 내역이 포함되어야 한다.

**REQ-ACT-007**: 생성된 리포트는 PDF로 저장 및 출력이 가능해야 한다.

### 1.7. 알림 시스템

**REQ-NOT-001**: 웹사이트 헤더 영역에 알림 아이콘이 존재해야 한다.

**REQ-NOT-002**: 읽지 않은 새 알림이 있을 경우, 아이콘에 숫자로 표시되어야 한다.

**REQ-NOT-003**: 아이콘 클릭 시, 읽지 않은 알림 목록이 표시되어야 한다. (알림 종류: 새 과제, Q&A 답변, 공지 등)

**REQ-NOT-004**: 확인한 알림은 '알림 보관함' 페이지에서 과거 내역을 조회할 수 있어야 한다.

## 2. 비기능 요구사항 (Non-Functional Requirements)

**REQ-NF-001 (사용성)**: 모든 사용자가 최소한의 교육만으로 시스템을 쉽게 사용할 수 있도록 직관적인 UI/UX를 제공해야 한다.

**REQ-NF-002 (성능)**: 페이지 로딩 시간은 평균 3초 이내여야 한다.

**REQ-NF-003 (호환성)**: 최신 버전의 Chrome, Safari, Edge 브라우저에서 모든 기능이 정상적으로 동작해야 한다.

**REQ-NF-004 (모바일 지원)**: 모바일 디바이스(스마트폰, 태블릿)에서 웹 서비스를 정상적으로 이용할 수 있도록 반응형 웹 디자인을 적용해야 한다.

**REQ-NF-005 (확장성)**: 30명 규모의 동시 접속자를 안정적으로 처리할 수 있어야 한다.

**REQ-NF-006 (기술 스택)**: 다음 기술 스택을 사용해야 한다:
- 프론트엔드: React + TypeScript
- 백엔드: Node.js + Express.js  
- 데이터베이스: MySQL
- 인프라: Docker 컨테이너 기반
- 스타일링: Tailwind CSS (반응형 웹용)

## 3. 데이터베이스 설계 요구사항

### 3.1 핵심 테이블 구조

**users 테이블** (사용자 기본 정보):
- id (사용자 ID, Primary Key)
- username (로그인 ID)
- password (암호화된 비밀번호)
- role (역할: admin/teacher/student/parent)
- name (실명)
- email (이메일)
- created_at, updated_at

**students 테이블** (학생 전용 정보):
- user_id (users 테이블 외래키)
- student_number (8자리 고유번호, UNIQUE)
- grade (학년)
- class_id (반 ID)

**parent_student_relations 테이블** (학부모-학생 연결):
- parent_id (학부모 user_id)
- student_id (학생 user_id)
- relationship (관계: father/mother/guardian)
- created_at

**video_progress 테이블**:
- student_id (학생 ID)
- video_block_id (동영상 블록 ID)  
- watched_duration (시청 시간, 초)
- total_duration (총 영상 길이, 초)
- progress_percentage (진도율, %)
- is_completed (완료 여부)
- last_watched_at (마지막 시청 시간)

**학습 활동 로그 테이블**:
- 학생별, 날짜별 학습 활동 추적용
- 진도율 계산 및 리포트 생성용

## 4. 외부 연동 요구사항

**REQ-EXT-001**: YouTube IFrame Player API와 연동하여 동영상 재생 상태를 추적해야 한다.

**REQ-EXT-002**: 임베드가 제한된 YouTube 동영상에 대한 오류 처리 방안을 구현해야 한다.

**REQ-EXT-003**: 외부 마인드맵 서비스 URL을 안전하게 임베드할 수 있어야 한다.

## 5. 개발 및 배포 요구사항

**REQ-DEV-001**: Docker 컨테이너로 개발, 테스트, 프로덕션 환경을 동일하게 유지해야 한다.

**REQ-DEV-002**: 로컬 서버 환경에서 안정적으로 동작해야 한다.

**REQ-DEV-003**: 코드 버전 관리 시스템(Git)을 사용하여 개발 이력을 관리해야 한다.

**REQ-DEV-004**: 단위 테스트 및 통합 테스트 코드를 작성해야 한다.

**REQ-DEV-005**: docker-compose.yml에 관리자 계정 정보를 환경변수로 설정해야 한다.
```yaml
environment:
  - ADMIN_USERNAME=admin
  - ADMIN_PASSWORD=admin
```

## 6. YouTube API 연동 상세 요구사항

### 6.1 동영상 시청 추적 구현

```javascript
// YouTube IFrame Player API 활용 예시
player.addEventListener('onStateChange', function(event) {
  // 재생, 일시정지, 종료 상태 감지
  if (event.data === YT.PlayerState.ENDED) {
    // 영상 완료 시 자동으로 DB에 완료 상태 저장
  }
});

// 현재 재생 위치와 총 영상 길이 비교
setInterval(() => {
  const currentTime = player.getCurrentTime();
  const duration = player.getDuration();
  const progress = (currentTime / duration) * 100;
  
  // 80% 이상 시청 시 완료로 처리
  if (progress >= 80) {
    markAsCompleted();
  }
}, 10000); // 10초마다 체크
```

### 6.2 회원가입 및 계정 연동 스키마

```sql
-- 사용자 기본 정보 테이블
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 학생 전용 정보 테이블
CREATE TABLE students (
  user_id INT PRIMARY KEY,
  student_number VARCHAR(8) UNIQUE NOT NULL,
  grade INT,
  class_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_number (student_number)
);

-- 학부모-학생 연결 테이블
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

-- 학생 고유번호 생성 함수 (8자리 영숫자 조합)
-- 예시: A1B2C3D4, ST123456 등
```

### 6.3 시청 데이터 저장 스키마

```sql
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
  INDEX idx_student_video (student_id, video_block_id),
  INDEX idx_progress (progress_percentage),
  INDEX idx_completed (is_completed)
);
```

## 7. 개발 우선순위

### Phase 1 (필수 기능)
1. 사용자 인증 및 권한 관리 시스템
2. 학생 고유번호 발급 및 회원가입 시스템
3. 학부모-학생 계정 연동 시스템
4. 기본 강의 및 콘텐츠 블록 관리
5. YouTube 동영상 임베드 및 기본 재생
6. Docker 환경변수 기반 admin 계정 설정

### Phase 2 (핵심 기능)
1. YouTube 시청 추적 시스템
2. 온라인 테스트 빌더 (4가지 유형)
3. 학습 진도율 계산 및 표시

### Phase 3 (고급 기능)
1. 학습 리포트 생성 및 PDF 출력
2. Q&A 시스템
3. 통합 알림 시스템

### Phase 4 (최적화)
1. 모바일 반응형 UI/UX 개선
2. 성능 최적화
3. 테스트 및 배포 자동화
