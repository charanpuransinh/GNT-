export interface CompanyMasterModel {
  id: string; name: string; gstin?: string; address?: string; phone?: string; email?: string;
  logoUrl?: string; primaryColor?: string; createdAt: Date; updatedAt: Date;
}
export interface BranchMasterModel {
  id: string; companyId: string; name: string; code: string; address?: string;
  isActive: boolean; createdAt: Date; deletedAt?: Date;
}
export interface FinancialYearModel {
  id: string; companyId: string; startDate: Date; endDate: Date; prefix: string;
  isActive: boolean; createdAt: Date;
}
