export type SubscriptionPlan = 'free' | 'standard' | 'expert';
export type BudgetThreshold = 70 | 85 | 100;
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'provider_required';

export interface SubscriptionRecord {
  userId: string;
  plan: SubscriptionPlan;
  monthlyLimitKzt: number;
  usedKzt: number;
  createdAt: string;
}

export interface AiUsageEvent {
  id: string;
  userId: string;
  caseId?: string;
  provider: string;
  modelAlias: string;
  inputUnits: number;
  outputUnits: number;
  durationMs: number;
  estimatedCostKzt: number;
  complexity: string;
  risk: string;
  correlationId: string;
  createdAt: string;
}

export interface ProviderConfig {
  provider: string;
  enabled: boolean;
  killSwitchReason?: string;
}

export interface SubscriptionPlanDefinition {
  plan: SubscriptionPlan;
  title: string;
  priceKzt: number;
  monthlyLimitKzt: number;
  documentLimit: number;
  voiceMinutes: number;
  expertReview: boolean;
}

export interface PaymentHistoryRecord {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  provider: string;
  amountKzt: number;
  status: PaymentStatus;
  externalId?: string;
  createdAt: string;
}
