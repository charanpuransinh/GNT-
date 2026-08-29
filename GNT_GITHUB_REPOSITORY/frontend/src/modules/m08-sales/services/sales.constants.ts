/**
 * M08 SALES & BILLING — Frontend Constants & Enums
 * Module: m08-sales | Team: B4-BRAVO
 */

// ─── STATUS CONFIG ───
export const INVOICE_STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#64748B', bg: '#F1F5F9', icon: 'Edit3' },
  approved: { label: 'Approved', color: '#2563EB', bg: '#DBEAFE', icon: 'CheckCircle' },
  posted: { label: 'Posted', color: '#16A34A', bg: '#DCFCE7', icon: 'FileText' },
  paid: { label: 'Paid', color: '#059669', bg: '#D1FAE5', icon: 'DollarSign' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2', icon: 'XCircle' },
} as const;

export const PAYMENT_STATUS_CONFIG = {
  unpaid: { label: 'Unpaid', color: '#DC2626', bg: '#FEE2E2' },
  partial: { label: 'Partial', color: '#F59E0B', bg: '#FEF3C7' },
  paid: { label: 'Paid', color: '#16A34A', bg: '#DCFCE7' },
} as const;

export const QUOTATION_STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#64748B', bg: '#F1F5F9' },
  sent: { label: 'Sent', color: '#2563EB', bg: '#DBEAFE' },
  accepted: { label: 'Accepted', color: '#16A34A', bg: '#DCFCE7' },
  rejected: { label: 'Rejected', color: '#DC2626', bg: '#FEE2E2' },
  converted: { label: 'Converted', color: '#7C3AED', bg: '#EDE9FE' },
} as const;

export const ORDER_STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#64748B', bg: '#F1F5F9' },
  confirmed: { label: 'Confirmed', color: '#2563EB', bg: '#DBEAFE' },
  partial: { label: 'Partial', color: '#F59E0B', bg: '#FEF3C7' },
  delivered: { label: 'Delivered', color: '#16A34A', bg: '#DCFCE7' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2' },
} as const;

export const RETURN_STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#64748B', bg: '#F1F5F9' },
  approved: { label: 'Approved', color: '#2563EB', bg: '#DBEAFE' },
  posted: { label: 'Posted', color: '#16A34A', bg: '#DCFCE7' },
} as const;

// ─── PAYMENT MODES ───
export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', icon: 'Banknote' },
  { value: 'bank', label: 'Bank Transfer', icon: 'Building2' },
  { value: 'upi', label: 'UPI', icon: 'Smartphone' },
  { value: 'card', label: 'Card', icon: 'CreditCard' },
] as const;

// ─── PRINT TEMPLATES ───
export const PRINT_TEMPLATES = [
  { value: 'thermal-2inch', label: 'Thermal 2" (58mm)', icon: 'Printer' },
  { value: 'thermal-3inch', label: 'Thermal 3" (80mm)', icon: 'Printer' },
  { value: 'a4', label: 'A4 Laser', icon: 'FileText' },
] as const;

// ─── TAX SLABS (India GST) ───
export const TAX_SLABS = [
  { value: 0, label: '0% (Nil)' },
  { value: 5, label: '5% GST' },
  { value: 12, label: '12% GST' },
  { value: 18, label: '18% GST' },
  { value: 28, label: '28% GST' },
] as const;

// ─── API ENDPOINTS ───
export const API_ENDPOINTS = {
  INVOICES: '/api/v1/sales/invoices',
  QUOTATIONS: '/api/v1/sales/quotations',
  ORDERS: '/api/v1/sales/orders',
  RETURNS: '/api/v1/sales/returns',
  CHALLANS: '/api/v1/sales/challans',
} as const;

// ─── DESIGN TOKENS ───
export const DESIGN_TOKENS = {
  primary: '#2563EB',
  secondary: '#64748B',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#0EA5E9',
  pageBg: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  font: 'Inter',
  radiusSm: '8px',
  radiusLg: '12px',
  spacing: '4px',
} as const;
