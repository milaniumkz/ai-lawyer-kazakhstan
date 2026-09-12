import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';
import { AiUsageEvent, PaymentHistoryRecord, ProviderConfig, SubscriptionRecord } from '../billing.types';
import { BillingRepository } from './billing.repository';

@Injectable()
export class PostgresBillingRepository implements BillingRepository {
  constructor(private readonly db: DatabaseService) {}

  async findSubscription(userId: string) {
    const result = await this.db.query<SubscriptionRow>('SELECT * FROM subscriptions WHERE user_id = $1 LIMIT 1', [userId]);
    return result.rows[0] ? mapSubscription(result.rows[0]) : undefined;
  }

  async upsertSubscription(input: SubscriptionRecord) {
    const result = await this.db.query<SubscriptionRow>(
      `INSERT INTO subscriptions (user_id, plan, monthly_limit_kzt, used_kzt)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET plan = EXCLUDED.plan, monthly_limit_kzt = EXCLUDED.monthly_limit_kzt, used_kzt = EXCLUDED.used_kzt
       RETURNING *`,
      [input.userId, input.plan, input.monthlyLimitKzt, input.usedKzt],
    );
    return mapSubscription(result.rows[0]!);
  }

  async incrementUsage(input: { userId: string; amountKzt: number }) {
    const result = await this.db.query<SubscriptionRow>(
      `UPDATE subscriptions
       SET used_kzt = used_kzt + $2
       WHERE user_id = $1
       RETURNING *`,
      [input.userId, input.amountKzt],
    );
    return mapSubscription(result.rows[0]!);
  }

  async createUsageEvent(input: Omit<AiUsageEvent, 'id' | 'createdAt'>) {
    const result = await this.db.query<AiUsageEventRow>(
      `INSERT INTO ai_usage_events
        (user_id, case_id, provider, model_alias, input_units, output_units, duration_ms,
         estimated_cost_kzt, complexity, risk, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        input.userId,
        input.caseId ?? null,
        input.provider,
        input.modelAlias,
        input.inputUnits,
        input.outputUnits,
        input.durationMs,
        input.estimatedCostKzt,
        input.complexity,
        input.risk,
        input.correlationId,
      ],
    );
    return mapUsageEvent(result.rows[0]!);
  }

  async findProvider(provider: string) {
    const result = await this.db.query<ProviderConfigRow>('SELECT * FROM provider_configs WHERE provider = $1 LIMIT 1', [provider]);
    return result.rows[0] ? mapProvider(result.rows[0]) : undefined;
  }

  async upsertProvider(input: ProviderConfig) {
    const result = await this.db.query<ProviderConfigRow>(
      `INSERT INTO provider_configs (provider, enabled, kill_switch_reason, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (provider)
       DO UPDATE SET enabled = EXCLUDED.enabled, kill_switch_reason = EXCLUDED.kill_switch_reason, updated_at = now()
       RETURNING *`,
      [input.provider, input.enabled, input.killSwitchReason ?? null],
    );
    return mapProvider(result.rows[0]!);
  }

  async listProviders() {
    const result = await this.db.query<ProviderConfigRow>('SELECT * FROM provider_configs ORDER BY provider ASC');
    return result.rows.map(mapProvider);
  }

  async listPaymentHistory(userId: string) {
    const result = await this.db.query<PaymentHistoryRow>(
      `SELECT * FROM subscription_payments
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId],
    );
    return result.rows.map(mapPaymentHistory);
  }
}

interface SubscriptionRow {
  user_id: string;
  plan: SubscriptionRecord['plan'];
  monthly_limit_kzt: string | number;
  used_kzt: string | number;
  created_at: Date;
}

interface AiUsageEventRow {
  id: string;
  user_id: string;
  case_id?: string | null;
  provider: string;
  model_alias: string;
  input_units: number;
  output_units: number;
  duration_ms: number;
  estimated_cost_kzt: string | number;
  complexity: string;
  risk: string;
  correlation_id: string;
  created_at: Date;
}

interface ProviderConfigRow {
  provider: string;
  enabled: boolean;
  kill_switch_reason?: string | null;
}

interface PaymentHistoryRow {
  id: string;
  user_id: string;
  plan: PaymentHistoryRecord['plan'];
  provider: string;
  amount_kzt: string | number;
  status: PaymentHistoryRecord['status'];
  external_id?: string | null;
  created_at: Date;
}

export function mapSubscription(row: SubscriptionRow): SubscriptionRecord {
  return {
    userId: row.user_id,
    plan: row.plan,
    monthlyLimitKzt: Number(row.monthly_limit_kzt),
    usedKzt: Number(row.used_kzt),
    createdAt: row.created_at.toISOString(),
  };
}

export function mapUsageEvent(row: AiUsageEventRow): AiUsageEvent {
  return {
    id: row.id,
    userId: row.user_id,
    caseId: row.case_id ?? undefined,
    provider: row.provider,
    modelAlias: row.model_alias,
    inputUnits: row.input_units,
    outputUnits: row.output_units,
    durationMs: row.duration_ms,
    estimatedCostKzt: Number(row.estimated_cost_kzt),
    complexity: row.complexity,
    risk: row.risk,
    correlationId: row.correlation_id,
    createdAt: row.created_at.toISOString(),
  };
}

export function mapProvider(row: ProviderConfigRow): ProviderConfig {
  return {
    provider: row.provider,
    enabled: row.enabled,
    killSwitchReason: row.kill_switch_reason ?? undefined,
  };
}

export function mapPaymentHistory(row: PaymentHistoryRow): PaymentHistoryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan,
    provider: row.provider,
    amountKzt: Number(row.amount_kzt),
    status: row.status,
    externalId: row.external_id ?? undefined,
    createdAt: row.created_at.toISOString(),
  };
}
