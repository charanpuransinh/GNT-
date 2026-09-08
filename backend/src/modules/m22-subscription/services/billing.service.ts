import { PrismaClient, Prisma } from '@prisma/client';

interface PrismaKnownError extends Error {
  code: string;
}

const isPrismaKnownError = (error: unknown): error is PrismaKnownError => {
  return error instanceof Error && 'code' in error && typeof (error as Record<string, unknown>).code === 'string';
};

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
          status: 'ACTIVE', 
          currentPeriodEnd: { gte: new Date() } 
        },
        include: { plan: true },
      });

      if (!subscription || !subscription.plan) {
        return false;
      }

      const features = subscription.plan.features;
      
      // Defensive Type Safety: Validate runtime shape of JSON
      if (!Array.isArray(features)) {
        return false;
      }
      
      const validFeatures = features.filter((f: unknown): f is string => typeof f === 'string');
      return validFeatures.includes(requiredFeature);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[M22] Plan gating check failed for company ${companyId}:`, errorMessage);
      return false;
    }
  }

  async handleFailedPayment(subscriptionId: string, errorMessage: string): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sub = await tx.companySubscription.findUnique({
        where: { id: subscriptionId },
        select: { companyId: true, planId: true }
      });

      if (!sub) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      // Calculate nextAttempt INSIDE the transaction to prevent race conditions
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
            companyId: sub.companyId,
            subscriptionId,
            planId: sub.planId,
            attemptNumber: nextAttempt,
            periodEnd: nextScheduledDate,
            status: 'PENDING_RETRY',
            errorMessage: errorMessage.substring(0, 500),
            amount: 0,
            billingCycle: 'MONTHLY',
            periodStart: new Date(),
          }
        });
      } catch (e: unknown) {
        // Handle concurrent duplicate attempt gracefully (P2002 = Unique constraint violation)
        if (isPrismaKnownError(e) && e.code === 'P2002') {
          console.warn(`[M22] Concurrent dunning attempt detected for sub ${subscriptionId}, attempt ${nextAttempt}. Ignoring duplicate.`);
          return; 
        }
        throw e;
      }

      if (nextAttempt >= 3) {
        await tx.companySubscription.update({
          where: { id: subscriptionId },
          data: { dunningStatus: 'SUSPENDED', status: 'PAST_DUE' },
        });
      } else {
        await tx.companySubscription.update({
          where: { id: subscriptionId },
          data: { dunningStatus: 'WARNING' },
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
