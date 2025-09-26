-- Q&A 공개 범위 확장: 질문 단위 공개/비공개 플래그 추가
-- 실행 시점: 애플리케이션 배포 전 (백엔드/프론트 변경 반영 전에 수행)

START TRANSACTION;

ALTER TABLE qna
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT TRUE AFTER question;

UPDATE qna
  SET is_public = TRUE
  WHERE is_public IS NULL;

COMMIT;
