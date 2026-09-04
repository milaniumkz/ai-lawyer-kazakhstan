import { AiUsageEvent, ProviderConfig, SubscriptionRecord } from '../billing.types';

export interface BillingRepository {
  findSubscription(userId: string): Promise<SubscriptionRecord | undefined>;
  upsertSubscription(input: SubscriptionRecord): Promise<SubscriptionRecord>;
  incrementUsage(input: { userId: string; amountKzt: number }): Promise<SubscriptionRecord>;
  createUsageEvent(input: Omit<AiUsageEvent, 'id' | 'createdAt'>): Promise<AiUsageEvent>;
  findProvider(provider: string): Promise<ProviderConfig | undefined>;
  upsertProvider(input: ProviderConfig): Promise<ProviderConfig>;
  listProviders(): Promise<ProviderConfig[]>;
}
