ALTER TABLE transcript_jobs ADD COLUMN IF NOT EXISTS owner_user_id UUID;

UPDATE transcript_jobs
SET owner_user_id = legal_cases.owner_user_id
FROM legal_cases
WHERE transcript_jobs.case_id = legal_cases.id
  AND transcript_jobs.owner_user_id IS NULL;

ALTER TABLE transcript_jobs
  ADD CONSTRAINT transcript_jobs_owner_user_id_fkey
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_transcript_jobs_owner_user_id ON transcript_jobs(owner_user_id);
