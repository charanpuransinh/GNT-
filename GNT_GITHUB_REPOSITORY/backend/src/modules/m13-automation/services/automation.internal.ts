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

// ⚠️ SSRF सुरक्षा — पहले यहाँ कोई जाँच नहीं थी: कोई भी tenant अपने automation rule
// के WEBHOOK action में `url: "http://169.254.169.254/..."` या
// `http://localhost:5432` जैसा पता डालकर server से ख़ुद अपने internal network पर
// request करवा सकता था (cloud metadata endpoint, internal services)। अब सिर्फ़
// public HTTPS host को इजाज़त है, redirect बंद है, URL में credentials मना हैं,
// और request 10 सेकंड में timeout होती है (अटकी हुई webhook किसी और job को न रोके)।
function assertSafeWebhookUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error('WEBHOOK url अमान्य है');
  }
  if (u.protocol !== 'https:') throw new Error('WEBHOOK url सिर्फ़ https:// हो सकता है');
  if (u.username || u.password) throw new Error('WEBHOOK url में credentials मना हैं');
  const h = u.hostname.toLowerCase();
  if (
    h === 'localhost' || h.endsWith('.localhost') || h === '127.0.0.1' || h === '::1' ||
    h.startsWith('10.') || h.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(h) || h.startsWith('169.254.')
  ) {
    throw new Error('WEBHOOK निजी/internal नेटवर्क पते पर नहीं जा सकता');
  }
  return u;
}

async function runWebhookAction(action: AutomationAction, payload: Record<string, unknown>): Promise<string> {
  const url = configString(action.config, 'url');
  if (!url) {
    throw new Error('WEBHOOK action में url ज़रूरी है');
  }
  const safeUrl = assertSafeWebhookUrl(url);
  const method = (configString(action.config, 'method') ?? 'POST').toUpperCase();
  if (!/^(GET|POST|PUT|PATCH|DELETE)$/.test(method)) {
    throw new Error(`WEBHOOK method अमान्य: "${method}"`);
  }
  const extraHeaders = configRecord(action.config, 'headers');
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(extraHeaders
      ? Object.fromEntries(
          Object.entries(extraHeaders)
            .filter(([k]) => !['host', 'content-length'].includes(k.toLowerCase()))
            .map(([k, v]) => [k, String(v)]),
        )
      : {}),
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(safeUrl, {
      method,
      headers,
      body: method === 'GET' ? undefined : JSON.stringify({ payload }),
      redirect: 'error',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`WEBHOOK ${method} ${url} → HTTP ${response.status}`);
    }
    return `WEBHOOK ok (${method} ${url})`;
  } finally {
    clearTimeout(timer);
  }
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
