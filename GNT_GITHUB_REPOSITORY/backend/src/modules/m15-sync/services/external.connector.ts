// ============================================================================
// M15 — External provider connector (Tally / Zoho) — REAL, provider-driven
//
// Pehle fetchExternalEntities hamesha [] return karta tha (honest empty, no fake).
// Ab connectionConfig me ek ACTIVE external integration hone par, sourceSystem ke
// hisaab se Tally (XML) ya Zoho (REST) se asli entities fetch hoti hain.
//
// Fail-closed rules:
//   - koi integration nahi / ACTIVE nahi → [] (honest empty, koi fake sync nahi)
//   - token/host nahi → [] (re-auth ya config chahiye)
//   - real API error (HTTP != 200) → throw (sync job error record kare, chupchap 0-sync nahi)
// ============================================================================

import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { IntegrationService } from './integration.service';

// ─── Pure helpers (unit-testable — no network) ─────────────────────────────

/** Tally XML export request (collection) — entity = report name (Ledger/StockItem/Voucher...) */
export function buildTallyRequest(entity: string): string {
  const safe = String(entity).replace(/[^A-Za-z0-9]/g, '');
  return (
    '<?xml version="1.0"?>\n' +
    '<ENVELOPE>\n' +
    '  <HEADER>\n' +
    '    <VERSION>1</VERSION>\n' +
    '    <TALLYREQUEST>Export</TALLYREQUEST>\n' +
    '    <TYPE>Collection</TYPE>\n' +
    `    <ID>${safe}</ID>\n` +
    '  </HEADER>\n' +
    '  <BODY>\n' +
    '    <DESC>\n' +
    '      <STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES>\n' +
    '    </DESC>\n' +
    '  </BODY>\n' +
    '</ENVELOPE>'
  );
}

/** Tally XML response → flat records (attributes + child elements merged) */
export function parseTallyResponse(xml: string, entity: string): Record<string, unknown>[] {
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, parseAttributeValue: false });
  let doc: any;
  try {
    doc = parser.parse(xml);
  } catch {
    return [];
  }
  const coll = doc?.ENVELOPE?.BODY?.DATA?.COLLECTION;
  if (!coll || typeof coll !== 'object') return [];

  const tag = String(entity).toUpperCase();
  let nodes = coll[tag];
  if (!nodes) return [];
  if (!Array.isArray(nodes)) nodes = [nodes];

  return nodes.map((n: Record<string, unknown>) => flattenTallyRecord(n));
}

function flattenTallyRecord(node: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('@_')) {
      out[k.slice(2)] = v;
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const [nk, nv] of Object.entries(v as Record<string, unknown>)) {
        out[nk] = nv;
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Zoho Books REST request builder → { url, headers } (token baad me lagta hai) */
export function buildZohoRequest(
  baseUrl: string,
  entity: string,
  organizationId?: string
): { url: string; headers: Record<string, string> } {
  const clean = baseUrl.replace(/\/+$/, '');
  const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : '';
  return {
    url: `${clean}/books/v3/${String(entity).replace(/^\/+/, '')}${qs}`,
    headers: { Accept: 'application/json' },
  };
}

// ─── Provider fetchers (network — fail-closed) ─────────────────────────────

async function fetchTally(integration: any, entity: string): Promise<Record<string, unknown>[]> {
  const baseUrl: string | undefined =
    integration.baseUrl ?? (integration.endpoints as Record<string, unknown> | undefined)?.host as string | undefined;
  if (!baseUrl) return [];

  const xml = buildTallyRequest(entity);
  const res = await axios.post(baseUrl, xml, {
    headers: { 'Content-Type': 'text/xml' },
    timeout: 20000,
    validateStatus: () => true,
  });
  if (res.status !== 200) {
    throw new Error(`Tally ${entity} fetch failed: HTTP ${res.status}`);
  }
  return parseTallyResponse(typeof res.data === 'string' ? res.data : JSON.stringify(res.data), entity);
}

async function fetchZoho(integration: any, entity: string): Promise<Record<string, unknown>[]> {
  const baseUrl: string | undefined = integration.baseUrl;
  if (!baseUrl) return [];

  const token = await IntegrationService.getAuthToken(integration.id, integration.tenantId);
  if (!token) return []; // fail-closed: no/expired token → re-auth

  const cfg = (integration.authConfig ?? {}) as Record<string, unknown>;
  const endpoints = (integration.endpoints ?? {}) as Record<string, unknown>;
  const orgId = (endpoints.organizationId ?? cfg.organizationId) as string | undefined;

  const { url, headers } = buildZohoRequest(baseUrl, entity, orgId);
  const res = await axios.get(url, {
    headers: { ...headers, Authorization: `Zoho-oauthtoken ${token}` },
    timeout: 20000,
    validateStatus: () => true,
  });
  if (res.status === 401) throw new Error('Zoho auth failed (token invalid/expired)');
  if (res.status !== 200) throw new Error(`Zoho ${entity} fetch failed: HTTP ${res.status}`);

  const data = res.data ?? {};
  const list = data?.[entity] ?? data?.data ?? [];
  return Array.isArray(list) ? list : [];
}

// ─── Public orchestrator ────────────────────────────────────────────────────

export async function fetchExternalEntities(
  config: { sourceSystem?: string | null; connectionConfig?: unknown },
  entityConfig: { externalEntity?: string | null; internalEntity?: string | null },
  tenantId: string
): Promise<Record<string, unknown>[]> {
  const src = (config.sourceSystem ?? '').toUpperCase();
  const cc = (config.connectionConfig ?? {}) as Record<string, unknown>;
  const entity = entityConfig.externalEntity ?? entityConfig.internalEntity ?? '';
  if (!entity) return [];

  // integration resolve: connectionConfig.integrationCode | integrationId
  let integration: any = null;
  if (cc.integrationCode) {
    integration = await IntegrationService.getIntegrationByCode(String(cc.integrationCode), tenantId);
  } else if (cc.integrationId) {
    integration = await IntegrationService.getIntegration(String(cc.integrationId), tenantId);
  }
  if (!integration || integration.status !== 'ACTIVE') return []; // honest empty

  try {
    if (src === 'TALLY' || src === 'TALLYPRIME' || src === 'TALLY_ERP') {
      return await fetchTally(integration, entity);
    }
    if (src === 'ZOHO' || src === 'ZOHOBOOKS' || src === 'ZOHO_BOOKS' || src === 'ZOHOBOOKS_API') {
      return await fetchZoho(integration, entity);
    }
    return []; // unsupported provider — honest empty (koi fake nahi)
  } catch (err) {
    // real failure — sync job ko pata hona chahiye, chupchap 0-sync nahi
    throw err;
  }
}
