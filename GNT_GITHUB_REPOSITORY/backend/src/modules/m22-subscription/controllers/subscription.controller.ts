// M22 — Subscription controller (HTTP handlers)
import { Request, Response } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { subscriptionService } from '../services/subscription.service';
import { createPlanSchema, updatePlanSchema, subscribeSchema, startTrialSchema } from '../validators/subscription.schema';

export class SubscriptionController {
  async listPlans(_req: Request, res: Response) {
    try {
      const plans = await subscriptionService.listPlans();
      res.json({ success: true, data: plans });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createPlan(req: Request, res: Response) {
    try {
      const parsed = createPlanSchema.parse(req.body);
      const plan = await subscriptionService.createPlan(parsed);
      res.status(201).json({ success: true, data: plan });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updatePlan(req: Request, res: Response) {
    try {
      const parsed = updatePlanSchema.parse(req.body);
      const plan = await subscriptionService.updatePlan(String(req.params.id), parsed);
      res.json({ success: true, data: plan });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async subscribe(req: Request, res: Response) {
    try {
      const companyId = requireTenant(req).companyId;
      const parsed = subscribeSchema.parse(req.body);
      const sub = await subscriptionService.subscribe(companyId, {
        planId: parsed.planId,
        autoRenew: parsed.autoRenew,
        endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
      });
      res.status(201).json({ success: true, data: sub });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getActive(req: Request, res: Response) {
    try {
      const companyId = requireTenant(req).companyId;
      const sub = await subscriptionService.getActiveSubscription(companyId);
      res.json({ success: true, data: sub });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const companyId = requireTenant(req).companyId;
      const sub = await subscriptionService.cancelSubscription(companyId);
      res.json({ success: true, data: sub });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async startTrial(req: Request, res: Response) {
    try {
      const companyId = requireTenant(req).companyId;
      const { planId, trialDays } = startTrialSchema.parse(req.body);
      const sub = await subscriptionService.startTrial(companyId, planId, trialDays);
      res.status(201).json({ success: true, data: sub });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async checkAccess(req: Request, res: Response) {
    try {
      const companyId = requireTenant(req).companyId;
      const feature = String(req.params.feature);
      const allowed = await subscriptionService.canAccess(companyId, feature);
      res.json({ success: true, data: { feature, allowed } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async generateInvoice(req: Request, res: Response) {
    try {
      const companyId = requireTenant(req).companyId;
      const invoice = await subscriptionService.generateInvoice(companyId);
      res.status(201).json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async listInvoices(req: Request, res: Response) {
    try {
      const companyId = requireTenant(req).companyId;
      const invoices = await subscriptionService.listInvoices(companyId);
      res.json({ success: true, data: invoices });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** cron / platform-admin — पूरे system का billing cycle चलाओ */
  async runBilling(_req: Request, res: Response) {
    try {
      const summary = await subscriptionService.runBillingCycle();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const subscriptionController = new SubscriptionController();
