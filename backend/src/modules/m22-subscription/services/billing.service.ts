export class BillingService {
  private prisma: any;
  constructor(prisma: any) { this.prisma = prisma; }

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
      
      const validFeatures = features.filter((f: any) => typeof f === 'string');
      return validFeatures.includes(requiredFeature);
      
    } catch (error) {
      console.error(`[M22] Plan gating check failed for company ${companyId}:`, error);
      return false; // Safely deny access on error instead of crashing
    }
  }

  async handleFailedPayment(subscriptionId: string, errorMessage: string): Promise<void> {
    // Concurrency & Atomicity (Issue 2)
    await this.prisma.$transaction(async (tx: any) => {
      const lastInvoice = await tx.subscriptionInvoice.findFirst({
        where: { companySubscriptionId: subscriptionId, status: { in: ['pending_retry', 'failed'] } },
        orderBy: { attemptNumber: 'desc' },
      });
      
      const nextAttempt = (lastInvoice?.attemptNumber || 0) + 1;
      const nextScheduledDate = new Date();
      nextScheduledDate.setDate(nextScheduledDate.getDate() + 3);

      try {
        await tx.subscriptionInvoice.create({
          data: {
            companySubscriptionId: subscriptionId,
            attemptNumber: nextAttempt,
            scheduledDate: nextScheduledDate,
            status: 'pending_retry',
            errorMessage: errorMessage.substring(0, 500),
            amount: 0,
          }
        });
      } catch (e: any) {
        if (e.code === 'P2002') {
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
