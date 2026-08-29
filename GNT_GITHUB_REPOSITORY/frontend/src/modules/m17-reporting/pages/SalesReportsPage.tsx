/**
 * M17 Reporting — Sales Reports Page
 * Owner: D4-DELTA
 * Purpose: Sales register + margin analysis
 */
import React, { useEffect } from 'react';
import { useReportStore } from '../state/report.store';
import { reportService } from '../services/report.service';
import { ReportFilterPanel } from '../components/ReportFilterPanel';
import { ReportExportButton } from '../components/ReportExportButton';
import { SalesReportFilters, SalesReportData } from '../services/report.types';

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

const SalesReportsPage: React.FC = () => {
  const {
    salesData,
    isLoading,
    error,
    setSalesData,
    setLoading,
    setError,
    clearError,
  } = useReportStore();

  const handleGenerate = async (filters: SalesReportFilters) => {
    setLoading(true);
    clearError();
    try {
      const response = await reportService.getSalesReport(filters);
      if (response.success) {
        setSalesData(response.data as SalesReportData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate sales report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate on mount with default filters
    const { dateRange } = useReportStore.getState();
    handleGenerate({ dateFrom: dateRange.from, dateTo: dateRange.to });
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Sales Register & Margin Analysis</h1>
        {salesData && (
          <ReportExportButton reportType="sales" data={salesData} fileName="sales-report" />
        )}
      </div>

      <ReportFilterPanel reportType="sales" onGenerate={handleGenerate} />

      {isLoading && <div style={styles.loading}>Generating report...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {salesData && (
        <>
          {/* Summary Cards */}
          <div style={styles.summaryGrid}>
            <SummaryCard
              label="Total Invoices"
              value={salesData.summary.totalInvoices.toString()}
              color={TOKENS.primary}
            />
            <SummaryCard
              label="Total Revenue"
              value={`₹${salesData.summary.totalRevenue.toLocaleString('en-IN')}`}
              color={TOKENS.success}
            />
            <SummaryCard
              label="Total Tax"
              value={`₹${salesData.summary.totalTax.toLocaleString('en-IN')}`}
              color={TOKENS.warning}
            />
            <SummaryCard
              label="Avg Margin"
              value={`${salesData.summary.avgMargin}%`}
              color={TOKENS.primary}
            />
          </div>

          {/* Data Table */}
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Unit Price</th>
                  <th style={styles.th}>Gross</th>
                  <th style={styles.th}>Discount</th>
                  <th style={styles.th}>Taxable</th>
                  <th style={styles.th}>CGST</th>
                  <th style={styles.th}>SGST</th>
                  <th style={styles.th}>IGST</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {salesData.rows.map((row, idx) => (
                  <tr
                    key={row.invoiceId + idx}
                    style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}
                  >
                    <td style={styles.td}>{row.invoiceDate.slice(0, 10)}</td>
                    <td style={styles.td}>{row.customerName}</td>
                    <td style={styles.td}>{row.productName}</td>
                    <td style={styles.td}>{row.quantity}</td>
                    <td style={styles.td}>₹{row.unitPrice.toFixed(2)}</td>
                    <td style={styles.td}>₹{row.grossAmount.toFixed(2)}</td>
                    <td style={styles.td}>₹{row.discount.toFixed(2)}</td>
                    <td style={styles.td}>₹{row.taxableAmount.toFixed(2)}</td>
                    <td style={styles.td}>₹{row.cgst.toFixed(2)}</td>
                    <td style={styles.td}>₹{row.sgst.toFixed(2)}</td>
                    <td style={styles.td}>₹{row.igst.toFixed(2)}</td>
                    <td style={styles.td}>₹{row.totalAmount.toFixed(2)}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: row.marginPercent >= 20 ? '#DCFCE7' : '#FEF3C7',
                          color: row.marginPercent >= 20 ? '#166534' : '#92400E',
                        }}
                      >
                        {row.marginPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: string; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div style={{ ...styles.card, borderLeft: `4px solid ${color}` }}>
    <div style={styles.cardLabel}>{label}</div>
    <div style={styles.cardValue}>{value}</div>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    backgroundColor: TOKENS.bg,
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: TOKENS.text,
    margin: 0,
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    color: TOKENS.muted,
    backgroundColor: TOKENS.surface,
    borderRadius: TOKENS.radius,
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#FEE2E2',
    color: TOKENS.error,
    borderRadius: TOKENS.radius,
    marginBottom: '16px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: TOKENS.surface,
    borderRadius: TOKENS.radius,
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardLabel: {
    fontSize: '12px',
    color: TOKENS.muted,
    marginBottom: '4px',
  },
  cardValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: TOKENS.text,
  },
  tableContainer: {
    backgroundColor: TOKENS.surface,
    borderRadius: TOKENS.radius,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  tableHeader: {
    backgroundColor: '#F1F5F9',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: TOKENS.text,
    borderBottom: '1px solid #E2E8F0',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 16px',
    borderBottom: '1px solid #F1F5F9',
    color: TOKENS.text,
  },
  rowEven: {
    backgroundColor: TOKENS.surface,
  },
  rowOdd: {
    backgroundColor: '#FAFAFA',
  },
  badge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
};

export default SalesReportsPage;
