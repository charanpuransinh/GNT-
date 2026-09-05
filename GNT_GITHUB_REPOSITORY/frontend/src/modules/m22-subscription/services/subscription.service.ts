// M22 — Subscription frontend service (API client)
import { apiClient } from '../../../core/api-client';
import { SubscriptionPlan, CompanySubscription } from './subscription.types';

const BASE_URL = '/api/v1/subscriptions';

export const subscriptionService = {
  async listPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get<SubscriptionPlan[]>(`${BASE_URL}/plans`);
    return response.data;
  },

  async subscribe(planId: string, autoRenew = false): Promise<CompanySubscription> {
    const response = await apiClient.post<CompanySubscription>(`${BASE_URL}/subscribe`, { planId, autoRenew });
    return response.data;
  },

  async getActive(): Promise<CompanySubscription | null> {
    const response = await apiClient.get<CompanySubscription | null>(`${BASE_URL}/active`);
    return response.data;
  },

  async cancel(): Promise<CompanySubscription> {
    const response = await apiClient.post<CompanySubscription>(`${BASE_URL}/cancel`, {});
    return response.data;
  },
};
