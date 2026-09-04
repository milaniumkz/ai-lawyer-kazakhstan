import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AiUsageEvent, BudgetThreshold, ProviderConfig, SubscriptionRecord } from './billing.types';

const THRESHOLDS: BudgetThreshold[] = [70, 85, 100];

@Injectable()
export class BillingService {
  private readonly subscriptions = new Map<string, SubscriptionRecord>();
  private readonly usageEvents: AiUsageEvent[] = [];
  private readonly providers = new Map<string, ProviderConfig>([['stub', { provider: 'stub', enabled: true }]]);

  getSubscription(userId: string) {
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, {
        userId,
        plan: 'free',
        monthlyLimitKzt: 0,
        usedKzt: 0,
        createdAt: new Date().toISOString(),
      });
    }
    return this.subscriptions.get(userId)!;
  }

  recordUsage(input: Omit<AiUsageEvent, 'id' | 'createdAt'>) {
    if (!input.provider || !input.modelAlias) throw new BadRequestException('PROVIDER_MODEL_REQUIRED');
    const provider = this.providers.get(input.provider);
    if (provider && !provider.enabled) throw new BadRequestException('PROVIDER_DISABLED');

    const event: AiUsageEvent = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
    this.usageEvents.push(event);
    const subscription = this.getSubscription(input.userId);
    subscription.usedKzt += input.estimatedCostKzt;
    return { event, budget: this.budgetStatus(input.userId) };
  }

  budgetStatus(userId: string) {
    const subscription = this.getSubscription(userId);
    const percent = subscription.monthlyLimitKzt > 0 ? Math.round((subscription.usedKzt / subscription.monthlyLimitKzt) * 100) : 0;
    return {
      ...subscription,
      percent,
      triggeredThresholds: THRESHOLDS.filter((threshold) => percent >= threshold),
      ttsDisabled: percent >= 100,
    };
  }

  setProvider(input: ProviderConfig) {
    this.providers.set(input.provider, input);
    return input;
  }

  listProviders() {
    return [...this.providers.values()];
  }
}
