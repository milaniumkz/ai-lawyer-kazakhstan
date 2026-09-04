CREATE TABLE subscriptions (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('free', 'standard', 'expert')),
  monthly_limit_kzt numeric(14,2) NOT NULL DEFAULT 0,
  used_kzt numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE provider_configs (
  provider text PRIMARY KEY,
  enabled boolean NOT NULL,
  kill_switch_reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO provider_configs (provider, enabled)
VALUES ('stub', true)
ON CONFLICT (provider) DO NOTHING;
