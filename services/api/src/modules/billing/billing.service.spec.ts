import { BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingRepository } from './repositories/billing.repository';

describe('BillingService', () => {
  it('records AI usage without personal data fields and reports budget', async () => {
    const service = new BillingService();
    const result = await service.recordUsage({
      userId: 'user-1',
      provider: 'stub',
      modelAlias: 'simple',
      inputUnits: 100,
      outputUnits: 50,
      durationMs: 120,
      estimatedCostKzt: 0,
      complexity: 'simple',
      risk: 'low',
      correlationId: 'corr-1',
    });

    expect(result.event).not.toHaveProperty('iin');
    expect(result.budget.ttsDisabled).toBe(false);
  });

  it('blocks disabled provider through kill switch', async () => {
    const service = new BillingService();
    await service.setProvider({ provider: 'stub', enabled: false, killSwitchReason: 'budget' });

    await expect(
      service.recordUsage({
        userId: 'user-1',
        provider: 'stub',
        modelAlias: 'simple',
        inputUnits: 1,
        outputUnits: 1,
        durationMs: 1,
        estimatedCostKzt: 1,
        complexity: 'simple',
        risk: 'low',
        correlationId: 'corr-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns plans and payment provider blocker without fake payment success', async () => {
    const service = new BillingService();

    expect(service.listPlans()).toHaveLength(3);
    expect(await service.listPaymentHistory('user-1')).toEqual([]);
    await expect(service.createPaymentIntent('user-1', 'standard')).resolves.toMatchObject({
      status: 'provider_required',
      blocker: 'PAYMENT_PROVIDER_REQUIRED',
      amountKzt: 7990,
    });
  });

  it('creates manual payment receipt and updates subscription plan', async () => {
    const service = new BillingService();

    const payment = await service.createManualPayment({
      userId: 'user-1',
      plan: 'standard',
      amountKzt: 7990,
      externalId: 'receipt-1',
    });
    const history = await service.listPaymentHistory('user-1');
    const budget = await service.budgetStatus('user-1');

    expect(payment).toMatchObject({ provider: 'manual', status: 'paid', amountKzt: 7990 });
    expect(history).toHaveLength(1);
    expect(budget).toMatchObject({ plan: 'standard', monthlyLimitKzt: 10000 });
  });

  it('uses configured repository for persistent billing flow', async () => {
    const repository = createRepositoryMock();
    const service = new BillingService(repository);

    const result = await service.recordUsage({
      userId: 'user-1',
      caseId: 'case-1',
      provider: 'stub',
      modelAlias: 'simple',
      inputUnits: 100,
      outputUnits: 50,
      durationMs: 120,
      estimatedCostKzt: 25,
      complexity: 'simple',
      risk: 'low',
      correlationId: 'corr-1',
    });

    expect(result.event.id).toBe('usage-1');
    expect(repository.findProvider).toHaveBeenCalledWith('stub');
    expect(repository.createUsageEvent).toHaveBeenCalled();
    expect(repository.incrementUsage).toHaveBeenCalledWith({ userId: 'user-1', amountKzt: 25 });
    expect(repository.findSubscription).toHaveBeenCalled();
    await expect(service.listPaymentHistory('user-1')).resolves.toHaveLength(1);

    await service.createManualPayment({ userId: 'user-1', plan: 'expert', amountKzt: 24900 });
    expect(repository.upsertSubscription).toHaveBeenCalledWith(expect.objectContaining({ plan: 'expert', monthlyLimitKzt: 35000 }));
    expect(repository.createPayment).toHaveBeenCalledWith(expect.objectContaining({ provider: 'manual', status: 'paid' }));
  });
});

function createRepositoryMock(): jest.Mocked<BillingRepository> {
  const subscription = {
    userId: 'user-1',
    plan: 'standard' as const,
    monthlyLimitKzt: 1000,
    usedKzt: 25,
    createdAt: '2026-09-04T00:00:00.000Z',
  };
  const usage = {
    id: 'usage-1',
    userId: 'user-1',
    caseId: 'case-1',
    provider: 'stub',
    modelAlias: 'simple',
    inputUnits: 100,
    outputUnits: 50,
    durationMs: 120,
    estimatedCostKzt: 25,
    complexity: 'simple',
    risk: 'low',
    correlationId: 'corr-1',
    createdAt: '2026-09-04T00:00:00.000Z',
  };
  return {
    findSubscription: jest.fn().mockResolvedValue(subscription),
    upsertSubscription: jest.fn().mockResolvedValue(subscription),
    incrementUsage: jest.fn().mockResolvedValue(subscription),
    createUsageEvent: jest.fn().mockResolvedValue(usage),
    findProvider: jest.fn().mockResolvedValue({ provider: 'stub', enabled: true }),
    upsertProvider: jest.fn().mockImplementation((provider) => Promise.resolve(provider)),
    listProviders: jest.fn().mockResolvedValue([{ provider: 'stub', enabled: true }]),
    listPaymentHistory: jest.fn().mockResolvedValue([
      {
        id: 'payment-1',
        userId: 'user-1',
        plan: 'standard',
        provider: 'manual',
        amountKzt: 7990,
        status: 'paid',
        createdAt: '2026-09-04T00:00:00.000Z',
      },
    ]),
    createPayment: jest.fn().mockImplementation((payment) =>
      Promise.resolve({
        id: 'payment-2',
        createdAt: '2026-09-04T00:00:00.000Z',
        ...payment,
      }),
    ),
  };
}
