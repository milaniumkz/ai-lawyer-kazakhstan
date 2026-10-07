CREATE TABLE IF NOT EXISTS document_generation_jobs (
 id uuid PRIMARY KEY,
 owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 case_id uuid NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
 idempotency_key text NOT NULL,
 payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_user_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS generation_jobs_status_idx ON document_generation_jobs ((payload->>'status'),created_at);
