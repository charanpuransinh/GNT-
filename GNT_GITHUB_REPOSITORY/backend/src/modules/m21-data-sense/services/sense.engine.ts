/**
 * M21 — SENSE + MAP engine (शुद्ध logic, कोई database नहीं)
 *
 * काम: ग्राहक की file के headers देखकर बताना कि यह किस चीज़ का data है
 * (party/item/sales/purchase/accounting/export/scheme) और कौन सा column
 * GNT के किस field से मिलता है।
 *
 * तरीक़ा: हर group के लिए known field + उनके प्रचलित नाम (Tally/Vyapar/Marg/Excel
 * में लोग जो लिखते हैं)। सबसे ज़्यादा मेल खाने वाला group जीतता है।
 */
import { DATA_GROUP_OWNER, type DataGroup } from '../index';
import type { ColumnMapping, IntakeSheet, SenseResult } from '../types/dataSense.types';

/** GNT field → उस field के प्रचलित नाम (सब lowercase, बिना space/underscore) */
type FieldAliases = Record<string, string[]>;

interface GroupSpec {
  fields: FieldAliases;
  /** इनके बिना import नहीं हो सकता */
  required: string[];
}

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export const GROUP_SPECS: Readonly<Record<DataGroup, GroupSpec>> = {
  party: {
    required: ['name'],
    fields: {
      name: ['name', 'partyname', 'customername', 'suppliername', 'ledgername', 'accountname', 'partiesname'],
      gstin: ['gstin', 'gstno', 'gstnumber', 'gstinuin', 'gstidentificationnumber'],
      phone: ['phone', 'mobile', 'contact', 'contactno', 'mobileno', 'phoneno'],
      email: ['email', 'emailid', 'mail'],
      address: ['address', 'billingaddress', 'addressline1', 'add1'],
      state: ['state', 'statename', 'statecode'],
      partyType: ['type', 'partytype', 'category', 'customersupplier'],
      openingBalance: ['openingbalance', 'opbal', 'balance', 'outstanding'],
    },
  },
  item: {
    required: ['name'],
    fields: {
      name: ['name', 'itemname', 'productname', 'stockitem', 'description', 'particulars'],
      sku: ['sku', 'itemcode', 'productcode', 'code', 'aliascode', 'partno'],
      hsn: ['hsn', 'hsncode', 'hsnsac', 'sac'],
      unit: ['unit', 'uom', 'baseunit', 'units'],
      rate: ['rate', 'price', 'sellingprice', 'mrp', 'saleprice'],
      purchaseRate: ['purchaserate', 'costprice', 'buyprice'],
      gstRate: ['gstrate', 'taxrate', 'gst', 'taxpercent'],
      openingStock: ['openingstock', 'opstock', 'stock', 'quantity', 'qty', 'closingstock'],
    },
  },
  sales: {
    required: ['invoiceNo', 'invoiceDate'],
    fields: {
      invoiceNo: ['invoiceno', 'billno', 'voucherno', 'invoicenumber', 'docno'],
      invoiceDate: ['invoicedate', 'date', 'billdate', 'voucherdate'],
      partyName: ['party', 'partyname', 'customer', 'customername', 'buyer', 'ledgername'],
      taxableValue: ['taxablevalue', 'taxableamount', 'basicamount', 'netamount', 'subtotal'],
      gstAmount: ['gstamount', 'taxamount', 'totaltax', 'gst'],
      invoiceTotal: ['invoicetotal', 'grandtotal', 'total', 'amount', 'billamount'],
      hsn: ['hsn', 'hsncode', 'hsnsac'],
      placeOfSupply: ['placeofsupply', 'pos', 'state'],
    },
  },
  purchase: {
    required: ['invoiceNo', 'invoiceDate'],
    fields: {
      invoiceNo: ['invoiceno', 'billno', 'purchasebillno', 'voucherno', 'docno'],
      invoiceDate: ['invoicedate', 'date', 'billdate', 'voucherdate'],
      supplierName: ['supplier', 'suppliername', 'party', 'partyname', 'vendor', 'ledgername'],
      taxableValue: ['taxablevalue', 'taxableamount', 'basicamount', 'netamount'],
      gstAmount: ['gstamount', 'taxamount', 'totaltax', 'gst'],
      invoiceTotal: ['invoicetotal', 'grandtotal', 'total', 'amount', 'billamount'],
      hsn: ['hsn', 'hsncode', 'hsnsac'],
    },
  },
  accounting: {
    required: ['ledgerName'],
    fields: {
      ledgerName: ['ledger', 'ledgername', 'accountname', 'account', 'particulars'],
      voucherType: ['vouchertype', 'type', 'entrytype'],
      voucherDate: ['date', 'voucherdate', 'entrydate'],
      debit: ['debit', 'dr', 'debitamount'],
      credit: ['credit', 'cr', 'creditamount'],
      narration: ['narration', 'remarks', 'note', 'description'],
    },
  },
  export: {
    required: ['invoiceNo'],
    fields: {
      invoiceNo: ['invoiceno', 'exportinvoiceno', 'shippingbillno', 'billno'],
      invoiceDate: ['invoicedate', 'date', 'shippingbilldate'],
      buyerName: ['buyer', 'buyername', 'consignee', 'importer', 'party'],
      country: ['country', 'destination', 'countryofdestination'],
      currency: ['currency', 'curr', 'fxcurrency'],
      fobValue: ['fobvalue', 'fob', 'exportvalue', 'invoicevalue'],
      hsn: ['hsn', 'hsncode', 'tariffcode', 'itchscode'],
      portCode: ['port', 'portcode', 'portofloading'],
    },
  },
  scheme: {
    required: ['schemeName'],
    fields: {
      schemeName: ['scheme', 'schemename', 'offername', 'discountscheme'],
      partyName: ['party', 'partyname', 'customer'],
      itemName: ['item', 'itemname', 'product'],
      discountPercent: ['discount', 'discountpercent', 'disc', 'rebate'],
      validFrom: ['validfrom', 'fromdate', 'startdate'],
      validTo: ['validto', 'todate', 'enddate'],
    },
  },
};

/** एक header किस field से मिलता है — नाम/उपनाम के आधार पर */
function matchColumn(header: string, spec: GroupSpec): { field: string | null; confidence: number; basis: ColumnMapping['basis'] } {
  const h = norm(header);
  if (!h) return { field: null, confidence: 0, basis: 'unmatched' };

  for (const [field, aliases] of Object.entries(spec.fields)) {
    if (norm(field) === h) return { field, confidence: 1, basis: 'exact-name' };
    if (aliases.some((a) => a === h)) return { field, confidence: 0.9, basis: 'alias' };
  }
  // आंशिक मेल — "customer gst no." जैसे headers के लिए
  for (const [field, aliases] of Object.entries(spec.fields)) {
    if (aliases.some((a) => h.includes(a) || a.includes(h))) {
      return { field, confidence: 0.6, basis: 'pattern' };
    }
  }
  return { field: null, confidence: 0, basis: 'unmatched' };
}

/** एक group के लिए sheet का score (0..1) */
function scoreGroup(headers: string[], spec: GroupSpec): { score: number; mappings: ColumnMapping[] } {
  const mappings: ColumnMapping[] = headers.map((header) => {
    const m = matchColumn(header, spec);
    return { sourceColumn: header, targetField: m.field, confidence: m.confidence, basis: m.basis };
  });

  const matchedFields = new Set(mappings.filter((m) => m.targetField).map((m) => m.targetField as string));
  const requiredHit = spec.required.filter((f) => matchedFields.has(f)).length;
  const requiredScore = spec.required.length ? requiredHit / spec.required.length : 0;
  const coverage = headers.length ? matchedFields.size / headers.length : 0;

  // ज़रूरी fields का वज़न ज़्यादा — वरना हर sheet "party" लगने लगती है
  return { score: requiredScore * 0.7 + coverage * 0.3, mappings };
}

/** SENSE — यह sheet किस चीज़ की है, और कौन सा column किससे मिलता है */
export function senseSheet(sheet: IntakeSheet): SenseResult {
  let best: { group: DataGroup; score: number; mappings: ColumnMapping[] } | null = null;

  for (const [group, spec] of Object.entries(GROUP_SPECS) as Array<[DataGroup, GroupSpec]>) {
    const { score, mappings } = scoreGroup(sheet.headers, spec);
    if (!best || score > best.score) best = { group, score, mappings };
  }

  // इतना कम भरोसा कि अंदाज़ा लगाना ग़लत होगा — साफ़ कहो "समझ नहीं आया"
  if (!best || best.score < 0.35) {
    return {
      group: null,
      confidence: best ? Number(best.score.toFixed(2)) : 0,
      ownerModule: null,
      mappings: sheet.headers.map((h) => ({ sourceColumn: h, targetField: null, confidence: 0, basis: 'unmatched' as const })),
      unmatchedColumns: [...sheet.headers],
      missingRequiredFields: [],
    };
  }

  const spec = GROUP_SPECS[best.group];
  const matchedFields = new Set(best.mappings.filter((m) => m.targetField).map((m) => m.targetField as string));

  return {
    group: best.group,
    confidence: Number(best.score.toFixed(2)),
    ownerModule: DATA_GROUP_OWNER[best.group],
    mappings: best.mappings,
    unmatchedColumns: best.mappings.filter((m) => !m.targetField).map((m) => m.sourceColumn),
    missingRequiredFields: spec.required.filter((f) => !matchedFields.has(f)),
  };
}

/** MAP — एक कच्ची पंक्ति को GNT fields में बदलो */
export function mapRow(row: Record<string, unknown>, mappings: ColumnMapping[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const m of mappings) {
    if (!m.targetField) continue;
    const value = row[m.sourceColumn];
    if (value === undefined || value === null || String(value).trim() === '') continue;
    out[m.targetField] = typeof value === 'string' ? value.trim() : value;
  }
  return out;
}
