// M22 — Subscription types (PUBLIC)
export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';
export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface SubscriptionPlanDTO {
  code: string;
  name: string;
  description?: string | null;
  priceMonthly: number;
  priceYearly: number;
  billingCycle?: BillingCycle;
  features?: string[];
  isActive?: boolean;
}

export interface SubscribeDTO {
  planId: string;
  status?: SubscriptionStatus;
  autoRenew?: boolean;
  endDate?: Date;
}
