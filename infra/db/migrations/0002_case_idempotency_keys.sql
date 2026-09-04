CREATE TABLE case_idempotency_keys (
  key text PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX case_idempotency_keys_owner_user_id_idx ON case_idempotency_keys(owner_user_id);
