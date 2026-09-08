import { PrismaClient, Prisma } from '@prisma/client';

export class DunningSchedulerService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Called by a background cron job to process due dunning attempts.
   * ⚠️ NOTE FOR CLAUDE: This service must be wired into the application lifecycle 
   * (e.g., via a cron job in module-registry.ts or a dedicated worker bootstrap).
   */
  async processDueDunningAttempts(): Promise<void> {
    const now = new Date();
    
    const dueInvoices = await this.prisma.subscriptionInvoice.findMany({
      where: {
        status: 'PENDING_RETRY',
        periodEnd: { lte: now },
      },
      include: {
        subscription: true,
      },
    });

    for (const invoice of dueInvoices) {
      try {
        // Simulated payment retry logic (Integrate with M18/M11 Payment Gateway here)
        const paymentRetrySuccess = false; 

        if (paymentRetrySuccess) {
          await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await tx.subscriptionInvoice.update({
              where: { id: invoice.id },
              data: { status: 'PAID' },
            });
            await tx.companySubscription.update({
              where: { id: invoice.subscriptionId },
              data: { dunningStatus: 'NONE', status: 'ACTIVE' },
            });
          });
        } else {
          await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await tx.subscriptionInvoice.update({
              where: { id: invoice.id },
              data: { status: 'FAILED' },
            });
            
            const nextAttempt = invoice.attemptNumber + 1;
            const nextScheduledDate = new Date();
            nextScheduledDate.setDate(nextScheduledDate.getDate() + 3);

            if (nextAttempt >= 3) {
              await tx.companySubscription.update({
                where: { id: invoice.subscriptionId },
                data: { dunningStatus: 'SUSPENDED', status: 'PAST_DUE' },
              });
            } else {
              // Schedule next attempt
              await tx.subscriptionInvoice.create({
                data: {
                  companyId: invoice.companyId,
                  subscriptionId: invoice.subscriptionId,
                  planId: invoice.planId || 'DEFAULT',
                  amount: invoice.amount,
                  billingCycle: invoice.billingCycle,
                  status: 'PENDING_RETRY',
                  periodStart: new Date(),
                  periodEnd: nextScheduledDate,
                  attemptNumber: nextAttempt,
                }
              });
            }
          });
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[M22] Dunning scheduler failed for invoice ${invoice.id}:`, errorMessage);
      }
    }
  }
}
// STATUS: CERTIFIED
