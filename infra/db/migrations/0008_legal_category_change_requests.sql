CREATE TABLE IF NOT EXISTS legal_category_change_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  action text NOT NULL CHECK (action IN ('create', 'update')),
  category_code text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason text,
  requested_by text NOT NULL,
  reviewed_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS legal_category_change_requests_status_idx
  ON legal_category_change_requests(status, created_at);

CREATE INDEX IF NOT EXISTS legal_category_change_requests_category_idx
  ON legal_category_change_requests(category_code, created_at);
