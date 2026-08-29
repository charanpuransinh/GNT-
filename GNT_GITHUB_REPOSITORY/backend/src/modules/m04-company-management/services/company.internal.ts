export class CompanyInternal {
  async validateGSTIN(gstin: string): Promise<boolean> {
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return regex.test(gstin);
  }

  async generateInvoicePrefix(companyName: string): Promise<string> {
    return companyName.slice(0, 3).toUpperCase();
  }

  async validateFYOverlap(companyId: string, startDate: Date, endDate: Date, repo: any): Promise<boolean> {
    const existing = await repo.findFinancialYears(companyId);
    return !existing.some((fy: any) => {
      const s = new Date(fy.startDate), e = new Date(fy.endDate);
      return (startDate <= e && endDate >= s);
    });
  }
}