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
   * Feature gate: कंपनी के plan में यह feature है या नहीं।
   * `features: ['*']` = सब कुछ खुला।
   * ACTIVE / TRIAL / PAST_DUE (grace period) → access मिलता है; EXPIRED / CANCELLED → नहीं।
   * TRIAL/ACTIVE का endDate बीत चुका हो तो भी नहीं (runBillingCycle के चलने से पहले भी fail-safe)।
   */
  async canAccess(companyId: string, feature: string): Promise<boolean> {
    const sub = await prisma.companySubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });
    if (!sub) return false;
    if (sub.status === 'EXPIRED' || sub.status === 'CANCELLED') return false;
    if ((sub.status === 'ACTIVE' || sub.status === 'TRIAL') && sub.endDate && sub.endDate < new Date()) return false;
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

  /**
   * Invoice paid — status PAID + subscription को उसी period तक बढ़ाओ (renewal) और
   * PAST_DUE थी तो ACTIVE कर दो। (Payment gateway से confirm आने पर M11/M18 यही बुलाएँगे,
   * या admin manually।)
   */
  async markInvoicePaid(invoiceId: string, companyId: string) {
    const invoice = await prisma.subscriptionInvoice.findFirst({ where: { id: invoiceId, companyId } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'PAID') return invoice;

    return prisma.$transaction(async (tx) => {
      const paid = await tx.subscriptionInvoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID' },
      });
      const sub = await tx.companySubscription.findUnique({ where: { id: invoice.subscriptionId } });
      if (sub && sub.status !== 'CANCELLED') {
        // period बढ़ाओ — जो बाद में हो: मौजूदा endDate या इस invoice का periodEnd
        const newEnd = !sub.endDate || sub.endDate < invoice.periodEnd ? invoice.periodEnd : sub.endDate;
        await tx.companySubscription.update({
          where: { id: sub.id },
          data: {
            status: sub.status === 'PAST_DUE' || sub.status === 'EXPIRED' ? 'ACTIVE' : sub.status,
            endDate: newEnd,
            updatedAt: new Date(),
          },
        });
      }
      return paid;
    });
  }

  /**
   * Billing lifecycle — cron/admin हर दिन एक बार बुलाए (M13 schedule या /billing/run)।
   * 1. auto-renew subs जिनका period ~3 दिन में ख़त्म → अगला invoice generate
   * 2. PENDING invoice जिसका periodEnd बीत गया + अब तक unpaid → OVERDUE + subscription PAST_DUE
   * 3. PAST_DUE subscription जिसकी OVERDUE invoice `graceDays` से पुरानी → EXPIRED (autoRenew off)
   */
  async runBillingCycle(now: Date = new Date(), graceDays = 7) {
    const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const summary = { renewed: 0, markedOverdue: 0, pastDue: 0, expired: 0 };

    // 1. renewal
    const dueForRenewal = await prisma.companySubscription.findMany({
      where: { autoRenew: true, status: { in: ['ACTIVE', 'PAST_DUE'] }, endDate: { lte: soon } },
      include: { plan: true },
    });
    for (const sub of dueForRenewal) {
      const yearly = sub.plan.billingCycle === 'YEARLY';
      const periodStart = sub.endDate && sub.endDate > now ? sub.endDate : now;
      const periodEnd = new Date(periodStart.getTime() + (yearly ? 365 : 30) * 24 * 60 * 60 * 1000);
      const already = await prisma.subscriptionInvoice.findFirst({
        where: { subscriptionId: sub.id, periodStart, status: { in: ['PENDING', 'PAID'] } },
      });
      if (already) continue;
      await prisma.subscriptionInvoice.create({
        data: {
          companyId: sub.companyId,
          subscriptionId: sub.id,
          planId: sub.planId,
          amount: yearly ? Number(sub.plan.priceYearly) : Number(sub.plan.priceMonthly),
          billingCycle: sub.plan.billingCycle,
          periodStart,
          periodEnd,
        },
      });
      summary.renewed++;
    }

    // 2. overdue
    const nowOverdue = await prisma.subscriptionInvoice.findMany({
      where: { status: 'PENDING', periodEnd: { lt: now } },
    });
    for (const inv of nowOverdue) {
      await prisma.subscriptionInvoice.update({ where: { id: inv.id }, data: { status: 'OVERDUE' } });
      summary.markedOverdue++;
      const upd = await prisma.companySubscription.updateMany({
        where: { id: inv.subscriptionId, status: { in: ['ACTIVE', 'TRIAL'] } },
        data: { status: 'PAST_DUE', updatedAt: now },
      });
      summary.pastDue += upd.count;
    }

    // 3. expire after grace
    const graceCutoff = new Date(now.getTime() - graceDays * 24 * 60 * 60 * 1000);
    const staleOverdue = await prisma.subscriptionInvoice.findMany({
      where: { status: 'OVERDUE', periodEnd: { lt: graceCutoff } },
    });
    for (const inv of staleOverdue) {
      const upd = await prisma.companySubscription.updateMany({
        where: { id: inv.subscriptionId, status: 'PAST_DUE' },
        data: { status: 'EXPIRED', autoRenew: false, updatedAt: now },
      });
      summary.expired += upd.count;
    }

    return summary;
  }
}

export const subscriptionService = new SubscriptionService();
