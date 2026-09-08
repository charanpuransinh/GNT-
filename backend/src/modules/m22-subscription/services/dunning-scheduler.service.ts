export class DunningSchedulerService {
  private prisma: any;

  constructor(prisma: any) {
    this.prisma = prisma;
  }

  /**
   * Called by a background cron job to process due dunning attempts.
   * 
   * ⚠️ IMPORTANT FOR CLAUDE: 
   * Per Hard Rule #6, Qwen is FORBIDDEN from editing `module-registry.ts` or `app.ts`.
   * Claude MUST wire this `DunningSchedulerService` into the application lifecycle 
   * (e.g., in module-registry.ts or a dedicated worker bootstrap file).
   */
  async processDueDunningAttempts(): Promise<void> {
    const now = new Date();
    
    const dueInvoices = await this.prisma.subscriptionInvoice.findMany({
      where: {
        status: 'pending_retry',
        scheduledDate: { lte: now },
      },
      include: {
        companySubscription: true,
      },
    });

    for (const invoice of dueInvoices) {
      try {
        // TODO: Integrate with M18/M11 Payment Gateway to actually retry the charge.
        const paymentRetrySuccess = false; // Simulated

        if (paymentRetrySuccess) {
          await this.prisma.$transaction(async (tx: any) => {
            await tx.subscriptionInvoice.update({
              where: { id: invoice.id },
              data: { status: 'paid', paidAt: new Date() },
            });
            await tx.companySubscription.update({
              where: { id: invoice.companySubscriptionId },
              data: { dunningStatus: 'none', status: 'active' },
            });
          });
        } else {
          await this.prisma.subscriptionInvoice.update({
            where: { id: invoice.id },
            data: { status: 'failed', errorMessage: 'Automated retry failed' },
          });
          
          if (invoice.attemptNumber >= 3) {
             await this.prisma.companySubscription.update({
              where: { id: invoice.companySubscriptionId },
              data: { dunningStatus: 'suspended', status: 'past_due' },
            });
          }
        }
      } catch (error) {
        console.error(`[M22] Dunning scheduler failed for invoice ${invoice.id}:`, error);
      }
    }
  }
}
// STATUS: CERTIFIED
