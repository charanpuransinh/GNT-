import { create } from 'zustand';
import { AuditLogDTO, LoginHistoryDTO, SecurityEventDTO, SystemHealthDTO } from '../services/security.types';
import { securityService } from '../services/security.service';

interface SecurityState {
  auditLogs: AuditLogDTO[]; auditTotal: number; auditPage: number; auditLimit: number; auditLoading: boolean;
  loginHistory: LoginHistoryDTO[]; loginHistoryLoading: boolean;
  securityEvents: SecurityEventDTO[]; securityEventsLoading: boolean;
  systemHealth: { overall: string; services: SystemHealthDTO[] } | null; healthLoading: boolean;
  fetchAuditLogs: (params: Parameters<typeof securityService.getAuditLogs>[0]) => Promise<void>;
  fetchLoginHistory: (params: Parameters<typeof securityService.getLoginHistory>[0]) => Promise<void>;
  fetchSecurityEvents: (params: Parameters<typeof securityService.getSecurityEvents>[0]) => Promise<void>;
  fetchSystemHealth: (companyId: string) => Promise<void>;
  resolveEvent: (eventId: string) => Promise<void>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  auditLogs: [], auditTotal: 0, auditPage: 1, auditLimit: 20, auditLoading: false,
  loginHistory: [], loginHistoryLoading: false,
  securityEvents: [], securityEventsLoading: false,
  systemHealth: null, healthLoading: false,

  fetchAuditLogs: async (params) => {
    set({ auditLoading: true });
    try {
      const result = await securityService.getAuditLogs(params);
      set({ auditLogs: result.data, auditTotal: result.total, auditPage: result.page, auditLimit: result.limit });
    } finally { set({ auditLoading: false }); }
  },

  fetchLoginHistory: async (params) => {
    set({ loginHistoryLoading: true });
    try {
      const result = await securityService.getLoginHistory(params);
      set({ loginHistory: result });
    } finally { set({ loginHistoryLoading: false }); }
  },

  fetchSecurityEvents: async (params) => {
    set({ securityEventsLoading: true });
    try {
      const result = await securityService.getSecurityEvents(params);
      set({ securityEvents: result });
    } finally { set({ securityEventsLoading: false }); }
  },

  fetchSystemHealth: async (companyId) => {
    set({ healthLoading: true });
    try {
      const result = await securityService.getSystemHealth(companyId);
      set({ systemHealth: result });
    } finally { set({ healthLoading: false }); }
  },

  resolveEvent: async (eventId) => {
    await securityService.resolveSecurityEvent(eventId);
    const current = get().securityEvents;
    set({
      securityEvents: current.map(e =>
        e.id === eventId ? { ...e, resolvedAt: new Date().toISOString() } : e
      ),
    });
  },
}));
