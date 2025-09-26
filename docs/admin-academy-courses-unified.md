# 관리자 학원/강의 통합 관리 페이지

경로
- /admin/academy-courses
- 기존 경로 리다이렉션
  - /admin/academy → /admin/academy-courses
  - /admin/courses → /admin/academy-courses

구성
- 탭 전환형 단일 페이지 (과목 · 반 · 강의)
  - **과목 탭**: 과목 CRUD + 활성/비활성 토글 유지
  - **반 탭**
    - 좌측: 반 기본 정보 폼(과목·강사·정원·상태) + 저장/취소 제어
    - 우측: `ClassAssignmentPanel` – 학생 필터, 검색, 가상 스크롤 리스트, 일괄 선택/해제, 미배정 안내
    - 하단: 반 KPI 카드(운영 중/전체, 배정 인원/정원, 미배정 학생) + 학생 수 포함 목록 테이블
  - **강의 탭**: 강의 요약(추후 확장 예정) — 현재는 안내 카드/데이터 프레임 준비 상태

데이터 소스(API)
- 과목
  - GET /admin/subjects?includeInactive=true|false
  - POST /admin/subjects
  - PUT /admin/subjects/:id
  - DELETE /admin/subjects/:id (아카이브)
- 반
  - GET /admin/classes?includeInactive=true|false
    - 응답 항목에 `studentCount` 포함 (클래스·학생 매핑 + 레거시 students.class_id 기반 집계)
  - POST /admin/classes
  - PUT /admin/classes/:id
  - DELETE /admin/classes/:id (아카이브)
- 학생 배정 패널
  - GET /courses/assignable-students (관리자/교사 공용) — classIds, classNames 배열 데이터 활용
  - GET /admin/classes/:id/students — 선택된 반의 현재 학생 배정 목록
- 교사
  - GET /admin/users?role=teacher&status=all
- 강의
  - GET /admin/courses
  - POST /courses
  - PUT /courses/:id
  - DELETE /courses/:id
  - PATCH /courses/:id/publish
  - GET /courses/:id/manage
  - 콘텐츠 블록 CRUD/정렬: POST/PUT/DELETE/PUT(reorder)

- 탭 진입 시 해당 도메인 데이터 우선 로딩, 공용 데이터(교사, 학생 풀, 활성 과목) 메모이즈
- 반 탭 학생 패널은 200+ 학생을 고려해 `react-window` 기반 가상 스크롤 + 필터 세그먼트 제공
- 폼 제출 성공 시 반 리스트와 KPI만 부분 갱신, 학생 풀은 필요 시 재조회
- 비활성 상태 안내(학생 패널 비활성 사유, 과목/반 비활성 라벨)로 운영자 실수 방지

알림/실시간 반영 연계
- 관리자 변경(반/강의) → NotificationService 트리거 → 헤더 15초 폴링/브로드캐스트 → 교사 대시보드 및 교사 강의 목록 화면 재조회
- 테스트 결과 공개 시(즉시 공개/나중 공개) → 학생 알림 생성

QA 체크리스트
1) 과목/반
- [ ] 과목 생성/수정/비활성화(아카이브) 시 목록 갱신 및 피드백 메시지 확인
- [ ] 반 생성/수정/비활성화(아카이브) 시 KPI 카드 수치와 목록 `studentCount`가 즉시 갱신되는지 확인
- [ ] 학생 배정 패널: 필터/검색/가상 스크롤, 일괄 선택/해제, 비활성 메시지 동작 확인
- [ ] 반에 교사 배정/변경/해제 시 관리자 화면 저장 성공 및 담당 교사 알림 생성 확인(교사 계정에서 배지/목록 반영)
- [ ] 학생 배정 변경 후 `/courses/assignable-students` 재조회 결과와 반 상세 학생 목록 일치 확인

2) 강의
- [ ] 강의 생성/수정/삭제/공개 토글 시 목록/상세 갱신 및 피드백 메시지 확인
- [ ] 강의 공개 상태 변경 시 담당 교사에게 알림 생성 확인
- [ ] 강의 콘텐츠 블록 추가/수정/삭제/순서 변경 시 상세 화면 및 목록 정보 일관성 확인

3) 실시간 반영
- [ ] 관리자에서 반/강의 편집 후 교사 헤더 배지 15초 이내 갱신
- [ ] 교사 대시보드/강의 페이지 포커스·가시성 전환/브로드캐스트 이벤트 수신으로 재조회 수행
- [ ] 교사 페이지 수동 새로고침 버튼 동작(↻) 확인

4) 권한/에러 처리
- [ ] 관리자 전용 경로/메뉴 접근 보호(ProtectedRoute)
- [ ] 토큰 만료/401 시 로그인 페이지로 유도
- [ ] API 실패 시 사용자 메시지(에러/피드백) 노출

문서 변경 내역
- 2025-09-23: 초안 작성(탭형 통합, API 목록, QA 체크리스트 추가)
- 2025-10-05: 반 탭 리디자인 반영(학생 배정 패널·KPI, 신규 API 의존성, QA 보완)
