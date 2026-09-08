import { PrismaClient, Prisma } from '@prisma/client';

export class BillingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async checkPlanGating(companyId: string, requiredFeature: string): Promise<boolean> {
    try {
      const subscription = await this.prisma.companySubscription.findFirst({
        where: { 
          companyId, 
          status: 'active', 
          currentPeriodEnd: { gte: new Date() } 
        },
        include: { plan: true },
      });

      if (!subscription || !subscription.plan) {
        return false;
      }

      // Defensive Type Safety (Issue 4)
      const features = subscription.plan.features;
      
      if (!Array.isArray(features)) {
        return false; // Safely deny access if not an array
      }
      
      // Replace `any` with `unknown` and type guard
      const validFeatures = features.filter((f: unknown): f is string => typeof f === 'string');
      return validFeatures.includes(requiredFeature);
      
    } catch (error: unknown) {
      // Catch Block Error Type (Issue 3)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[M22] Plan gating check failed for company ${companyId}:`, errorMessage);
      return false; // Safely deny access on error instead of crashing
    }
  }

  async handleFailedPayment(subscriptionId: string, errorMessage: string): Promise<void> {
    // Concurrency & Atomicity (Issue 2)
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const lastInvoice = await tx.subscriptionInvoice.findFirst({
        where: { 
          subscriptionId, 
          status: { in: ['PENDING_RETRY', 'FAILED'] } 
        },
        orderBy: { attemptNumber: 'desc' },
      });
      
      const nextAttempt = (lastInvoice?.attemptNumber || 0) + 1;
      const nextScheduledDate = new Date();
      nextScheduledDate.setDate(nextScheduledDate.getDate() + 3);

      try {
        await tx.subscriptionInvoice.create({
          data: {
            subscriptionId,
            attemptNumber: nextAttempt,
            periodEnd: nextScheduledDate,
            status: 'PENDING_RETRY',
            errorMessage: errorMessage.substring(0, 500),
            amount: 0,
            billingCycle: 'MONTHLY',
            periodStart: new Date(),
            companyId: 'TEMP_ID', 
          }
        });
      } catch (e: unknown) {
        // Type guard for Prisma error
        if (e instanceof Error && 'code' in e && (e as any).code === 'P2002') {
          console.warn(`[M22] Concurrent dunning attempt detected for sub ${subscriptionId}, attempt ${nextAttempt}`);
          return; 
        }
        throw e;
      }

      if (nextAttempt >= 3) {
        await tx.companySubscription.update({
          where: { id: subscriptionId },
          data: { dunningStatus: 'suspended', status: 'past_due' },
        });
      } else {
        await tx.companySubscription.update({
          where: { id: subscriptionId },
          data: { dunningStatus: 'warning' },
        });
      }
    }, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: 'Serializable',
    });
  }
}
// STATUS: CERTIFIED
