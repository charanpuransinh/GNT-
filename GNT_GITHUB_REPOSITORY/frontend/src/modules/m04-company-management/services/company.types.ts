export interface Company {
  id: string; name: string; gstin?: string; address?: string; phone?: string; email?: string;
  logoUrl?: string; primaryColor?: string; createdAt: string; updatedAt: string;
}
export interface Branch {
  id: string; companyId: string; name: string; code: string; address?: string;
  isActive: boolean; createdAt: string;
}
export interface FinancialYear {
  id: string; companyId: string; startDate: string; endDate: string; prefix: string;
  isActive: boolean; createdAt: string;
}
export interface Role {
  id: string; companyId: string; name: string; permissions: string[]; createdAt: string;
}
export interface User {
  id: string; companyId: string; name: string; email: string; roleId: string;
  role?: Role; isActive: boolean; lastLoginAt?: string; createdAt: string;
}
export interface Permission {
  id: string; module: string; resource: string; action: string; name: string;
}

// backend का response envelope (res.json({ success, data, meta }) वाला आकार)
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: { requestId?: string; timestamp?: string };
}
