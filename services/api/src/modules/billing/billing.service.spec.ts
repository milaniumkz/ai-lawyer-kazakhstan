import { BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  it('records AI usage without personal data fields and reports budget', () => {
    const service = new BillingService();
    const result = service.recordUsage({
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

  it('blocks disabled provider through kill switch', () => {
    const service = new BillingService();
    service.setProvider({ provider: 'stub', enabled: false, killSwitchReason: 'budget' });

    expect(() =>
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
    ).toThrow(BadRequestException);
  });
});
