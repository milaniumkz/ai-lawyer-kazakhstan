CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone text UNIQUE,
  email text UNIQUE,
  password_hash text,
  roles text[] NOT NULL DEFAULT ARRAY['user'],
  consent_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX sessions_user_id_idx ON sessions(user_id);

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('person', 'individual_entrepreneur', 'legal_entity', 'representative')),
  display_name text NOT NULL,
  iin_bin_encrypted bytea,
  iin_bin_hash text,
  address text,
  bank_account_encrypted bytea,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_user_id_idx ON profiles(user_id);
CREATE INDEX profiles_iin_bin_hash_idx ON profiles(iin_bin_hash);

CREATE TABLE legal_cases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  problem_text text NOT NULL,
  category text NOT NULL,
  subcategory text,
  confidence numeric(4,3) NOT NULL,
  status text NOT NULL,
  readiness_percent integer NOT NULL CHECK (readiness_percent BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX legal_cases_owner_user_id_idx ON legal_cases(owner_user_id);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id uuid NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_case_id_created_at_idx ON messages(case_id, created_at);

CREATE TABLE transcript_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id uuid REFERENCES legal_cases(id) ON DELETE SET NULL,
  status text NOT NULL,
  language text NOT NULL CHECK (language IN ('ru', 'kk', 'en')),
  transcript text NOT NULL,
  low_confidence_fragments text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id uuid NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  sha256 text NOT NULL UNIQUE,
  status text NOT NULL,
  extracted_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX files_case_id_idx ON files(case_id);

CREATE TABLE evidence_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id uuid NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
  title text NOT NULL,
  assessment text NOT NULL,
  document_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE legal_source_fragments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  official_id text NOT NULL,
  title text NOT NULL,
  source_type text NOT NULL,
  authority text NOT NULL,
  language text NOT NULL CHECK (language IN ('ru', 'kk', 'en')),
  article text,
  point text,
  text text NOT NULL,
  source_url text NOT NULL,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  checksum text NOT NULL,
  source_version text NOT NULL,
  embedding_version text NOT NULL,
  embedding vector(1536),
  status text NOT NULL
);

CREATE INDEX legal_source_fragments_official_id_idx ON legal_source_fragments(official_id);
CREATE INDEX legal_source_fragments_status_idx ON legal_source_fragments(status);

CREATE TABLE templates (
  id text PRIMARY KEY,
  code text NOT NULL,
  title text NOT NULL,
  language text NOT NULL CHECK (language IN ('ru', 'kk', 'en')),
  status text NOT NULL,
  version text NOT NULL,
  required_fields text[] NOT NULL,
  body text NOT NULL
);

CREATE TABLE generated_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id text NOT NULL REFERENCES templates(id),
  case_id uuid NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
  status text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  expert_review_required boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_usage_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_id uuid REFERENCES legal_cases(id) ON DELETE SET NULL,
  provider text NOT NULL,
  model_alias text NOT NULL,
  input_units integer NOT NULL DEFAULT 0,
  output_units integer NOT NULL DEFAULT 0,
  duration_ms integer NOT NULL DEFAULT 0,
  estimated_cost_kzt numeric(14,2) NOT NULL DEFAULT 0,
  complexity text NOT NULL,
  risk text NOT NULL,
  correlation_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_usage_events_user_id_created_at_idx ON ai_usage_events(user_id, created_at);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  action text NOT NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_action_created_at_idx ON audit_logs(action, created_at);
