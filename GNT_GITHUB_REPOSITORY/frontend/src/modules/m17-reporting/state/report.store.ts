/**
 * M17 Reporting — Zustand Report State
 * Owner: D4-DELTA
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  ReportType,
  ReportFilters,
  SalesReportData,
  PurchaseReportData,
  InventoryReportData,
  GSTReportData,
  AccountingReportData,
  HRReportData,
  ExecutiveDashboard,
  ExportFormat,
} from '../services/report.types';

interface ReportState {
  // Active report
  activeReportType: ReportType | null;
  activeFilters: ReportFilters | null;

  // Data
  salesData: SalesReportData | null;
  purchaseData: PurchaseReportData | null;
  inventoryData: InventoryReportData | null;
  gstData: GSTReportData | null;
  accountingData: AccountingReportData | null;
  hrData: HRReportData | null;
  executiveData: ExecutiveDashboard | null;

  // Loading & Error
  isLoading: boolean;
  isExporting: boolean;
  error: string | null;

  // UI State
  dateRange: { from: string; to: string };
  selectedFormat: ExportFormat;

  // Actions
  setActiveReportType: (type: ReportType | null) => void;
  setActiveFilters: (filters: ReportFilters | null) => void;
  setDateRange: (range: { from: string; to: string }) => void;
  setSelectedFormat: (format: ExportFormat) => void;

  setSalesData: (data: SalesReportData | null) => void;
  setPurchaseData: (data: PurchaseReportData | null) => void;
  setInventoryData: (data: InventoryReportData | null) => void;
  setGSTData: (data: GSTReportData | null) => void;
  setAccountingData: (data: AccountingReportData | null) => void;
  setHRData: (data: HRReportData | null) => void;
  setExecutiveData: (data: ExecutiveDashboard | null) => void;

  setLoading: (loading: boolean) => void;
  setExporting: (exporting: boolean) => void;
  setError: (error: string | null) => void;

  clearData: () => void;
  clearError: () => void;
}

export const useReportStore = create<ReportState>()(
  devtools(
    (set) => ({
      // Initial state
      activeReportType: null,
      activeFilters: null,

      salesData: null,
      purchaseData: null,
      inventoryData: null,
      gstData: null,
      accountingData: null,
      hrData: null,
      executiveData: null,

      isLoading: false,
      isExporting: false,
      error: null,

      dateRange: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      },
      selectedFormat: 'pdf',

      // Actions
      setActiveReportType: (type) => set({ activeReportType: type }),
      setActiveFilters: (filters) => set({ activeFilters: filters }),
      setDateRange: (range) => set({ dateRange: range }),
      setSelectedFormat: (format) => set({ selectedFormat: format }),

      setSalesData: (data) => set({ salesData: data }),
      setPurchaseData: (data) => set({ purchaseData: data }),
      setInventoryData: (data) => set({ inventoryData: data }),
      setGSTData: (data) => set({ gstData: data }),
      setAccountingData: (data) => set({ accountingData: data }),
      setHRData: (data) => set({ hrData: data }),
      setExecutiveData: (data) => set({ executiveData: data }),

      setLoading: (loading) => set({ isLoading: loading }),
      setExporting: (exporting) => set({ isExporting: exporting }),
      setError: (error) => set({ error }),

      clearData: () => set({
        salesData: null,
        purchaseData: null,
        inventoryData: null,
        gstData: null,
        accountingData: null,
        hrData: null,
        executiveData: null,
        activeFilters: null,
      }),

      clearError: () => set({ error: null }),
    }),
    { name: 'M17-ReportStore' }
  )
);
