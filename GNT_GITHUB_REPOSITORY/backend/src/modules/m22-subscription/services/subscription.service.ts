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

  /** PAST_DUE / delinquency के बाद grace कब तक — canAccess और runBillingCycle दोनों यही मानते हैं */
  static readonly GRACE_DAYS = 7;

  /**
   * Feature gate: कंपनी के plan में यह feature है या नहीं।
   * `features: ['*']` = सब कुछ खुला।
   * - EXPIRED / CANCELLED → नहीं
   * - ACTIVE / TRIAL: endDate बीत चुका हो तो नहीं (billing run से पहले भी fail-safe)
   * - PAST_DUE: सिर्फ़ grace window के अंदर — सबसे पुरानी unpaid (OVERDUE/PENDING) invoice का
   *   periodEnd `GRACE_DAYS` से ज़्यादा पुराना हो तो access बंद, चाहे billing cron रुका हुआ हो।
   */
  async canAccess(companyId: string, feature: string): Promise<boolean> {
    const sub = await prisma.companySubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });
    if (!sub) return false;
    if (sub.status === 'EXPIRED' || sub.status === 'CANCELLED') return false;
    const nowMs = Date.now();
    if ((sub.status === 'ACTIVE' || sub.status === 'TRIAL') && sub.endDate && sub.endDate.getTime() < nowMs) {
      return false;
    }
    if (sub.status === 'PAST_DUE') {
      const oldestUnpaid = await prisma.subscriptionInvoice.findFirst({
        where: { subscriptionId: sub.id, status: { in: ['OVERDUE', 'PENDING'] } },
        orderBy: { periodEnd: 'asc' },
      });
      const graceMs = SubscriptionService.GRACE_DAYS * 24 * 60 * 60 * 1000;
      if (oldestUnpaid && nowMs - oldestUnpaid.periodEnd.getTime() > graceMs) return false;
    }
    const features = (sub.plan.features ?? []) as unknown as string[];
    if (features.includes('*')) return true;
    return features.includes(feature);
  }

  // ── Billing ──────────────────────────────────────────────

  /** अगले billing period की शुरुआत — मौजूदा endDate के बाद (या अभी, अगर बीत चुका) */
  private static nextPeriodStart(endDate: Date | null, now: Date): Date {
    return endDate && endDate.getTime() > now.getTime() ? endDate : now;
  }

  private static periodEndFrom(periodStart: Date, yearly: boolean): Date {
    return new Date(periodStart.getTime() + (yearly ? 365 : 30) * 24 * 60 * 60 * 1000);
  }

  /**
   * इस subscription के अगले period का invoice — plan की कीमत से।
   * पहले से एक PENDING/PAID invoice इसी periodStart पर हो तो वही लौटाओ (कोई duplicate नहीं;
   * DB का `@@unique([subscriptionId, periodStart])` भी concurrency में duplicate रोकता है)।
   */
  async generateInvoice(companyId: string) {
    const sub = await prisma.companySubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });
    if (!sub) throw new Error('No active subscription');
    if (sub.status !== 'ACTIVE' && sub.status !== 'TRIAL') throw new Error('Subscription not active');

    const now = new Date();
    const yearly = sub.plan.billingCycle === 'YEARLY';
    const periodStart = SubscriptionService.nextPeriodStart(sub.endDate, now);
    return this.createInvoiceOnce(sub.id, sub.companyId, sub.planId, {
      amount: yearly ? Number(sub.plan.priceYearly) : Number(sub.plan.priceMonthly),
      billingCycle: sub.plan.billingCycle,
      periodStart,
      periodEnd: SubscriptionService.periodEndFrom(periodStart, yearly),
    });
  }

  /** idempotent invoice create — (subscriptionId, periodStart) पर unique; race में P2002 → मौजूदा लौटाओ */
  private async createInvoiceOnce(
    subscriptionId: string,
    companyId: string,
    planId: string,
    data: { amount: number; billingCycle: string; periodStart: Date; periodEnd: Date },
  ) {
    const existing = await prisma.subscriptionInvoice.findFirst({
      where: { subscriptionId, periodStart: data.periodStart },
    });
    if (existing) return existing;
    try {
      return await prisma.subscriptionInvoice.create({
        data: { companyId, subscriptionId, planId, ...data },
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && (err as { code?: string }).code === 'P2002') {
        const raced = await prisma.subscriptionInvoice.findFirst({
          where: { subscriptionId, periodStart: data.periodStart },
        });
        if (raced) return raced;
      }
      throw err;
    }
  }

  async listInvoices(companyId: string) {
    return prisma.subscriptionInvoice.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * ⚠️ INTERNAL — इसे HTTP से tenant नहीं बुला सकता। सिर्फ़ payment gateway का verified
   * confirm (M18 webhook → M11 → यहाँ) या platform-admin billing tool। एक tenant अपना ही
   * invoice "paid" मारकर बिना पैसे दिए service renew/reactivate न कर पाए — इसलिए कोई
   * `/invoices/:id/pay` route नहीं है।
   *
   * status PAID + subscription को उस period तक बढ़ाओ (renewal), PAST_DUE/EXPIRED थी तो ACTIVE।
   * `paymentRef` = gateway का transaction id (audit के लिए ज़रूरी)।
   */
  async markInvoicePaid(invoiceId: string, opts: { paymentRef: string; companyId?: string }) {
    if (!opts?.paymentRef) throw new Error('paymentRef (gateway transaction id) required');
    return prisma.$transaction(async (tx) => {
      // atomic: सिर्फ़ तभी PAID करो जब अभी PENDING/OVERDUE हो (race में दोबारा paid न हो)
      const claimed = await tx.subscriptionInvoice.updateMany({
        where: {
          id: invoiceId,
          status: { in: ['PENDING', 'OVERDUE'] },
          ...(opts.companyId ? { companyId: opts.companyId } : {}),
        },
        data: { status: 'PAID' },
      });
      const invoice = await tx.subscriptionInvoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new Error('Invoice not found');
      if (claimed.count === 0) return invoice; // पहले से PAID/CANCELLED — no-op

      const sub = await tx.companySubscription.findUnique({ where: { id: invoice.subscriptionId } });
      if (sub && sub.status !== 'CANCELLED') {
        const newEnd = !sub.endDate || sub.endDate.getTime() < invoice.periodEnd.getTime()
          ? invoice.periodEnd
          : sub.endDate;
        await tx.companySubscription.update({
          where: { id: sub.id },
          data: {
            status: sub.status === 'PAST_DUE' || sub.status === 'EXPIRED' ? 'ACTIVE' : sub.status,
            endDate: newEnd,
            updatedAt: new Date(),
          },
        });
      }
      return invoice;
    });
  }

  /**
   * Billing lifecycle — cron/admin हर दिन एक बार बुलाए (M13 schedule या /billing/run)।
   * 1. auto-renew subs जिनका period ~3 दिन में ख़त्म → अगला invoice generate
   * 2. PENDING invoice जिसका periodEnd बीत गया + अब तक unpaid → OVERDUE + subscription PAST_DUE
   * 3. PAST_DUE subscription जिसकी OVERDUE invoice `graceDays` से पुरानी → EXPIRED (autoRenew off)
   */
  async runBillingCycle(now: Date = new Date(), graceDays = SubscriptionService.GRACE_DAYS) {
    const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const summary = { renewed: 0, markedOverdue: 0, pastDue: 0, expired: 0 };

    // 1. renewal — createInvoiceOnce idempotent + DB unique(subscriptionId, periodStart)
    const dueForRenewal = await prisma.companySubscription.findMany({
      where: { autoRenew: true, status: { in: ['ACTIVE', 'PAST_DUE'] }, endDate: { lte: soon } },
      include: { plan: true },
    });
    for (const sub of dueForRenewal) {
      const yearly = sub.plan.billingCycle === 'YEARLY';
      const periodStart = SubscriptionService.nextPeriodStart(sub.endDate, now);
      const before = await prisma.subscriptionInvoice.findFirst({
        where: { subscriptionId: sub.id, periodStart },
      });
      if (before) continue;
      await this.createInvoiceOnce(sub.id, sub.companyId, sub.planId, {
        amount: yearly ? Number(sub.plan.priceYearly) : Number(sub.plan.priceMonthly),
        billingCycle: sub.plan.billingCycle,
        periodStart,
        periodEnd: SubscriptionService.periodEndFrom(periodStart, yearly),
      });
      summary.renewed++;
    }

    // 2. overdue — atomic PENDING→OVERDUE; अगर बीच में markInvoicePaid चला तो count 0, subscription मत छेड़ो
    const nowOverdue = await prisma.subscriptionInvoice.findMany({
      where: { status: 'PENDING', periodEnd: { lt: now } },
      select: { id: true, subscriptionId: true },
    });
    for (const inv of nowOverdue) {
      const flipped = await prisma.subscriptionInvoice.updateMany({
        where: { id: inv.id, status: 'PENDING' },
        data: { status: 'OVERDUE' },
      });
      if (flipped.count === 0) continue; // concurrently paid — skip
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
