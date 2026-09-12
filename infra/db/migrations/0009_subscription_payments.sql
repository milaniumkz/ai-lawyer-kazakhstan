CREATE TABLE subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('free', 'standard', 'expert')),
  provider text NOT NULL,
  amount_kzt numeric(14,2) NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'provider_required')),
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subscription_payments_user_created_idx ON subscription_payments (user_id, created_at DESC);
