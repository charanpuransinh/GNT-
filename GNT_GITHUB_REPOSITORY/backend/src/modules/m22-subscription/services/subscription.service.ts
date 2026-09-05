// M22 — Subscription service (PUBLIC)
// plan CRUD + company subscription lifecycle (blueprint PRICING_SUBSCRIPTION_STRATEGY.md)
import { prisma } from '@/common/config/prisma';
import type { SubscriptionPlanDTO, SubscribeDTO } from '../types/subscription.types';

export class SubscriptionService {
  async listPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async getAllPlans() {
    return prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: 'asc' } });
  }

  async getPlanById(id: string) {
    return prisma.subscriptionPlan.findUnique({ where: { id } });
  }

  async createPlan(dto: SubscriptionPlanDTO) {
    return prisma.subscriptionPlan.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        priceMonthly: dto.priceMonthly,
        priceYearly: dto.priceYearly,
        billingCycle: dto.billingCycle ?? 'MONTHLY',
        features: (dto.features ?? []) as never,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updatePlan(id: string, dto: Partial<SubscriptionPlanDTO>) {
    const result = await prisma.subscriptionPlan.updateMany({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.priceMonthly !== undefined && { priceMonthly: dto.priceMonthly }),
        ...(dto.priceYearly !== undefined && { priceYearly: dto.priceYearly }),
        ...(dto.billingCycle !== undefined && { billingCycle: dto.billingCycle }),
        ...(dto.features !== undefined && { features: dto.features as never }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        updatedAt: new Date(),
      },
    });
    if (result.count === 0) throw new Error('Plan not found');
    return prisma.subscriptionPlan.findUnique({ where: { id } });
  }

  async subscribe(companyId: string, dto: SubscribeDTO) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new Error('Plan not found');
    const endDate = dto.endDate ? new Date(dto.endDate) : null;
    return prisma.companySubscription.upsert({
      where: { companyId },
      create: {
        companyId,
        planId: dto.planId,
        status: dto.status ?? 'ACTIVE',
        autoRenew: dto.autoRenew ?? false,
        endDate,
      },
      update: {
        planId: dto.planId,
        status: dto.status ?? 'ACTIVE',
        autoRenew: dto.autoRenew ?? false,
        endDate,
        updatedAt: new Date(),
      },
    });
  }

  async getActiveSubscription(companyId: string) {
    return prisma.companySubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });
  }

  async cancelSubscription(companyId: string) {
    const result = await prisma.companySubscription.updateMany({
      where: { companyId },
      data: { status: 'CANCELLED', autoRenew: false, updatedAt: new Date() },
    });
    if (result.count === 0) throw new Error('Subscription not found');
    return prisma.companySubscription.findUnique({ where: { companyId } });
  }

  /**
   * Trial शुरू करो — blueprint (myBillBook-style) 7-दिन trial। status=TRIAL + endDate auto।
   */
  async startTrial(companyId: string, planId: string, trialDays = 7) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');
    const endDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    return prisma.companySubscription.upsert({
      where: { companyId },
      create: { companyId, planId, status: 'TRIAL', endDate, autoRenew: false },
      update: { planId, status: 'TRIAL', endDate, autoRenew: false, updatedAt: new Date() },
    });
  }

  /**
   * Feature gate: कंपनी के ACTIVE plan में यह feature है या नहीं।
   * `features: ['*']` = सब कुछ खुला। EXPIRED/CANCELLED पर false।
   */
  async canAccess(companyId: string, feature: string): Promise<boolean> {
    const sub = await prisma.companySubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });
    if (!sub || (sub.status !== 'ACTIVE' && sub.status !== 'TRIAL')) return false;
    if (sub.endDate && sub.endDate < new Date()) return false;
    const features = (sub.plan.features ?? []) as unknown as string[];
    if (features.includes('*')) return true;
    return features.includes(feature);
  }

  // ── Billing ──────────────────────────────────────────────

  /** मौजूदा period का invoice बनाओ — plan की कीमत से (owner-फ़ैसला नहीं, plan में price पहले से है) */
  async generateInvoice(companyId: string) {
    const sub = await prisma.companySubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });
    if (!sub) throw new Error('No active subscription');
    if (sub.status !== 'ACTIVE' && sub.status !== 'TRIAL') throw new Error('Subscription not active');

    const now = new Date();
    const yearly = sub.plan.billingCycle === 'YEARLY';
    const amount = yearly ? Number(sub.plan.priceYearly) : Number(sub.plan.priceMonthly);
    const periodStart = sub.endDate && sub.endDate > now ? sub.endDate : now;
    const periodEnd = new Date(periodStart.getTime() + (yearly ? 365 : 30) * 24 * 60 * 60 * 1000);

    return prisma.subscriptionInvoice.create({
      data: {
        companyId,
        subscriptionId: sub.id,
        planId: sub.planId,
        amount,
        billingCycle: sub.plan.billingCycle,
        periodStart,
        periodEnd,
      },
    });
  }

  async listInvoices(companyId: string) {
    return prisma.subscriptionInvoice.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markInvoicePaid(invoiceId: string, companyId: string) {
    const result = await prisma.subscriptionInvoice.updateMany({
      where: { id: invoiceId, companyId },
      data: { status: 'PAID' },
    });
    if (result.count === 0) throw new Error('Invoice not found');
    return prisma.subscriptionInvoice.findFirst({ where: { id: invoiceId, companyId } });
  }
}

export const subscriptionService = new SubscriptionService();
