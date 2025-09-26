-- 사용자 기본 정보
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  is_approved BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_username (username),
  INDEX idx_email (email)
);

-- 과목 관리
CREATE TABLE IF NOT EXISTS subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  grade_level INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_grade (grade_level)
);

-- 반 관리
CREATE TABLE IF NOT EXISTS classes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT,
  grade_level INT,
  max_students INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  INDEX idx_subject (subject_id),
  INDEX idx_teacher (teacher_id)
);

-- 학생 전용 정보
CREATE TABLE IF NOT EXISTS students (
  user_id INT PRIMARY KEY,
  student_number VARCHAR(8) UNIQUE NOT NULL,
  grade INT,
  class_id INT,
  enrollment_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  INDEX idx_student_number (student_number),
  INDEX idx_class (class_id)
);

-- 학부모-학생 연결
CREATE TABLE IF NOT EXISTS parent_student_relations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parent_id INT NOT NULL,
  student_id INT NOT NULL,
  student_code VARCHAR(16) NOT NULL,
  relationship ENUM('father', 'mother', 'guardian') DEFAULT 'guardian',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_parent_student (parent_id, student_id),
  INDEX idx_parent (parent_id),
  INDEX idx_student (student_id)
);

-- 강의 관리
CREATE TABLE IF NOT EXISTS courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  class_id INT NOT NULL,
  teacher_id INT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_class (class_id),
  INDEX idx_teacher (teacher_id)
);

-- 기존 테이블이 있다면 컬럼을 수정
-- ALTER TABLE courses
-- MODIFY COLUMN teacher_id INT NULL,
-- DROP FOREIGN KEY courses_ibfk_2,
-- ADD CONSTRAINT courses_ibfk_2 FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL;

-- 강의별 학생 배정
CREATE TABLE IF NOT EXISTS course_students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  student_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_course_student (course_id, student_id),
  INDEX idx_course_student (course_id, student_id)
);

-- 반별 학생 배정 (다대다 지원)
CREATE TABLE IF NOT EXISTS class_students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  class_id INT NOT NULL,
  student_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_class_student (class_id, student_id),
  INDEX idx_class_student (class_id, student_id)
);

-- 콘텐츠 블록
CREATE TABLE IF NOT EXISTS content_blocks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  type ENUM('video', 'test', 'mindmap', 'text') NOT NULL,
  title VARCHAR(200) NOT NULL,
  content JSON NOT NULL,
  order_index INT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course_order (course_id, order_index)
);

-- 동영상 시청 진도
CREATE TABLE IF NOT EXISTS video_progress (
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
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (video_block_id) REFERENCES content_blocks(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_video (student_id, video_block_id),
  INDEX idx_student (student_id),
  INDEX idx_progress (progress_percentage),
  INDEX idx_completed (is_completed)
);

-- 테스트 관리
CREATE TABLE IF NOT EXISTS tests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  teacher_id INT NOT NULL,
  time_limit INT,
  total_score INT DEFAULT 100,
  due_date DATE,
  class_id INT,
  is_published BOOLEAN DEFAULT FALSE,
  publish_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  INDEX idx_due_date (due_date),
  INDEX idx_teacher (teacher_id)
);

-- 교사 일정 및 테스트 마감 등 캘린더 이벤트
CREATE TABLE IF NOT EXISTS calendar_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_type ENUM('test_deadline', 'teacher_schedule') NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  class_id INT,
  test_id INT,
  teacher_id INT,
  visibility ENUM('teacher_only', 'class') NOT NULL DEFAULT 'class',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE SET NULL,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_calendar_date (start_date, end_date),
  INDEX idx_calendar_type (event_type)
);

-- 테스트 문제
CREATE TABLE IF NOT EXISTS test_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_id INT NOT NULL,
  type ENUM('ox', 'short_answer', 'multiple_choice', 'essay') NOT NULL,
  question_text TEXT NOT NULL,
  question_data JSON NOT NULL,
  points INT DEFAULT 10,
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  INDEX idx_test_order (test_id, order_index)
);

-- 테스트 제출
CREATE TABLE IF NOT EXISTS test_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_id INT NOT NULL,
  student_id INT NOT NULL,
  answers JSON NOT NULL,
  score DECIMAL(5,2),
  is_graded BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  graded_at TIMESTAMP NULL,
  FOREIGN KEY (test_id) REFERENCES tests(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  UNIQUE KEY unique_test_student (test_id, student_id),
  INDEX idx_test (test_id),
  INDEX idx_student (student_id)
);

-- Q&A 시스템
CREATE TABLE IF NOT EXISTS qna (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  student_id INT NOT NULL,
  question TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  answer TEXT,
  teacher_id INT,
  answered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  INDEX idx_course (course_id),
  INDEX idx_student (student_id)
);

-- 알림 시스템
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('assignment', 'answer', 'grade', 'announcement', 'class_change', 'course_change') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_created (created_at)
);

-- 학습 활동 로그
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  activity_type ENUM('video_watch', 'test_complete', 'question_ask', 'login') NOT NULL,
  related_id INT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_date (student_id, created_at),
  INDEX idx_type (activity_type)
);

-- 시스템 설정 저장 테이블
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO system_settings (setting_key, setting_value)
VALUES
  ('allowRegistrations', JSON_OBJECT('value', TRUE)),
  ('maintenanceMode', JSON_OBJECT('value', FALSE)),
  ('supportEmail', JSON_OBJECT('value', 'support@a1studylink.com')),
  ('apiRateLimit', JSON_OBJECT('value', 100))
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- 관리자 계정은 백엔드 애플리케이션에서 환경변수를 통해 동적으로 생성됩니다
-- ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_EMAIL 환경변수 사용

-- 애플리케이션 접속 계정 생성
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'mysql';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

CREATE USER IF NOT EXISTS 'a1_app'@'%' IDENTIFIED BY 'mysql';
GRANT ALL PRIVILEGES ON a1_studylink.* TO 'a1_app'@'%';
FLUSH PRIVILEGES;

