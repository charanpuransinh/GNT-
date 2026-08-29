export const GST_SECTIONS = {
  B2B: 'B2B',
  B2CL: 'B2CL',
  B2CS: 'B2CS',
  CDNR: 'CDNR',
  EXP: 'EXP',
  HSN: 'HSN',
} as const;

export const RETURN_TYPES = {
  GSTR1: 'GSTR1',
  GSTR3B: 'GSTR3B',
  GSTR2B: 'GSTR2B',
} as const;

export const EINVOICE_STATUS = {
  PENDING: 'pending',
  GENERATED: 'generated',
  CANCELLED: 'cancelled',
} as const;

export const DEFAULT_EINVOICE_THRESHOLD = 50000;
export const DEFAULT_EWAYBILL_THRESHOLD = 50000;
