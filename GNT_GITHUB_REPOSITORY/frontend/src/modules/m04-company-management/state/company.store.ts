import { create } from "zustand";
import { CompanyService } from "../services/company.service";
import { Company, Branch, FinancialYear, Role, User, Permission } from "../services/company.types";

interface CompanyState {
  company: Company | null; branches: Branch[]; financialYears: FinancialYear[];
  activeFY: FinancialYear | null; roles: Role[]; users: User[]; permissions: Permission[];
  loading: boolean; error: string | null;
  fetchCompany: () => Promise<void>; updateCompany: (d: Partial<Company>) => Promise<void>;
  fetchBranches: () => Promise<void>; createBranch: (d: Partial<Branch>) => Promise<void>; deleteBranch: (id: string) => Promise<void>;
  fetchFinancialYears: () => Promise<void>; createFY: (d: Partial<FinancialYear>) => Promise<void>; switchFY: (id: string) => Promise<void>;
  fetchRoles: () => Promise<void>; updateRolePermissions: (rid: string, pid: string, v: boolean) => Promise<void>;
  fetchUsers: () => Promise<void>; createUser: (d: Partial<User>) => Promise<void>; toggleUserStatus: (id: string) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  company: null, branches: [], financialYears: [], activeFY: null, roles: [], users: [], permissions: [],
  loading: false, error: null,

  fetchCompany: async () => { set({ loading: true }); try { const c = await CompanyService.getProfile(); set({ company: c, loading: false }); } catch(e: any){ set({ error: e.message, loading: false }); } },
  updateCompany: async (d) => { set({ loading: true }); try { const c = await CompanyService.updateProfile(d); set({ company: c, loading: false }); } catch(e: any){ set({ error: e.message, loading: false }); } },

  fetchBranches: async () => { set({ loading: true }); try { const b = await CompanyService.getBranches(); set({ branches: b, loading: false }); } catch(e: any){ set({ error: e.message, loading: false }); } },
  createBranch: async (d) => { set({ loading: true }); try { await CompanyService.createBranch(d); await get().fetchBranches(); set({ loading: false }); } catch(e: any){ set({ error: e.message, loading: false }); } },
  deleteBranch: async (id) => { set({ loading: true }); try { await CompanyService.deleteBranch(id); await get().fetchBranches(); set({ loading: false }); } catch(e: any){ set({ error: e.message, loading: false }); } },

  fetchFinancialYears: async () => { set({ loading: true }); try { const f = await CompanyService.getFinancialYears(); set({ financialYears: f, activeFY: f.find((x: any) => x.isActive) || null, loading: false }); } catch(e: any){ set({ error: e.message, loading: false }); } },
  createFY: async (d) => { set({ loading: true }); try { await CompanyService.createFY(d); await get().fetchFinancialYears(); set({ loading: false }); } catch(e: any){ set({ error: e.message, loading: false }); } },
  switchFY: async (id) => { set({ loading: true }); try { await CompanyService.switchFY(id); await get().fetchFinancialYears(); set({ loading: false }); } catch(e: any){ set({ error: e.message, loading: false }); } },

  fetchRoles: async () => { set({ loading: true }); try { const r = await CompanyService.getRoles(); set({ roles: r, loading: false }); } catch(e: any){ set({ error: e.message, loading: false }); } },
  updateRolePermissions: async (rid, pid, v) => { set({ loading: true }); try { const role = get().roles.find(r => r.id === rid); if(!role) return; const perms = v ? [...role.permissions, pid] : role.permissions.filter(p => p !== pid); await CompanyService.updateRolePermissions(rid, perms); await get().fetchRoles(); set({ loading: false }); } catch(e: any){ set({ error: e.message, loading: false }); } },

  fetchUsers: async () => { set({ loading: true }); try { const u = await CompanyService.getUsers(); set({ users: u, loading: false }); } catch(e: any){ set({ error: e.message, loading: false }); } },
  createUser: async (d) => { set({ loading: true }); try { await CompanyService.createUser(d); await get().fetchUsers(); set({ loading: false }); } catch(e: any){ set({ error: e.message, loading: false }); } },
  toggleUserStatus: async (id) => { set({ loading: true }); try { await CompanyService.toggleUserStatus(id); await get().fetchUsers(); set({ loading: false }); } catch(e: any){ set({ error: e.message, loading: false }); } },
}));