export type SubscriptionPlan = 'free' | 'standard' | 'expert';
export type BudgetThreshold = 70 | 85 | 100;

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
