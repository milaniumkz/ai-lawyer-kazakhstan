import { BadRequestException, Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AiUsageEvent, BudgetThreshold, PaymentHistoryRecord, ProviderConfig, SubscriptionPlan, SubscriptionPlanDefinition, SubscriptionRecord } from './billing.types';
import { BILLING_REPOSITORY } from './repositories/billing-repository.provider';
import { BillingRepository } from './repositories/billing.repository';

const THRESHOLDS: BudgetThreshold[] = [70, 85, 100];
const PLANS: SubscriptionPlanDefinition[] = [
  { plan: 'free', title: 'Базовый', priceKzt: 0, monthlyLimitKzt: 0, documentLimit: 2, voiceMinutes: 15, expertReview: false },
  { plan: 'standard', title: 'Профессиональный', priceKzt: 7990, monthlyLimitKzt: 10000, documentLimit: 30, voiceMinutes: 180, expertReview: true },
  { plan: 'expert', title: 'Эксперт', priceKzt: 24900, monthlyLimitKzt: 35000, documentLimit: 100, voiceMinutes: 600, expertReview: true },
];

@Injectable()
export class BillingService {
  private readonly subscriptions = new Map<string, SubscriptionRecord>();
  private readonly usageEvents: AiUsageEvent[] = [];
  private readonly providers = new Map<string, ProviderConfig>([['stub', { provider: 'stub', enabled: true }]]);
  private readonly payments = new Map<string, PaymentHistoryRecord[]>();

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

  listPlans() {
    return PLANS;
  }

  async listPaymentHistory(userId: string) {
    if (this.repository) return this.repository.listPaymentHistory(userId);
    return this.payments.get(userId) ?? [];
  }

  async createPaymentIntent(userId: string, plan: SubscriptionPlan) {
    const planDefinition = PLANS.find((item) => item.plan === plan);
    if (!planDefinition) throw new BadRequestException('SUBSCRIPTION_PLAN_NOT_FOUND');
    await this.getSubscription(userId);
    return {
      status: 'provider_required',
      plan,
      amountKzt: planDefinition.priceKzt,
      blocker: 'PAYMENT_PROVIDER_REQUIRED',
      message: 'Production payment provider is not configured. Use PAYMENT_PROVIDER_* env and adapter before accepting real payments.',
    };
  }

  async createManualPayment(input: {
    userId: string;
    plan: SubscriptionPlan;
    amountKzt: number;
    externalId?: string;
  }) {
    const planDefinition = PLANS.find((item) => item.plan === input.plan);
    if (!planDefinition) throw new BadRequestException('SUBSCRIPTION_PLAN_NOT_FOUND');
    if (!input.userId) throw new BadRequestException('USER_REQUIRED');
    if (!Number.isFinite(input.amountKzt) || input.amountKzt < 0) throw new BadRequestException('PAYMENT_AMOUNT_INVALID');

    const current = await this.getSubscription(input.userId);
    const nextSubscription: SubscriptionRecord = {
      ...current,
      plan: input.plan,
      monthlyLimitKzt: planDefinition.monthlyLimitKzt,
    };
    if (this.repository) {
      await this.repository.upsertSubscription(nextSubscription);
      return this.repository.createPayment({
        userId: input.userId,
        plan: input.plan,
        provider: 'manual',
        amountKzt: input.amountKzt,
        status: 'paid',
        externalId: input.externalId,
      });
    }

    this.subscriptions.set(input.userId, nextSubscription);
    const payment: PaymentHistoryRecord = {
      id: randomUUID(),
      userId: input.userId,
      plan: input.plan,
      provider: 'manual',
      amountKzt: input.amountKzt,
      status: 'paid',
      externalId: input.externalId,
      createdAt: new Date().toISOString(),
    };
    this.payments.set(input.userId, [payment, ...(this.payments.get(input.userId) ?? [])]);
    return payment;
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
