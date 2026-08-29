import { Decimal } from '@prisma/client/runtime/library';

export interface TaxItem {
  hsn_code: string;
  taxable_amount: Decimal | number;
  quantity?: number;
}

export interface TaxBreakup {
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_tax_amount: number;
  taxable_amount: number;
}

export interface TaxSlab {
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cess_rate?: number;
}

export class GSTInternalEngine {
  static calculateTax(
    items: TaxItem[],
    slabs: Record<string, TaxSlab>,
    isInterState: boolean,
    companyTurnoverCr: number = 0
  ): TaxBreakup {
    let taxableTotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let cess = 0;

    for (const item of items) {
      const slab = slabs[item.hsn_code];
      if (!slab) throw new Error(`HSN ${item.hsn_code} not found in tax slabs`);

      const amount = Number(item.taxable_amount);
      taxableTotal += amount;

      if (isInterState) {
        igst += (amount * slab.igst_rate) / 100;
      } else {
        cgst += (amount * slab.cgst_rate) / 100;
        sgst += (amount * slab.sgst_rate) / 100;
      }

      if (slab.cess_rate) {
        cess += (amount * slab.cess_rate) / 100;
      }
    }

    return {
      taxable_amount: Number(taxableTotal.toFixed(4)),
      cgst_amount: Number(cgst.toFixed(4)),
      sgst_amount: Number(sgst.toFixed(4)),
      igst_amount: Number(igst.toFixed(4)),
      cess_amount: Number(cess.toFixed(4)),
      total_tax_amount: Number((cgst + sgst + igst + cess).toFixed(4)),
    };
  }

  static calculateInputTax(
    items: TaxItem[],
    slabs: Record<string, TaxSlab>,
    isInterState: boolean
  ): TaxBreakup {
    return this.calculateTax(items, slabs, isInterState);
  }

  static validateGSTIN(gstin: string): boolean {
    if (!gstin || gstin.length !== 15) return false;
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return regex.test(gstin);
  }

  static validateHSN(hsnCode: string, turnoverCr: number): boolean {
    const len = hsnCode.length;
    if (turnoverCr < 5) return len >= 4;
    if (turnoverCr >= 5) return len >= 6;
    return false;
  }

  static isEInvoiceMandatory(
    invoiceValue: number,
    isB2B: boolean,
    threshold: number = 50000
  ): boolean {
    return isB2B && invoiceValue > threshold;
  }

  static isEWayBillMandatory(
    invoiceValue: number,
    isInterState: boolean,
    threshold: number = 50000
  ): boolean {
    return isInterState && invoiceValue > threshold;
  }
}
