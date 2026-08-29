/**
 * M17 Reporting — Purchase Reports Page
 * Owner: D4-DELTA
 * Purpose: Purchase register + PO status
 */
import React, { useEffect } from 'react';
import { useReportStore } from '../state/report.store';
import { reportService } from '../services/report.service';
import { ReportFilterPanel } from '../components/ReportFilterPanel';
import { ReportExportButton } from '../components/ReportExportButton';
import { PurchaseReportFilters, PurchaseReportData } from '../services/report.types';

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

const PurchaseReportsPage: React.FC = () => {
  const {
    purchaseData,
    isLoading,
    error,
    setPurchaseData,
    setLoading,
    setError,
    clearError,
  } = useReportStore();

  const handleGenerate = async (filters: PurchaseReportFilters) => {
    setLoading(true);
    clearError();
    try {
      const response = await reportService.getPurchaseReport(filters);
      if (response.success) {
        setPurchaseData(response.data as PurchaseReportData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate purchase report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { dateRange } = useReportStore.getState();
    handleGenerate({ dateFrom: dateRange.from, dateTo: dateRange.to });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return { bg: '#DCFCE7', text: '#166534' };
      case 'partial': return { bg: '#FEF3C7', text: '#92400E' };
      case 'sent': return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'cancelled': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Purchase Register & PO Status</h1>
        {purchaseData && (
          <ReportExportButton reportType="purchase" data={purchaseData} fileName="purchase-report" />
        )}
      </div>

      <ReportFilterPanel reportType="purchase" onGenerate={handleGenerate} />

      {isLoading && <div style={styles.loading}>Generating report...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {purchaseData && (
        <>
          <div style={styles.summaryGrid}>
            <SummaryCard label="Total POs" value={purchaseData.summary.totalPOs.toString()} color={TOKENS.primary} />
            <SummaryCard label="Total Amount" value={`₹${purchaseData.summary.totalAmount.toLocaleString('en-IN')}`} color={TOKENS.success} />
            <SummaryCard label="Total Received" value={purchaseData.summary.totalReceived.toString()} color={TOKENS.success} />
            <SummaryCard label="Total Pending" value={purchaseData.summary.totalPending.toString()} color={TOKENS.warning} />
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>PO Date</th>
                  <th style={styles.th}>Supplier</th>
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Rate</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Received</th>
                  <th style={styles.th}>Pending</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchaseData.rows.map((row, idx) => {
                  const statusStyle = getStatusColor(row.status);
                  return (
                    <tr key={row.poId + idx} style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>{row.poDate.slice(0, 10)}</td>
                      <td style={styles.td}>{row.supplierName}</td>
                      <td style={styles.td}>{row.productName}</td>
                      <td style={styles.td}>{row.quantity}</td>
                      <td style={styles.td}>₹{row.rate.toFixed(2)}</td>
                      <td style={styles.td}>₹{row.amount.toFixed(2)}</td>
                      <td style={styles.td}>{row.receivedQty}</td>
                      <td style={styles.td}>{row.pendingQty}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, backgroundColor: statusStyle.bg, color: statusStyle.text }}>
                          {row.status.toUpperCase()}
                        </span>
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

export default PurchaseReportsPage;
