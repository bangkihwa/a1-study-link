ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS course_id INT NULL AFTER class_id,
  ADD COLUMN IF NOT EXISTS publish_mode ENUM('manual', 'scheduled') NOT NULL DEFAULT 'manual' AFTER is_published,
  ADD COLUMN IF NOT EXISTS publish_at DATETIME NULL AFTER publish_mode,
  ADD COLUMN IF NOT EXISTS published_at DATETIME NULL AFTER publish_at,
  ADD INDEX IF NOT EXISTS idx_course (course_id),
  ADD INDEX IF NOT EXISTS idx_publish_mode (publish_mode),
  ADD INDEX IF NOT EXISTS idx_publish_at (publish_at),
  ADD CONSTRAINT IF NOT EXISTS tests_course_fk FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;

ALTER TABLE qna
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE AFTER question;

UPDATE tests
   SET publish_mode = 'manual'
 WHERE publish_mode IS NULL;

UPDATE tests
   SET published_at = CASE
     WHEN is_published = TRUE AND (published_at IS NULL OR published_at = '0000-00-00 00:00:00') THEN COALESCE(updated_at, created_at)
     ELSE published_at
   END;

UPDATE tests t
JOIN (
  SELECT
    CAST(JSON_UNQUOTE(JSON_EXTRACT(cb.content, '$.testId')) AS UNSIGNED) AS test_id,
    cb.course_id
  FROM content_blocks cb
  WHERE cb.type = 'test'
) mapping ON mapping.test_id = t.id
SET t.course_id = COALESCE(t.course_id, mapping.course_id)
WHERE mapping.test_id IS NOT NULL;
