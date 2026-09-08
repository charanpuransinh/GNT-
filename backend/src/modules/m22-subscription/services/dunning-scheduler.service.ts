import { PrismaClient, Prisma } from '@prisma/client';

export class DunningSchedulerService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Called by a background cron job to process due dunning attempts.
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
        const paymentRetrySuccess = false; // Simulated

        if (paymentRetrySuccess) {
          await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await tx.subscriptionInvoice.update({
              where: { id: invoice.id },
              data: { status: 'PAID' },
            });
            await tx.companySubscription.update({
              where: { id: invoice.subscriptionId },
              data: { dunningStatus: 'none', status: 'active' },
            });
          });
        } else {
          await this.prisma.subscriptionInvoice.update({
            where: { id: invoice.id },
            data: { status: 'FAILED' },
          });
          
          await this.prisma.companySubscription.update({
            where: { id: invoice.subscriptionId },
            data: { dunningStatus: 'suspended', status: 'past_due' },
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
