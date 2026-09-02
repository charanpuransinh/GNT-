import { apiClient } from "@/core/api-client";
import { Company, Branch, FinancialYear, Role, User } from "./company.types";
const BASE = "/api/v1/company";
export const CompanyService = {
  async getProfile(): Promise<Company> { const r = await apiClient.get(`${BASE}/profile`); return r.data.data; },
  async updateProfile(data: Partial<Company>): Promise<Company> { const r = await apiClient.put(`${BASE}/profile`, data); return r.data.data; },
  async getBranches(): Promise<Branch[]> { const r = await apiClient.get(`${BASE}/branches`); return r.data.data; },
  async createBranch(data: Partial<Branch>): Promise<Branch> { const r = await apiClient.post(`${BASE}/branches`, data); return r.data.data; },
  async deleteBranch(id: string): Promise<void> { await apiClient.delete(`${BASE}/branches/${id}`); },
  async getFinancialYears(): Promise<FinancialYear[]> { const r = await apiClient.get(`${BASE}/financial-years`); return r.data.data; },
  async createFY(data: Partial<FinancialYear>): Promise<FinancialYear> { const r = await apiClient.post(`${BASE}/financial-years`, data); return r.data.data; },
  async switchFY(id: string): Promise<void> { await apiClient.post(`${BASE}/financial-years/${id}/switch`); },
  async getRoles(): Promise<Role[]> { const r = await apiClient.get(`${BASE}/roles`); return r.data.data; },
  async updateRolePermissions(roleId: string, permissions: string[]): Promise<void> { await apiClient.put(`${BASE}/roles/${roleId}/permissions`, { permissions }); },
  async getUsers(): Promise<User[]> { const r = await apiClient.get(`${BASE}/users`); return r.data.data; },
  async createUser(data: Partial<User>): Promise<User> { const r = await apiClient.post(`${BASE}/users`, data); return r.data.data; },
  async toggleUserStatus(id: string): Promise<void> { await apiClient.post(`${BASE}/users/${id}/toggle`); },
};