// ============================================================================
// M22 — Subscription service ki jaanch (DB-gated): plan CRUD + subscribe/cancel
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { subscriptionService } from '../../services/subscription.service';

const COMPANY_ID = '00000000-0000-4000-8000-000000000096';

async function cleanup() {
  await prisma.companySubscription.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.subscriptionPlan.deleteMany({ where: { code: { in: ['BASIC-TEST', 'PRO-TEST', 'GATE-TEST', 'ALL-TEST', 'TRIAL-TEST', 'INV-TEST', 'DUN-TEST', 'PAY-TEST', 'RENEW-TEST'] } } });
}

describe.runIf(process.env.TEST_DB === '1')('M22 subscription — live DB', () => {
  beforeAll(async () => {
    await prisma.company_master.upsert({
      where: { id: COMPANY_ID },
      update: { name: 'Sub Co' },
      create: { id: COMPANY_ID, name: 'Sub Co', code: 'SUBCO' },
    });
    await cleanup();
  });

  afterAll(cleanup);

  it('plan create → list → subscribe → active → cancel', async () => {
    const plan = await subscriptionService.createPlan({
      code: 'BASIC-TEST', name: 'Basic', priceMonthly: 299, priceYearly: 2999,
      features: ['gst', 'inventory'],
    });
    expect(plan.id).toBeTruthy();

    const plans = await subscriptionService.listPlans();
    expect(plans.some((p) => p.id === plan.id)).toBe(true);

    await subscriptionService.subscribe(COMPANY_ID, { planId: plan.id });
    const active = await subscriptionService.getActiveSubscription(COMPANY_ID);
    expect(active).toBeTruthy();
    expect(active!.planId).toBe(plan.id);
    expect(active!.status).toBe('ACTIVE');

    await subscriptionService.cancelSubscription(COMPANY_ID);
    const cancelled = await subscriptionService.getActiveSubscription(COMPANY_ID);
    expect(cancelled!.status).toBe('CANCELLED');
  });

  it('dusra plan subscribe → upsert (companyId unique, nayi row nahi)', async () => {
    const p1 = await subscriptionService.createPlan({ code: 'PRO-TEST', name: 'Pro', priceMonthly: 599, priceYearly: 5999 });
    await subscriptionService.subscribe(COMPANY_ID, { planId: p1.id });

    const count = await prisma.companySubscription.count({ where: { companyId: COMPANY_ID } });
    expect(count).toBe(1);
  });

  it('feature gate: plan ke features ke hisaab se access milta/rukta hai', async () => {
    const p = await subscriptionService.createPlan({
      code: 'GATE-TEST', name: 'Gated', priceMonthly: 199, priceYearly: 1999,
      features: ['gst', 'inventory'],
    });
    await subscriptionService.subscribe(COMPANY_ID, { planId: p.id });

    expect(await subscriptionService.canAccess(COMPANY_ID, 'gst')).toBe(true);
    expect(await subscriptionService.canAccess(COMPANY_ID, 'inventory')).toBe(true);
    expect(await subscriptionService.canAccess(COMPANY_ID, 'hr')).toBe(false);

    await subscriptionService.cancelSubscription(COMPANY_ID);
    expect(await subscriptionService.canAccess(COMPANY_ID, 'gst')).toBe(false);
  });

  it('feature gate: wildcard (*) sab khol deta hai', async () => {
    const p = await subscriptionService.createPlan({
      code: 'ALL-TEST', name: 'All', priceMonthly: 999, priceYearly: 9999,
      features: ['*'],
    });
    await subscriptionService.subscribe(COMPANY_ID, { planId: p.id });

    expect(await subscriptionService.canAccess(COMPANY_ID, 'anything')).toBe(true);
  });

  it('trial shuru hota hai — status TRIAL + endDate ~7 din + feature access', async () => {
    const p = await subscriptionService.createPlan({
      code: 'TRIAL-TEST', name: 'Trial Plan', priceMonthly: 299, priceYearly: 2999,
      features: ['gst'],
    });
    const sub = await subscriptionService.startTrial(COMPANY_ID, p.id);

    expect(sub.status).toBe('TRIAL');
    expect(sub.endDate).toBeTruthy();
    // trial active hai to feature bhi milta hai
    expect(await subscriptionService.canAccess(COMPANY_ID, 'gst')).toBe(true);
  });

  it('billing: invoice generate → list → paid', async () => {
    const p = await subscriptionService.createPlan({
      code: 'INV-TEST', name: 'Invoice Plan', priceMonthly: 499, priceYearly: 4999,
      billingCycle: 'MONTHLY',
    });
    await subscriptionService.subscribe(COMPANY_ID, { planId: p.id });

    const inv = await subscriptionService.generateInvoice(COMPANY_ID);
    expect(inv.amount.toString()).toBe('499');
    expect(inv.status).toBe('PENDING');

    const list = await subscriptionService.listInvoices(COMPANY_ID);
    expect(list.some((i) => i.id === inv.id)).toBe(true);

    const paid = await subscriptionService.markInvoicePaid(inv.id, COMPANY_ID);
    expect(paid!.status).toBe('PAID');
  });

  it('billing lifecycle: unpaid invoice period beet gaya → OVERDUE + PAST_DUE; grace ke baad EXPIRED', async () => {
    const p = await subscriptionService.createPlan({
      code: 'DUN-TEST', name: 'Dunning Plan', priceMonthly: 100, priceYearly: 1000, billingCycle: 'MONTHLY',
    });
    await subscriptionService.subscribe(COMPANY_ID, { planId: p.id });
    const sub = await subscriptionService.getActiveSubscription(COMPANY_ID);

    // invoice jiska period 2 din pehle khatam hua + unpaid
    const periodEnd = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await prisma.subscriptionInvoice.create({
      data: {
        companyId: COMPANY_ID, subscriptionId: sub!.id, planId: p.id, amount: 100,
        billingCycle: 'MONTHLY', status: 'PENDING',
        periodStart: new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000), periodEnd,
      },
    });

    // aaj chalao → OVERDUE + PAST_DUE (abhi grace ke andar hai)
    const s1 = await subscriptionService.runBillingCycle(new Date());
    expect(s1.markedOverdue).toBeGreaterThanOrEqual(1);
    expect(s1.pastDue).toBeGreaterThanOrEqual(1);
    expect((await subscriptionService.getActiveSubscription(COMPANY_ID))!.status).toBe('PAST_DUE');

    // 10 din baad chalao → OVERDUE invoice grace (7 din) se purani → EXPIRED
    const s2 = await subscriptionService.runBillingCycle(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000));
    expect(s2.expired).toBeGreaterThanOrEqual(1);
    expect((await subscriptionService.getActiveSubscription(COMPANY_ID))!.status).toBe('EXPIRED');

    await prisma.companySubscription.deleteMany({ where: { companyId: COMPANY_ID } });
    await prisma.subscriptionPlan.deleteMany({ where: { code: 'DUN-TEST' } });
  });

  it('billing lifecycle: PAST_DUE subscription ka invoice pay karne par ACTIVE + period aage badhta hai', async () => {
    const p = await subscriptionService.createPlan({
      code: 'PAY-TEST', name: 'Reactivate Plan', priceMonthly: 200, priceYearly: 2000, billingCycle: 'MONTHLY',
    });
    await subscriptionService.subscribe(COMPANY_ID, { planId: p.id });
    const sub = await subscriptionService.getActiveSubscription(COMPANY_ID);

    const futureEnd = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    const inv = await prisma.subscriptionInvoice.create({
      data: {
        companyId: COMPANY_ID, subscriptionId: sub!.id, planId: p.id, amount: 200,
        billingCycle: 'MONTHLY', status: 'OVERDUE',
        periodStart: new Date(), periodEnd: futureEnd,
      },
    });
    await prisma.companySubscription.update({ where: { id: sub!.id }, data: { status: 'PAST_DUE' } });

    await subscriptionService.markInvoicePaid(inv.id, COMPANY_ID);
    const after = await subscriptionService.getActiveSubscription(COMPANY_ID);
    expect(after!.status).toBe('ACTIVE');
    expect(after!.endDate!.getTime()).toBe(futureEnd.getTime());

    await prisma.companySubscription.deleteMany({ where: { companyId: COMPANY_ID } });
    await prisma.subscriptionPlan.deleteMany({ where: { code: 'PAY-TEST' } });
  });

  it('auto-renew: period ~2 din me khatam → runBillingCycle agla invoice bana deta hai', async () => {
    const p = await subscriptionService.createPlan({
      code: 'RENEW-TEST', name: 'Renew Plan', priceMonthly: 350, priceYearly: 3500, billingCycle: 'MONTHLY',
    });
    await subscriptionService.subscribe(COMPANY_ID, { planId: p.id, autoRenew: true });
    const sub = await subscriptionService.getActiveSubscription(COMPANY_ID);
    await prisma.companySubscription.update({
      where: { id: sub!.id },
      data: { endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
    });

    const s = await subscriptionService.runBillingCycle();
    expect(s.renewed).toBeGreaterThanOrEqual(1);
    const invs = await subscriptionService.listInvoices(COMPANY_ID);
    expect(invs.length).toBeGreaterThanOrEqual(1);

    await prisma.companySubscription.deleteMany({ where: { companyId: COMPANY_ID } });
    await prisma.subscriptionPlan.deleteMany({ where: { code: 'RENEW-TEST' } });
  });
});
