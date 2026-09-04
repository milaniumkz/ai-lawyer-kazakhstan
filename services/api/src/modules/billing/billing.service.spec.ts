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
  };
}
