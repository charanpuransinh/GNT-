import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WorkflowEngine } from '../engine/WorkflowEngine';
import crypto from 'crypto';

export class WebhookController {
  constructor(
    private prisma: PrismaClient,
    private engine: WorkflowEngine
  ) {}

  static async receive(req: Request, res: Response) {
    const { workflowId } = req.params;
    const signature = req.headers['x-webhook-signature'] as string;

    const prisma = req.app.get('prisma');
    const engine = req.app.get('workflowEngine');
    const controller = new WebhookController(prisma, engine);

    try {
      const workflow = await prisma.workflow.findFirst({
        where: { id: workflowId, status: 'ACTIVE', deletedAt: null }
      });

      if (!workflow) {
        return res.status(404).json({ error: 'M13-AUT-001' });
      }

      const secret = workflow.triggerConfig?.webhookSecret;
      if (secret && signature) {
        const expected = crypto
          .createHmac('sha256', secret)
          .update(JSON.stringify(req.body))
          .digest('hex');

        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
          return res.status(401).json({ error: 'M13-AUT-006' });
        }
      }

      res.status(202).json({ received: true });

      await engine.execute(workflowId, req.body, {
        tenantId: workflow.tenantId,
        triggerSource: 'WEBHOOK',
        workflowId
      });

    } catch (error) {
      console.error('Webhook processing error:', error);
    }
  }
}
