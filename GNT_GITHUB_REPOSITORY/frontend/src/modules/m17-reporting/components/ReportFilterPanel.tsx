/**
 * M17 Reporting — Report Filter Panel
 * Owner: D4-DELTA
 * Purpose: Date range + filters
 */
import React, { useState } from 'react';
import { useReportStore } from '../state/report.store';
import { ReportType, ReportFilters } from '../services/report.types';

interface ReportFilterPanelProps {
  reportType: ReportType;
  onGenerate: (filters: ReportFilters) => void;
}

// Design Tokens
const TOKENS = {
  primary: '#2563EB',
  success: '#16A34A',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  radius: '8px',
  spacing: 4,
};

export const ReportFilterPanel: React.FC<ReportFilterPanelProps> = ({
  reportType,
  onGenerate,
}) => {
  const { dateRange, setDateRange } = useReportStore();
  const [localFilters, setLocalFilters] = useState<ReportFilters>({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
    if (field === 'dateFrom') setDateRange({ ...dateRange, from: value });
    if (field === 'dateTo') setDateRange({ ...dateRange, to: value });
  };

  const handleGenerate = () => {
    onGenerate(localFilters);
  };

  const renderExtraFilters = () => {
    switch (reportType) {
      case 'sales':
        return (
          <>
            <FilterField label="Customer">
              <input
                type="text"
                placeholder="Customer ID"
                className="filter-input"
                onChange={(e) => setLocalFilters((p) => ({ ...p, customerId: e.target.value }))}
              />
            </FilterField>
            <FilterField label="Product">
              <input
                type="text"
                placeholder="Product ID"
                className="filter-input"
                onChange={(e) => setLocalFilters((p) => ({ ...p, productId: e.target.value }))}
              />
            </FilterField>
          </>
        );
      case 'purchase':
        return (
          <>
            <FilterField label="Supplier">
              <input
                type="text"
                placeholder="Supplier ID"
                className="filter-input"
                onChange={(e) => setLocalFilters((p) => ({ ...p, supplierId: e.target.value }))}
              />
            </FilterField>
            <FilterField label="PO Status">
              <select
                className="filter-input"
                onChange={(e) => setLocalFilters((p) => ({ ...p, poStatus: e.target.value }))}
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="partial">Partial</option>
                <option value="received">Received</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </FilterField>
          </>
        );
      case 'inventory':
        return (
          <>
            <FilterField label="Warehouse">
              <input
                type="text"
                placeholder="Warehouse ID"
                className="filter-input"
                onChange={(e) => setLocalFilters((p) => ({ ...p, warehouseId: e.target.value }))}
              />
            </FilterField>
            <FilterField label="Stock Status">
              <select
                className="filter-input"
                onChange={(e) => setLocalFilters((p) => ({ ...p, stockStatus: e.target.value as any }))}
              >
                <option value="all">All</option>
                <option value="low">Low Stock</option>
                <option value="over">Over Stock</option>
                <option value="zero">Zero Stock</option>
              </select>
            </FilterField>
          </>
        );
      case 'gst':
        return (
          <>
            <FilterField label="GSTIN">
              <input
                type="text"
                placeholder="15-digit GSTIN"
                className="filter-input"
                onChange={(e) => setLocalFilters((p) => ({ ...p, gstin: e.target.value }))}
              />
            </FilterField>
            <FilterField label="HSN Code">
              <input
                type="text"
                placeholder="HSN Code"
                className="filter-input"
                onChange={(e) => setLocalFilters((p) => ({ ...p, hsnCode: e.target.value }))}
              />
            </FilterField>
          </>
        );
      case 'accounting':
        return (
          <>
            <FilterField label="Ledger">
              <input
                type="text"
                placeholder="Ledger ID"
                className="filter-input"
                onChange={(e) => setLocalFilters((p) => ({ ...p, ledgerId: e.target.value }))}
              />
            </FilterField>
            <FilterField label="Voucher Type">
              <select
                className="filter-input"
                onChange={(e) => setLocalFilters((p) => ({ ...p, voucherType: e.target.value }))}
              >
                <option value="">All</option>
                <option value="journal">Journal</option>
                <option value="payment">Payment</option>
                <option value="receipt">Receipt</option>
                <option value="contra">Contra</option>
                <option value="sales">Sales</option>
                <option value="purchase">Purchase</option>
              </select>
            </FilterField>
          </>
        );
      case 'hr':
        return (
          <>
            <FilterField label="Department">
              <input
                type="text"
                placeholder="Department ID"
                className="filter-input"
                onChange={(e) => setLocalFilters((p) => ({ ...p, departmentId: e.target.value }))}
              />
            </FilterField>
            <FilterField label="Month">
              <input
                type="month"
                className="filter-input"
                onChange={(e) => setLocalFilters((p) => ({ ...p, month: e.target.value }))}
              />
            </FilterField>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="filter-panel" style={styles.panel}>
      <h3 style={styles.heading}>Filters</h3>

      <div style={styles.grid}>
        <FilterField label="Date From">
          <input
            type="date"
            className="filter-input"
            value={localFilters.dateFrom || dateRange.from}
            onChange={(e) => handleDateChange('dateFrom', e.target.value)}
            style={styles.input}
          />
        </FilterField>

        <FilterField label="Date To">
          <input
            type="date"
            className="filter-input"
            value={localFilters.dateTo || dateRange.to}
            onChange={(e) => handleDateChange('dateTo', e.target.value)}
            style={styles.input}
          />
        </FilterField>

        {renderExtraFilters()}
      </div>

      <button
        onClick={handleGenerate}
        style={styles.button}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = TOKENS.primary)}
      >
        Generate Report
      </button>
    </div>
  );
};

const FilterField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div style={styles.field}>
    <label style={styles.label}>{label}</label>
    {children}
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: TOKENS.surface,
    borderRadius: TOKENS.radius,
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '16px',
  },
  heading: {
    fontSize: '16px',
    fontWeight: 600,
    color: TOKENS.text,
    marginBottom: '12px',
    fontFamily: 'Inter, sans-serif',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: TOKENS.muted,
    fontFamily: 'Inter, sans-serif',
  },
  input: {
    padding: '8px 12px',
    borderRadius: TOKENS.radius,
    border: '1px solid #E2E8F0',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    color: TOKENS.text,
    backgroundColor: TOKENS.bg,
  },
  button: {
    backgroundColor: TOKENS.primary,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: TOKENS.radius,
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

export default ReportFilterPanel;
