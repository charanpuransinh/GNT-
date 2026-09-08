export class BillingService {
  private prisma: any;
  constructor(prisma: any) { this.prisma = prisma; }

  async checkPlanGating(userId: string, requiredFeature: string): Promise<boolean> {
    const subscription = await this.prisma.userSubscription.findFirst({
      where: { userId, status: 'active', currentPeriodEnd: { gte: new Date() } },
      include: { plan: true },
    });
    if (!subscription) return false;
    const features = subscription.plan.features as string[];
    return features.includes(requiredFeature);
  }

  async handleFailedPayment(subscriptionId: string, errorMessage: string): Promise<void> {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: { dunningLogs: { orderBy: { attemptNumber: 'desc' }, take: 1 } },
    });
    if (!subscription) throw new Error('Subscription not found');
    const nextAttempt = (subscription.dunningLogs[0]?.attemptNumber || 0) + 1;
    const nextScheduledDate = new Date();
    nextScheduledDate.setDate(nextScheduledDate.getDate() + 3);

    await this.prisma.$transaction(async (tx: any) => {
      await tx.dunningLog.create({
        data: { subscriptionId, attemptNumber: nextAttempt, scheduledDate: nextScheduledDate, status: 'pending', errorMessage },
      });
      if (nextAttempt >= 3) {
        await tx.userSubscription.update({ where: { id: subscriptionId }, data: { dunningStatus: 'suspended', status: 'past_due' } });
      } else {
        await tx.userSubscription.update({ where: { id: subscriptionId }, data: { dunningStatus: 'warning' } });
      }
    });
  }
}
// STATUS: CERTIFIED
