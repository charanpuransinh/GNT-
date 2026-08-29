/**
 * M17 Reporting — Inventory Reports Page
 * Owner: D4-DELTA
 * Purpose: Stock summary + valuation
 */
import React, { useEffect } from 'react';
import { useReportStore } from '../state/report.store';
import { reportService } from '../services/report.service';
import { ReportFilterPanel } from '../components/ReportFilterPanel';
import { ReportExportButton } from '../components/ReportExportButton';
import { InventoryReportFilters, InventoryReportData } from '../services/report.types';

const TOKENS = {
  primary: '#2563EB',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  radius: '8px',
};

const InventoryReportsPage: React.FC = () => {
  const { inventoryData, isLoading, error, setInventoryData, setLoading, setError, clearError } = useReportStore();

  const handleGenerate = async (filters: InventoryReportFilters) => {
    setLoading(true);
    clearError();
    try {
      const response = await reportService.getInventoryReport(filters);
      if (response.success) setInventoryData(response.data as InventoryReportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate inventory report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate({});
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ok': return { bg: '#DCFCE7', text: '#166534' };
      case 'low': return { bg: '#FEE2E2', text: '#991B1B' };
      case 'over': return { bg: '#FEF3C7', text: '#92400E' };
      case 'zero': return { bg: '#F1F5F9', text: '#475569' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Stock Summary & Valuation</h1>
        {inventoryData && <ReportExportButton reportType="inventory" data={inventoryData} fileName="inventory-report" />}
      </div>

      <ReportFilterPanel reportType="inventory" onGenerate={handleGenerate} />

      {isLoading && <div style={styles.loading}>Generating report...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {inventoryData && (
        <>
          <div style={styles.summaryGrid}>
            <SummaryCard label="Total Items" value={inventoryData.valuation.totalItems.toString()} color={TOKENS.primary} />
            <SummaryCard label="Stock Value" value={`₹${inventoryData.valuation.totalStockValue.toLocaleString('en-IN')}`} color={TOKENS.success} />
            <SummaryCard label="Low Stock" value={inventoryData.valuation.lowStockCount.toString()} color={TOKENS.error} />
            <SummaryCard label="Over Stock" value={inventoryData.valuation.overStockCount.toString()} color={TOKENS.warning} />
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>SKU</th>
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>Warehouse</th>
                  <th style={styles.th}>Opening</th>
                  <th style={styles.th}>Inward</th>
                  <th style={styles.th}>Outward</th>
                  <th style={styles.th}>Closing</th>
                  <th style={styles.th}>Unit Cost</th>
                  <th style={styles.th}>Stock Value</th>
                  <th style={styles.th}>Reorder</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.rows.map((row, idx) => {
                  const st = getStatusStyle(row.stockStatus);
                  return (
                    <tr key={row.productId + idx} style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>{row.sku}</td>
                      <td style={styles.td}>{row.productName}</td>
                      <td style={styles.td}>{row.warehouse}</td>
                      <td style={styles.td}>{row.openingStock}</td>
                      <td style={styles.td}>{row.inwardQty}</td>
                      <td style={styles.td}>{row.outwardQty}</td>
                      <td style={styles.td}>{row.closingStock}</td>
                      <td style={styles.td}>₹{row.unitCost.toFixed(2)}</td>
                      <td style={styles.td}>₹{row.stockValue.toFixed(2)}</td>
                      <td style={styles.td}>{row.reorderLevel}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, backgroundColor: st.bg, color: st.text }}>{row.stockStatus.toUpperCase()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ ...styles.card, borderLeft: `4px solid ${color}` }}>
    <div style={styles.cardLabel}>{label}</div>
    <div style={styles.cardValue}>{value}</div>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px', backgroundColor: TOKENS.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { fontSize: '24px', fontWeight: 700, color: TOKENS.text, margin: 0 },
  loading: { padding: '20px', textAlign: 'center', color: TOKENS.muted, backgroundColor: TOKENS.surface, borderRadius: TOKENS.radius },
  error: { padding: '12px 16px', backgroundColor: '#FEE2E2', color: TOKENS.error, borderRadius: TOKENS.radius, marginBottom: '16px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  card: { backgroundColor: TOKENS.surface, borderRadius: TOKENS.radius, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardLabel: { fontSize: '12px', color: TOKENS.muted, marginBottom: '4px' },
  cardValue: { fontSize: '20px', fontWeight: 700, color: TOKENS.text },
  tableContainer: { backgroundColor: TOKENS.surface, borderRadius: TOKENS.radius, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  tableHeader: { backgroundColor: '#F1F5F9' },
  th: { padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: TOKENS.text, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' },
  td: { padding: '10px 16px', borderBottom: '1px solid #F1F5F9', color: TOKENS.text },
  rowEven: { backgroundColor: TOKENS.surface },
  rowOdd: { backgroundColor: '#FAFAFA' },
  badge: { padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 },
};

export default InventoryReportsPage;
