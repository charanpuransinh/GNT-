import { GSTInternalEngine, TaxBreakup, TaxItem, TaxSlab } from './gst.internal';
import { GSTRepository } from '../repositories/gst.repository';
import { prisma } from '@/common/config/prisma';

const r4 = (n: number): number => Number(n.toFixed(4));

export interface RecordInvoiceTaxParams {
  companyId: string;
  branchId?: string | null;
  partyId: string;
  referenceType: 'sales_invoice' | 'purchase_invoice' | 'sales_return' | 'purchase_return';
  referenceId: string;
  transactionDate: Date;
  hsnCode?: string | null;
  taxableAmount: number;
  totalTaxAmount: number;
  taxType: 'output' | 'input';
}

export interface GSTR1Section {
  section: string;
  invoice_count: number;
  taxable_value: number;
  tax_amount: number;
}

export interface GSTR3BSummary {
  outward_taxable_supplies: number;
  inward_taxable_supplies: number;
  ict_available: number;
  tax_payable: number;
}

export class GSTService {
  constructor(private repo: GSTRepository) {}

  async calculateTax(
    items: TaxItem[],
    stateCode: string,
    companyStateCode: string,
    companyId: string
  ): Promise<TaxBreakup> {
    const isInterState = stateCode !== companyStateCode;
    const slabs = await this.repo.getTaxSlabsAsMap(companyId);
    const turnover = await this.repo.getCompanyTurnoverCr(companyId);
    return GSTInternalEngine.calculateTax(items, slabs, isInterState, turnover);
  }

  async calculateInputTax(
    items: TaxItem[],
    stateCode: string,
    companyStateCode: string,
    companyId: string
  ): Promise<TaxBreakup> {
    const isInterState = stateCode !== companyStateCode;
    const slabs = await this.repo.getTaxSlabsAsMap(companyId);
    return GSTInternalEngine.calculateInputTax(items, slabs, isInterState);
  }

  validateGSTIN(gstin: string): boolean {
    return GSTInternalEngine.validateGSTIN(gstin);
  }

  async getGSTR1(companyId: string, period: string): Promise<GSTR1Section[]> {
    return this.repo.compileGSTR1(companyId, period);
  }

  async getGSTR3B(companyId: string, period: string): Promise<GSTR3BSummary> {
    return this.repo.compileGSTR3B(companyId, period);
  }

  async reconcileGSTR2B(
    companyId: string,
    purchaseData: Array<{ invoice_no: string; gstin: string; tax_amount: number }>
  ): Promise<Array<{ invoice_no: string; matched: boolean; difference: number }>> {
    return this.repo.reconcileAgainstGSTR2B(companyId, purchaseData);
  }

  /**
   * M07/M08 → M09: invoice post होते ही असली gst_transaction row (GSTR1/GSTR3B/
   * GSTR2B अभी तक इसी table पर खाली चलते थे — कोई writer था ही नहीं)।
   *
   * CGST/SGST बनाम IGST: company_master में structured state_code column नहीं
   * (सिर्फ़ free-text address) — दोनों तरफ़ GSTIN के पहले 2 अंक (CBIC standard राज्य
   * कोड) से निकाला। राज्य पक्का तय न हो सके तो पूरा IGST (safe default — किसी ग़लत
   * राज्य को CGST/SGST हिस्सा नहीं मिलता); intrastate हो तो CGST=SGST=आधा-आधा
   * (भारत के GST नियम में यह हमेशा बराबर होता है, अलग रेट लगाने की ज़रूरत नहीं)।
   */
  async recordInvoiceTax(params: RecordInvoiceTaxParams): Promise<{ id: string }> {
    const [companyStateCode, party] = await Promise.all([
      this.repo.getCompanyGstStateCode(params.companyId),
      this.repo.getPartyGstInfo(params.partyId),
    ]);
    const isInterState = !(companyStateCode && party.stateCode && companyStateCode === party.stateCode);
    const total = r4(params.totalTaxAmount);
    const cgst = isInterState ? 0 : r4(total / 2);
    const sgst = isInterState ? 0 : r4(total - cgst);
    const igst = isInterState ? total : 0;

    return this.repo.createTransaction({
      company_id: params.companyId,
      branch_id: params.branchId ?? null,
      reference_type: params.referenceType,
      reference_id: params.referenceId,
      transaction_date: params.transactionDate,
      hsn_code: params.hsnCode ?? null,
      taxable_amount: r4(params.taxableAmount),
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      cess_amount: 0,
      total_tax_amount: total,
      tax_type: params.taxType,
      gstin: party.gstin ?? null,
    });
  }
}

export const gstService = new GSTService(new GSTRepository(prisma));
