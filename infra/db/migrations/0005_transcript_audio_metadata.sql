ALTER TABLE transcript_jobs
  ADD COLUMN IF NOT EXISTS audio_file_id uuid,
  ADD COLUMN IF NOT EXISTS audio_mime_type text,
  ADD COLUMN IF NOT EXISTS audio_size_bytes bigint CHECK (audio_size_bytes IS NULL OR audio_size_bytes > 0),
  ADD COLUMN IF NOT EXISTS audio_sha256 text,
  ADD COLUMN IF NOT EXISTS audio_storage_key text;

CREATE INDEX IF NOT EXISTS transcript_jobs_audio_sha256_idx ON transcript_jobs(audio_sha256);
