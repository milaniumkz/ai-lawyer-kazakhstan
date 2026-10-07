CREATE TABLE IF NOT EXISTS user_tasks (
 id uuid PRIMARY KEY,
 owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 case_id uuid REFERENCES legal_cases(id) ON DELETE CASCADE,
 payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_tasks_owner_idx ON user_tasks(owner_user_id);
CREATE TABLE IF NOT EXISTS document_dispatches (
 id uuid PRIMARY KEY,
 document_id uuid NOT NULL REFERENCES generated_documents(id) ON DELETE CASCADE,
 owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS document_dispatches_owner_idx ON document_dispatches(owner_user_id,document_id);

CREATE TABLE IF NOT EXISTS support_tickets (
 id uuid PRIMARY KEY,
 owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_tickets_owner_idx ON support_tickets(owner_user_id);
