// ============================================================================
// M13 — Event-driven rules: साझा event bus से EVENT trigger वाले rules चलाना
//
// एक rule का गिरना किसी दूसरे event को नहीं रोकेगा; हर run का हिसाब
// job_execution_log में जाता है।
// ============================================================================

import { eventBus } from '@/common/events/event-bus';
import { prisma } from '@/common/config/prisma';
import { AutomationRepository } from '../repositories/automation.repository';
import { executeRuleActions } from '../services/automation.internal';

let registered = false;

function payloadTenant(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as Record<string, unknown>;
  if (typeof p.tenantId === 'string') return p.tenantId;
  if (typeof p.companyId === 'string') return p.companyId;
  return undefined;
}

async function runEventRules(eventName: string, payload: unknown): Promise<void> {
  const repo = new AutomationRepository(prisma);
  const tenantId = payloadTenant(payload);
  const rules = await repo.findActiveRulesByEvent(eventName, tenantId);
  if (rules.length === 0) return;

  const eventPayload: Record<string, unknown> = {
    ...(payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}),
    eventName,
    eventAt: new Date().toISOString(),
  };

  for (const rule of rules) {
    const log = await repo.createLog({
      tenantId: rule.tenantId,
      ruleId: rule.id,
      jobId: null,
      status: 'RUNNING',
    });
    const result = await executeRuleActions(rule, rule.tenantId, eventPayload);
    await repo.finishLog(log.id, rule.tenantId, {
      status: result.ok ? 'SUCCESS' : 'FAILED',
      message: result.message,
      metadata: { steps: result.steps },
    });
  }
}

/** Module चढ़ते ही register — दोबारा चढ़ने पर दोहरा handler नहीं बनेगा */
export function registerAutomationEventHandlers(): void {
  if (registered) return;
  registered = true;
  eventBus.subscribeAll((eventName: string, payload: unknown) => {
    // promise लौटाते हैं ताकि publish का await rule चलने तक रुके (deterministic tests)
    return runEventRules(eventName, payload).catch((error) => {
      console.error(`[M13] event "${eventName}" वाले rules गिरे:`, error);
    });
  });
}
