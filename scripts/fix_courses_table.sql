-- courses 테이블의 teacher_id 컬럼을 NULL 허용으로 변경하는 스크립트
-- 교사 대시보드 강의 표시 문제 해결을 위한 데이터베이스 스키마 수정

USE a1_study_lms;

-- 기존 외래 키 제약 조건 확인 및 삭제
SET @constraint_name = '';
SELECT CONSTRAINT_NAME INTO @constraint_name 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'courses' 
  AND COLUMN_NAME = 'teacher_id' 
  AND REFERENCED_TABLE_NAME = 'users'
  AND TABLE_SCHEMA = DATABASE()
LIMIT 1;

-- 외래 키 제약 조건이 있으면 삭제
SET @drop_fk_sql = CONCAT('ALTER TABLE courses DROP FOREIGN KEY ', @constraint_name);
SELECT @drop_fk_sql;

-- 외래 키 제약 조건 삭제 실행 (제약 조건이 있는 경우에만)
SET @sql = IF(@constraint_name != '', @drop_fk_sql, 'SELECT "No foreign key constraint found" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- teacher_id 컬럼을 NULL 허용으로 변경
ALTER TABLE courses MODIFY COLUMN teacher_id INT NULL;

-- 새로운 외래 키 제약 조건 추가 (ON DELETE SET NULL 포함)
ALTER TABLE courses 
ADD CONSTRAINT fk_courses_teacher 
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL;

-- 변경 사항 확인
DESCRIBE courses;

-- 결과 메시지
SELECT 'courses 테이블의 teacher_id 컬럼이 NULL 허용으로 변경되었습니다.' as result;