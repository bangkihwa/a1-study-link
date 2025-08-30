-- A1 과학학원 스터디링크 데이터베이스 스키마

-- 사용자 역할 enum
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');

-- 과목 enum
CREATE TYPE subject_type AS ENUM (
    'middle_prep',      -- 중선
    'middle_1',         -- 중등1
    'middle_2',         -- 중등2
    'middle_3',         -- 중등3
    'integrated_science', -- 통합과학
    'physics',          -- 물리
    'chemistry',        -- 화학
    'biology',          -- 생명
    'earth_science'     -- 지구과학
);

-- 콘텐츠 타입 enum
CREATE TYPE content_type AS ENUM ('video', 'ox_test', 'smo_test', 'mindmap', 'assignment');

-- 1. 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    is_approved BOOLEAN DEFAULT FALSE,  -- 관리자 승인 여부
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 반(클래스) 테이블
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject subject_type NOT NULL,
    teacher_id INTEGER REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 반-학생 연결 테이블
CREATE TABLE class_students (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, student_id)
);

-- 4. 학부모-학생 연결 테이블
CREATE TABLE parent_students (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    relationship VARCHAR(20) DEFAULT '부모',
    UNIQUE(parent_id, student_id)
);

-- 5. 강의 테이블
CREATE TABLE lectures (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    class_id INTEGER REFERENCES classes(id),
    teacher_id INTEGER REFERENCES users(id),
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 강의 콘텐츠 테이블
CREATE TABLE lecture_contents (
    id SERIAL PRIMARY KEY,
    lecture_id INTEGER REFERENCES lectures(id) ON DELETE CASCADE,
    type content_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    content_url TEXT,  -- YouTube URL, CodePen URL, 마인드맵 URL 등
    content_data JSONB,  -- OX 테스트 문제/답 등 구조화된 데이터
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 학생 강의 진행 상황
CREATE TABLE student_lecture_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    lecture_id INTEGER REFERENCES lectures(id),
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP,
    study_time_minutes INTEGER DEFAULT 0,
    replay_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, lecture_id)
);

-- 8. 학생 콘텐츠 진행 상황
CREATE TABLE student_content_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    content_id INTEGER REFERENCES lecture_contents(id),
    is_completed BOOLEAN DEFAULT FALSE,
    score INTEGER,  -- 테스트 점수
    attempts INTEGER DEFAULT 0,
    completion_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, content_id)
);

-- 9. 질문/어려웠던 점 테이블
CREATE TABLE student_questions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    lecture_id INTEGER REFERENCES lectures(id),
    content_id INTEGER REFERENCES lecture_contents(id),
    question TEXT NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    timestamp_in_content INTEGER,  -- 동영상 내 시간(초)
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. 교사 피드백 테이블
CREATE TABLE teacher_feedback (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id),
    student_id INTEGER REFERENCES users(id),
    question_id INTEGER REFERENCES student_questions(id),
    feedback_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. 과제 테이블
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    class_id INTEGER REFERENCES classes(id),
    teacher_id INTEGER REFERENCES users(id),
    due_date TIMESTAMP,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. 학생 과제 제출
CREATE TABLE student_assignments (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id),
    student_id INTEGER REFERENCES users(id),
    submission_text TEXT,
    file_url TEXT,
    submitted_at TIMESTAMP,
    score INTEGER,
    teacher_comment TEXT,
    is_graded BOOLEAN DEFAULT FALSE,
    UNIQUE(assignment_id, student_id)
);

-- 13. 성적 테이블
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    class_id INTEGER REFERENCES classes(id),
    test_name VARCHAR(200),
    score INTEGER NOT NULL,
    max_score INTEGER DEFAULT 100,
    test_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. 공지사항 테이블
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    class_id INTEGER REFERENCES classes(id),  -- NULL이면 전체 공지
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. 학습 분석 데이터 (성실도, 집중도 등)
CREATE TABLE learning_analytics (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    lecture_id INTEGER REFERENCES lectures(id),
    session_date DATE DEFAULT CURRENT_DATE,
    study_duration_minutes INTEGER DEFAULT 0,
    focus_score INTEGER CHECK (focus_score BETWEEN 0 AND 100),  -- 집중도 점수
    engagement_score INTEGER CHECK (engagement_score BETWEEN 0 AND 100),  -- 참여도 점수
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_classes_subject ON classes(subject);
CREATE INDEX idx_lectures_class_id ON lectures(class_id);
CREATE INDEX idx_student_progress_student_id ON student_lecture_progress(student_id);
CREATE INDEX idx_student_questions_student_id ON student_questions(student_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_learning_analytics_student_id ON learning_analytics(student_id);

-- 트리거: updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON lectures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_lecture_progress_updated_at BEFORE UPDATE ON student_lecture_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Quizzes and Questions
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    lecture_id INTEGER REFERENCES lectures(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    quiz_type VARCHAR(50) NOT NULL, -- 'ox', 'multiple_choice'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- 'ox', 'multiple_choice'
    order_index INTEGER NOT NULL
);

CREATE TABLE choices (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    choice_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE student_quiz_attempts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    score NUMERIC(5, 2),
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE TABLE student_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES student_quiz_attempts(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    chosen_choice_id INTEGER REFERENCES choices(id),
    is_correct BOOLEAN
);

CREATE INDEX idx_quizzes_lecture_id ON quizzes(lecture_id);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_choices_question_id ON choices(question_id);
CREATE INDEX idx_student_quiz_attempts_student_id ON student_quiz_attempts(student_id);
CREATE INDEX idx_student_answers_attempt_id ON student_answers(attempt_id);