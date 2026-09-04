import { BadRequestException, Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AiUsageEvent, BudgetThreshold, ProviderConfig, SubscriptionRecord } from './billing.types';
import { BILLING_REPOSITORY } from './repositories/billing-repository.provider';
import { BillingRepository } from './repositories/billing.repository';

const THRESHOLDS: BudgetThreshold[] = [70, 85, 100];

@Injectable()
export class BillingService {
  private readonly subscriptions = new Map<string, SubscriptionRecord>();
  private readonly usageEvents: AiUsageEvent[] = [];
  private readonly providers = new Map<string, ProviderConfig>([['stub', { provider: 'stub', enabled: true }]]);

  constructor(@Optional() @Inject(BILLING_REPOSITORY) private readonly repository?: BillingRepository) {}

  async getSubscription(userId: string) {
    if (this.repository) {
      const existing = await this.repository.findSubscription(userId);
      if (existing) return existing;
      return this.repository.upsertSubscription({
        userId,
        plan: 'free',
        monthlyLimitKzt: 0,
        usedKzt: 0,
        createdAt: new Date().toISOString(),
      });
    }
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

  async recordUsage(input: Omit<AiUsageEvent, 'id' | 'createdAt'>) {
    if (!input.provider || !input.modelAlias) throw new BadRequestException('PROVIDER_MODEL_REQUIRED');
    const provider = this.repository ? await this.repository.findProvider(input.provider) : this.providers.get(input.provider);
    if (provider && !provider.enabled) throw new BadRequestException('PROVIDER_DISABLED');

    const event = this.repository
      ? await this.repository.createUsageEvent(input)
      : ({ ...input, id: randomUUID(), createdAt: new Date().toISOString() } satisfies AiUsageEvent);
    if (this.repository) {
      await this.getSubscription(input.userId);
      await this.repository.incrementUsage({ userId: input.userId, amountKzt: input.estimatedCostKzt });
    } else {
      this.usageEvents.push(event);
      const subscription = await this.getSubscription(input.userId);
      subscription.usedKzt += input.estimatedCostKzt;
    }
    return { event, budget: await this.budgetStatus(input.userId) };
  }

  async budgetStatus(userId: string) {
    const subscription = await this.getSubscription(userId);
    const percent = subscription.monthlyLimitKzt > 0 ? Math.round((subscription.usedKzt / subscription.monthlyLimitKzt) * 100) : 0;
    return {
      ...subscription,
      percent,
      triggeredThresholds: THRESHOLDS.filter((threshold) => percent >= threshold),
      ttsDisabled: percent >= 100,
    };
  }

  async setProvider(input: ProviderConfig) {
    if (this.repository) return this.repository.upsertProvider(input);
    this.providers.set(input.provider, input);
    return input;
  }

  async listProviders() {
    if (this.repository) return this.repository.listProviders();
    return [...this.providers.values()];
  }
}
