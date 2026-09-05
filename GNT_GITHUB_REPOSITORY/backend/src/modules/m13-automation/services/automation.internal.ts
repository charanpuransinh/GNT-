// ============================================================================
// M13 — Action Executor (internal rule engine का दिल)
//
// blueprint §7.13: M13 USES M16 (Notification) — सीधे tables नहीं, सिर्फ़
// public API से। FORBIDDEN: direct financial posting, direct stock modification.
//
// action types:
//   NOTIFY  — M16 notificationService से संदेश ({{key}} templates payload से भरते हैं)
//   WEBHOOK — बाहरी URL पर POST (network बंद environment में FAILED log होगा — कोई झूठ नहीं)
//   LOG     — execution log में दर्ज
// ============================================================================

import { notificationService } from '@/modules/m16-notification';
import type {
  SendNotificationPayload,
  NotificationChannel,
  NotificationEntityType,
} from '@/modules/m16-notification';
import type { AutomationRuleView, AutomationAction } from '../types/m13.types';

export interface ActionRunResult {
  ok: boolean;
  message: string;
  steps: string[];
}

/** {{key}} को payload के मान से भरना; ग़ायब key पर साफ़ गलती (चुपचाप ख़ाली नहीं) */
function applyTemplate(text: string, payload: Record<string, unknown>): string {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => {
    const value = key.split('.').reduce<unknown>((acc, k) => {
      if (acc && typeof acc === 'object' && k in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[k];
      }
      return undefined;
    }, payload);
    if (value === undefined || value === null) {
      throw new Error(`template key ग़ायब है: "${key}"`);
    }
    return String(value);
  });
}

function configString(config: Record<string, unknown>, key: string): string | undefined {
  const v = config[key];
  return typeof v === 'string' ? v : undefined;
}

function configRecord(config: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const v = config[key];
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;
}

async function runNotifyAction(
  action: AutomationAction,
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const cfg = action.config;
  const userId = configString(cfg, 'userId');
  if (!userId) {
    throw new Error('NOTIFY action में userId ज़रूरी है');
  }
  const title = applyTemplate(configString(cfg, 'title') ?? 'GNT सूचना', payload);
  const message = applyTemplate(configString(cfg, 'message') ?? '', payload);
  const channel = (configString(cfg, 'channel') ?? 'in_app') as NotificationChannel;
  const entityType = (configString(cfg, 'entityType') ?? 'payment') as NotificationEntityType;

  const sendPayload: SendNotificationPayload = {
    userId,
    companyId: tenantId,
    title,
    message,
    type: channel,
    entityType,
    channels: [channel],
    priority: 'normal',
  };
  const result = await notificationService.sendNotification(sendPayload);
  return `NOTIFY ok (${result.notificationId})`;
}

async function runWebhookAction(action: AutomationAction, payload: Record<string, unknown>): Promise<string> {
  const url = configString(action.config, 'url');
  if (!url) {
    throw new Error('WEBHOOK action में url ज़रूरी है');
  }
  const method = (configString(action.config, 'method') ?? 'POST').toUpperCase();
  const extraHeaders = configRecord(action.config, 'headers');
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(extraHeaders
      ? Object.fromEntries(Object.entries(extraHeaders).map(([k, v]) => [k, String(v)]))
      : {}),
  };
  const response = await fetch(url, {
    method,
    headers,
    body: JSON.stringify({ payload }),
  });
  if (!response.ok) {
    throw new Error(`WEBHOOK ${method} ${url} → HTTP ${response.status}`);
  }
  return `WEBHOOK ok (${method} ${url})`;
}

function runLogAction(action: AutomationAction, payload: Record<string, unknown>): string {
  const text = configString(action.config, 'message') ?? 'LOG action';
  return `LOG: ${applyTemplate(text, payload)}`;
}

/**
 * Rule के सारे actions क्रम से चलाना। पहली ग़लती पर रुककर FAILED नतीजा —
 * आधा-अधूरा "सफल" कभी नहीं बताया जाता।
 */
export async function executeRuleActions(
  rule: AutomationRuleView,
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<ActionRunResult> {
  const steps: string[] = [];
  try {
    for (const action of rule.actions) {
      let step: string;
      switch (action.type) {
        case 'NOTIFY':
          step = await runNotifyAction(action, tenantId, payload);
          break;
        case 'WEBHOOK':
          step = await runWebhookAction(action, payload);
          break;
        case 'LOG':
          step = runLogAction(action, payload);
          break;
        default:
          throw new Error(`अज्ञात action type: "${String(action.type)}"`);
      }
      steps.push(step);
    }
    return { ok: true, message: steps.join(' | '), steps };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message, steps };
  }
}
