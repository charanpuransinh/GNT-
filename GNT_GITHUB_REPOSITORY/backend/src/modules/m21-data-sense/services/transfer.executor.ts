// ============================================================================
// M21 — TRANSFER executor (मंज़ूरी के बाद GREEN rows को असल modules में डालना)
//
// spec §16/§35: M21 किसी master का मालिक नहीं बनता — यह सिर्फ़ सही module को
// सौंपता है। यहाँ हर target module की PUBLIC API बुलाई जाती है (सीधी tables नहीं)।
//
// अभी जुड़े adapters: party→M05, item→M06। बाक़ी (sales/purchase/accounting/
// export/scheme) `pending-adapter` लौटाते हैं — वो अगले increment का काम।
// ============================================================================

import { partyService } from '@/modules/m05-party-management';
import { ProductService } from '@/modules/m06-inventory';
import type { CreatePartyDTO } from '@/modules/m05-party-management';
import type { ProductDTO } from '@/modules/m06-inventory';
import type { TransferPlanItem } from '../types/dataSense.types';

export interface TransferRowResult {
  rowNumber: number;
  targetModule: string;
  operation: string;
  status: 'created' | 'skipped' | 'failed' | 'pending-adapter';
  id?: string;
  note?: string;
}

export interface TransferResult {
  companyId: string;
  summary: { created: number; skipped: number; failed: number; pendingAdapter: number };
  rows: TransferRowResult[];
}

const productService = new ProductService();

function str(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

function num(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(String(v).replace(/[,\s₹%]/g, ''));
  return Number.isNaN(n) ? undefined : n;
}

function mapParty(payload: Record<string, unknown>): CreatePartyDTO {
  const rawType = (str(payload.partyType) ?? 'customer').toLowerCase();
  const party_type = rawType.includes('supplier') && !rawType.includes('customer') ? 'supplier' : 'customer';
  return {
    party_type,
    name: str(payload.name) ?? 'बिना-नाम',
    gstin: str(payload.gstin),
    phone: str(payload.phone),
    email: str(payload.email),
    billing_address: str(payload.address),
    state_code: str(payload.state),
    opening_balance: num(payload.openingBalance) ?? 0,
    opening_type: 'dr',
  };
}

function mapProduct(companyId: string, payload: Record<string, unknown>): ProductDTO {
  return {
    company_id: companyId,
    name: str(payload.name) ?? 'बिना-नाम',
    code: str(payload.sku),
    hsn_code: str(payload.hsn),
    unit: str(payload.unit),
    sale_price: num(payload.rate),
    purchase_price: num(payload.purchaseRate),
    gst_rate: num(payload.gstRate),
  };
}

export async function executeTransfer(
  companyId: string,
  plan: TransferPlanItem[],
  userId?: string,
): Promise<TransferResult> {
  const rows: TransferRowResult[] = [];
  const summary = { created: 0, skipped: 0, failed: 0, pendingAdapter: 0 };

  for (const item of plan) {
    const base = { rowNumber: item.rowNumber, targetModule: item.targetModule, operation: item.operation };
    try {
      if (item.operation === 'hold-for-review') {
        summary.skipped++;
        rows.push({ ...base, status: 'skipped', note: item.note ?? 'review में रोकी गई' });
        continue;
      }
      if (item.operation !== 'create') {
        summary.pendingAdapter++;
        rows.push({ ...base, status: 'pending-adapter', note: `${item.operation} का असली चालान अगले increment में` });
        continue;
      }

      switch (item.targetModule) {
        case 'm05-party-management': {
          const party = await partyService.createParty(companyId, mapParty(item.payload), userId);
          summary.created++;
          rows.push({ ...base, status: 'created', id: party.id });
          break;
        }
        case 'm06-inventory': {
          const product = await productService.createProduct(mapProduct(companyId, item.payload));
          summary.created++;
          rows.push({ ...base, status: 'created', id: product.id });
          break;
        }
        default: {
          summary.pendingAdapter++;
          rows.push({ ...base, status: 'pending-adapter', note: `${item.targetModule} का adapter अगले increment में` });
        }
      }
    } catch (error) {
      summary.failed++;
      rows.push({ ...base, status: 'failed', note: error instanceof Error ? error.message : String(error) });
    }
  }

  return { companyId, summary, rows };
}
