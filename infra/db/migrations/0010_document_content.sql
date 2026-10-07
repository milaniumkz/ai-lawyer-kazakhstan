-- Identical bytes may legitimately belong to different users/cases.
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_sha256_key;
CREATE UNIQUE INDEX IF NOT EXISTS files_case_sha256_key ON files (case_id, sha256);
