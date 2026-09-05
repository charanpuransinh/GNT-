// ============================================================================
// M21 — TRANSFER executor (मंज़ूरी के बाद GREEN rows को असल modules में डालना)
//
// spec §16/§35: M21 किसी master का मालिक नहीं बनता — यह सिर्फ़ सही module को
// सौंपता है। यहाँ हर target module की PUBLIC API बुलाई जाती है (सीधी tables नहीं)।
//
// अभी जुड़े adapters: party→M05, item→M06, export→M20 (createExportShipment)।
// बाक़ी (sales→M08, purchase→M07, accounting→M10, scheme→M08) `pending-adapter`
// लौटाते हैं — उनके लिए M07/M08/M10 की complex line-item DTO + account/party
// resolve चाहिए (Claude के modules की internals)।
// ============================================================================

import { partyService } from '@/modules/m05-party-management';
import { ProductService } from '@/modules/m06-inventory';
import { TradeService } from '@/modules/m20-international-trade';
import type { CreatePartyDTO } from '@/modules/m05-party-management';
import type { ProductDTO } from '@/modules/m06-inventory';
import { prisma } from '@/common/config/prisma';
import { EventBus } from '@/shared/events/event-bus';
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

// export (M20) के लिए party — buyer नाम से ढूँढो, न मिले तो बनाओ
async function resolvePartyId(companyId: string, buyerName: string | undefined, userId?: string): Promise<string> {
  const name = buyerName?.trim();
  if (name) {
    const existing = (await partyService.listParties(companyId, { search: name, limit: 1 }) as any)?.data?.[0];
    if (existing?.id) return existing.id;
  }
  const party = await partyService.createParty(
    companyId,
    mapParty({ name: name || 'बिना-नाम', partyType: 'customer' }),
    userId,
  );
  return party.id;
}

// export (M20) के लिए product — नाम/hsn से ढूँढो, न मिले तो बनाओ
async function resolveProductId(companyId: string, productName: string | undefined, hsn: string | undefined): Promise<string> {
  const search = productName?.trim() || hsn?.trim();
  if (search) {
    const found = await productService.searchProducts(search, companyId);
    if (found?.[0]?.id) return found[0].id;
  }
  const product = await productService.createProduct(
    mapProduct(companyId, { name: search || 'बिना-नाम', hsn }),
  );
  return product.id;
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
        case 'm20-international-trade': {
          const partyId = await resolvePartyId(companyId, str(item.payload.buyerName), userId);
          const productId = await resolveProductId(companyId, str(item.payload.productName), str(item.payload.hsn));
          const tradeService = new TradeService(prisma, new EventBus());
          const shipment = await tradeService.createExportShipment({
            company_id: companyId,
            reference_no: str(item.payload.invoiceNo) ?? `EXP-${Date.now()}`,
            party_id: partyId,
            product_id: productId,
            hsn_code: str(item.payload.hsn) ?? '',
            quantity: num(item.payload.quantity) ?? 1,
            currency: str(item.payload.currency) ?? 'INR',
            value_fob: num(item.payload.fobValue),
          });
          summary.created++;
          rows.push({ ...base, status: 'created', id: (shipment as any).id });
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
