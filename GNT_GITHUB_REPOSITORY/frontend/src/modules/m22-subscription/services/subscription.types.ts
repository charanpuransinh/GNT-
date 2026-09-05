// M22 — Subscription frontend types
export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  priceMonthly: string;
  priceYearly: string;
  billingCycle: string;
  features: string[];
  isActive: boolean;
}

export interface CompanySubscription {
  id: string;
  companyId: string;
  planId: string;
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate?: string | null;
  autoRenew: boolean;
  plan?: SubscriptionPlan;
}
