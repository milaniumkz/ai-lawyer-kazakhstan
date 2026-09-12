import { DatabaseService } from '../../../common/database/database.service';
import { PostgresBillingRepository, mapPaymentHistory, mapProvider, mapSubscription, mapUsageEvent } from './postgres-billing.repository';

describe('PostgresBillingRepository mapping', () => {
  it('maps numeric subscription and usage amounts', () => {
    expect(mapSubscription(subscriptionRow())).toMatchObject({ userId: 'user-1', monthlyLimitKzt: 10000, usedKzt: 2500.5 });
    expect(mapUsageEvent(usageRow())).toMatchObject({ userId: 'user-1', estimatedCostKzt: 125.25, modelAlias: 'legal-default' });
  });

  it('maps provider kill switch config', () => {
    expect(mapProvider({ provider: 'stub', enabled: false, kill_switch_reason: 'budget' })).toEqual({
      provider: 'stub',
      enabled: false,
      killSwitchReason: 'budget',
    });
  });

  it('maps payment history rows', () => {
    expect(mapPaymentHistory(paymentRow())).toMatchObject({ userId: 'user-1', plan: 'standard', amountKzt: 7990, status: 'paid' });
  });
});

describe('PostgresBillingRepository persistence contract', () => {
  it('records AI usage without raw prompt or personal data fields', async () => {
    const { db, query } = createDbMock(usageRow());
    const repository = new PostgresBillingRepository(db);

    await repository.createUsageEvent({
      userId: 'user-1',
      caseId: 'case-1',
      provider: 'stub',
      modelAlias: 'legal-default',
      inputUnits: 10,
      outputUnits: 20,
      durationMs: 30,
      estimatedCostKzt: 125.25,
      complexity: 'low',
      risk: 'low',
      correlationId: 'corr-1',
    });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO ai_usage_events'), [
      'user-1',
      'case-1',
      'stub',
      'legal-default',
      10,
      20,
      30,
      125.25,
      'low',
      'low',
      'corr-1',
    ]);
    expect(query.mock.calls[0][0]).not.toContain('prompt');
    expect(query.mock.calls[0][0]).not.toContain('iin');
  });

  it('increments usage atomically in subscriptions table', async () => {
    const { db, query } = createDbMock(subscriptionRow());
    const repository = new PostgresBillingRepository(db);

    await repository.incrementUsage({ userId: 'user-1', amountKzt: 50 });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('used_kzt = used_kzt + $2'), ['user-1', 50]);
  });

  it('upserts provider kill switch settings', async () => {
    const { db, query } = createDbMock({ provider: 'stub', enabled: false, kill_switch_reason: 'manual' });
    const repository = new PostgresBillingRepository(db);

    await repository.upsertProvider({ provider: 'stub', enabled: false, killSwitchReason: 'manual' });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT (provider)'), ['stub', false, 'manual']);
  });

  it('lists payment history scoped by user', async () => {
    const { db, query } = createDbMock(paymentRow());
    const repository = new PostgresBillingRepository(db);

    const payments = await repository.listPaymentHistory('user-1');

    expect(query).toHaveBeenCalledWith(expect.stringContaining('FROM subscription_payments'), ['user-1']);
    expect(payments[0].amountKzt).toBe(7990);
  });

  it('creates manual payment receipt', async () => {
    const { db, query } = createDbMock(paymentRow());
    const repository = new PostgresBillingRepository(db);

    await repository.createPayment({
      userId: 'user-1',
      plan: 'standard',
      provider: 'manual',
      amountKzt: 7990,
      status: 'paid',
      externalId: 'receipt-1',
    });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO subscription_payments'), [
      'user-1',
      'standard',
      'manual',
      7990,
      'paid',
      'receipt-1',
    ]);
  });
});

function createDbMock(row: unknown) {
  const query = jest.fn().mockResolvedValue({ rows: row ? [row] : [] });
  return {
    db: { query } as unknown as DatabaseService,
    query,
  };
}

function subscriptionRow() {
  return {
    user_id: 'user-1',
    plan: 'standard' as const,
    monthly_limit_kzt: '10000.00',
    used_kzt: '2500.50',
    created_at: new Date('2026-09-04T00:00:00.000Z'),
  };
}

function usageRow() {
  return {
    id: 'usage-1',
    user_id: 'user-1',
    case_id: 'case-1',
    provider: 'stub',
    model_alias: 'legal-default',
    input_units: 10,
    output_units: 20,
    duration_ms: 30,
    estimated_cost_kzt: '125.25',
    complexity: 'low',
    risk: 'low',
    correlation_id: 'corr-1',
    created_at: new Date('2026-09-04T00:00:00.000Z'),
  };
}

function paymentRow() {
  return {
    id: 'payment-1',
    user_id: 'user-1',
    plan: 'standard' as const,
    provider: 'manual',
    amount_kzt: '7990.00',
    status: 'paid' as const,
    external_id: 'receipt-1',
    created_at: new Date('2026-09-04T00:00:00.000Z'),
  };
}
