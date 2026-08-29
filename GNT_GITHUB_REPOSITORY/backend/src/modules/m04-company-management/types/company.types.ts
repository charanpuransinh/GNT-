export interface CompanyDTO {
  id: string; name: string; gstin?: string; address?: string; phone?: string; email?: string;
}
export interface BranchDTO {
  id: string; companyId: string; name: string; code: string; isActive: boolean;
}
export interface FinancialYearDTO {
  id: string; companyId: string; startDate: string; endDate: string; prefix: string; isActive: boolean;
}
export interface RoleDTO {
  id: string; companyId: string; name: string; permissions: string[];
}
export interface UserDTO {
  id: string; companyId: string; name: string; email: string; roleId: string; isActive: boolean;
}
