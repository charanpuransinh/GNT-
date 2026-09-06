// M21 — Data Group routing (module-level types + registry)
// अलग file में इसलिए ताकि index.ts (barrel) और internal files दोनों यहीं से
// import karein — barrel se import karne par circular dependency banti thi।
export type DataSenseStatus = 'GREEN' | 'ORANGE' | 'RED';

export type DataGroup =
  | 'party' | 'item' | 'sales' | 'purchase' | 'accounting' | 'export' | 'scheme';

/** कौन सा समूह किस module का है — यही routing की तालिका है (spec §16) */
export const DATA_GROUP_OWNER: Readonly<Record<DataGroup, string>> = {
  party: 'm05-party-management',
  item: 'm06-inventory',
  purchase: 'm07-purchase',
  sales: 'm08-sales',
  accounting: 'm10-accounting',
  export: 'm20-international-trade',
  scheme: 'm08-sales',
} as const;
