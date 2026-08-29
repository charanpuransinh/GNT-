// ============================================================================
// M07 PURCHASE MANAGEMENT — TypeScript DTOs
// ============================================================================

import { Decimal } from '@prisma/client/runtime/library';
import { PurchaseInvoiceStatus, PurchaseOrderStatus, PurchaseReturnStatus, GRNStatus } from '@prisma/client';

// ─── Purchase Invoice DTOs ───

export interface PurchaseInvoiceItemDTO {
  id?: string;
  product_id: string;
  batch_id?: string | null;
  quantity: number;
  rate: number;
  discount_percent?: number;
  discount_amount?: number;
  amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  net_amount?: number;
  hsn_code?: string;
}

export interface CreatePurchaseInvoiceDTO {
  company_id: string;
  branch_id: string;
  supplier_id: string;
  invoice_number: string;
  invoice_date: Date | string;
  due_date?: Date | string;
  po_id?: string | null;
  notes?: string;
  round_off?: number;
  items: PurchaseInvoiceItemDTO[];
  created_by?: string;
}

export interface UpdatePurchaseInvoiceDTO {
  supplier_id?: string;
  invoice_number?: string;
  invoice_date?: Date | string;
  due_date?: Date | string;
  po_id?: string | null;
  notes?: string;
  round_off?: number;
  items?: PurchaseInvoiceItemDTO[];
}

export interface PurchaseInvoiceResponseDTO {
  id: string;
  company_id: string;
  branch_id: string;
  supplier_id: string;
  invoice_number: string;
  invoice_date: Date;
  due_date: Date | null;
  po_id: string | null;
  status: PurchaseInvoiceStatus;
  total_amount: Decimal | null;
  total_tax: Decimal | null;
  total_discount: Decimal | null;
  net_amount: Decimal | null;
  round_off: Decimal | null;
  grand_total: Decimal | null;
  notes: string | null;
  ocr_data: any;
  ocr_confidence: Decimal | null;
  created_by: string | null;
  approved_by: string | null;
  posted_by: string | null;
  created_at: Date;
  updated_at: Date;
  items: PurchaseInvoiceItemResponseDTO[];
}

export interface PurchaseInvoiceItemResponseDTO {
  id: string;
  product_id: string;
  batch_id: string | null;
  quantity: Decimal;
  rate: Decimal;
  discount_percent: Decimal | null;
  discount_amount: Decimal | null;
  amount: Decimal | null;
  tax_rate: Decimal | null;
  tax_amount: Decimal | null;
  net_amount: Decimal | null;
  hsn_code: string | null;
}

export interface PurchaseInvoiceQueryDTO {
  company_id: string;
  supplier_id?: string;
  from_date?: Date | string;
  to_date?: Date | string;
  status?: PurchaseInvoiceStatus;
  page?: number;
  limit?: number;
}

// ─── Purchase Order DTOs ───

export interface PurchaseOrderItemDTO {
  id?: string;
  product_id: string;
  quantity: number;
  rate: number;
  discount_percent?: number;
  discount_amount?: number;
  amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  net_amount?: number;
}

export interface CreatePurchaseOrderDTO {
  company_id: string;
  branch_id: string;
  supplier_id: string;
  po_number: string;
  po_date: Date | string;
  delivery_date?: Date | string;
  notes?: string;
  terms_conditions?: string;
  items: PurchaseOrderItemDTO[];
  created_by?: string;
}

export interface UpdatePurchaseOrderDTO {
  supplier_id?: string;
  po_number?: string;
  po_date?: Date | string;
  delivery_date?: Date | string;
  notes?: string;
  terms_conditions?: string;
  items?: PurchaseOrderItemDTO[];
}

export interface PurchaseOrderResponseDTO {
  id: string;
  company_id: string;
  branch_id: string;
  supplier_id: string;
  po_number: string;
  po_date: Date;
  delivery_date: Date | null;
  status: PurchaseOrderStatus;
  total_amount: Decimal | null;
  total_tax: Decimal | null;
  total_discount: Decimal | null;
  net_amount: Decimal | null;
  notes: string | null;
  terms_conditions: string | null;
  created_by: string | null;
  approved_by: string | null;
  created_at: Date;
  updated_at: Date;
  items: PurchaseOrderItemResponseDTO[];
}

export interface PurchaseOrderItemResponseDTO {
  id: string;
  product_id: string;
  quantity: Decimal;
  rate: Decimal;
  discount_percent: Decimal | null;
  discount_amount: Decimal | null;
  amount: Decimal | null;
  tax_rate: Decimal | null;
  tax_amount: Decimal | null;
  net_amount: Decimal | null;
  received_qty: Decimal;
}

export interface PurchaseOrderQueryDTO {
  company_id: string;
  supplier_id?: string;
  status?: PurchaseOrderStatus;
  page?: number;
  limit?: number;
}

// ─── Purchase Return DTOs ───

export interface PurchaseReturnItemDTO {
  id?: string;
  product_id: string;
  quantity: number;
  rate: number;
  amount?: number;
  tax_amount?: number;
  net_amount?: number;
}

export interface CreatePurchaseReturnDTO {
  company_id: string;
  purchase_invoice_id: string;
  supplier_id: string;
  return_number: string;
  return_date: Date | string;
  reason?: string;
  items: PurchaseReturnItemDTO[];
  created_by?: string;
}

export interface PurchaseReturnResponseDTO {
  id: string;
  company_id: string;
  purchase_invoice_id: string;
  supplier_id: string;
  return_number: string;
  return_date: Date;
  total_amount: Decimal | null;
  tax_amount: Decimal | null;
  net_amount: Decimal | null;
  reason: string | null;
  status: PurchaseReturnStatus;
  created_at: Date;
  updated_at: Date;
  items: PurchaseReturnItemResponseDTO[];
}

export interface PurchaseReturnItemResponseDTO {
  id: string;
  product_id: string;
  quantity: Decimal;
  rate: Decimal;
  amount: Decimal | null;
  tax_amount: Decimal | null;
  net_amount: Decimal | null;
}

// ─── OCR DTOs ───

export interface OCRProposedFieldDTO {
  field: string;
  value: string | number | Date;
  confidence: number;
  accepted: boolean;
}

export interface OCRProposedItemDTO {
  product_name: string;
  quantity: number;
  rate: number;
  amount: number;
  confidence: number;
  accepted: boolean;
}

export interface OCRResultDTO {
  supplier_name?: OCRProposedFieldDTO;
  invoice_number?: OCRProposedFieldDTO;
  invoice_date?: OCRProposedFieldDTO;
  total_amount?: OCRProposedFieldDTO;
  total_tax?: OCRProposedFieldDTO;
  items: OCRProposedItemDTO[];
  overall_confidence: number;
}

export interface OCRReviewDTO {
  invoice_id: string;
  ocr_data: OCRResultDTO;
  action: 'accept' | 'reject';
}

// ─── GRN DTOs ───

export interface CreateGRNDTO {
  company_id: string;
  purchase_order_id: string;
  grn_number?: string;
  grn_date: Date | string;
  received_by?: string;
  status?: GRNStatus;
}

// ─── Event Payloads ───

export interface PurchaseInvoiceApprovedEvent {
  invoice_id: string;
  supplier_id: string;
  company_id: string;
  total_amount: number;
  tax_amount: number;
  grand_total: number;
  items: Array<{
    product_id: string;
    quantity: number;
    rate: number;
    amount: number;
    tax_amount: number;
    net_amount: number;
  }>;
  approved_at: Date;
  approved_by: string;
}

export interface PurchaseReturnPostedEvent {
  return_id: string;
  company_id: string;
  supplier_id: string;
  total_amount: number;
  tax_amount: number;
  items: Array<{ product_id: string; quantity: number; rate: number; tax_amount: number }>;
  posted_at: Date;
}

export interface PurchaseOrderCreatedEvent {
  po_id: string;
  supplier_id: string;
  company_id: string;
  total_amount: number;
  delivery_date: Date | null;
  items: Array<{
    product_id: string;
    quantity: number;
    rate: number;
  }>;
  created_at: Date;
}

// ─── Calculation Result ───

export interface InvoiceCalculationResult {
  total_amount: number;
  total_discount: number;
  total_tax: number;
  net_amount: number;
  grand_total: number;
  items: Array<{
    amount: number;
    discount_amount: number;
    tax_amount: number;
    net_amount: number;
  }>;
}
