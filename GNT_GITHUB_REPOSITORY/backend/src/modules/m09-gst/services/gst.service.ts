import { GSTInternalEngine, TaxBreakup, TaxItem, TaxSlab } from './gst.internal';
import { GSTRepository } from '../repositories/gst.repository';

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
}
