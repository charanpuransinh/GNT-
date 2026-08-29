/**
 * M17 Reporting — GST Reports Page
 * Owner: D4-DELTA
 * Purpose: Tax liability + HSN summary
 */
import React, { useEffect, useState } from 'react';
import { useReportStore } from '../state/report.store';
import { reportService } from '../services/report.service';
import { ReportFilterPanel } from '../components/ReportFilterPanel';
import { ReportExportButton } from '../components/ReportExportButton';
import { GSTReportFilters, GSTReportData } from '../services/report.types';

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

const GSTReportsPage: React.FC = () => {
  const { gstData, isLoading, error, setGSTData, setLoading, setError, clearError } = useReportStore();
  const [activeTab, setActiveTab] = useState<'transactions' | 'hsn'>('transactions');

  const handleGenerate = async (filters: GSTReportFilters) => {
    setLoading(true);
    clearError();
    try {
      const response = await reportService.getGSTReport(filters);
      if (response.success) setGSTData(response.data as GSTReportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate GST report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { dateRange } = useReportStore.getState();
    handleGenerate({ dateFrom: dateRange.from, dateTo: dateRange.to });
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Tax Liability & HSN Summary</h1>
        {gstData && <ReportExportButton reportType="gst" data={gstData} fileName="gst-report" />}
      </div>

      <ReportFilterPanel reportType="gst" onGenerate={handleGenerate} />

      {isLoading && <div style={styles.loading}>Generating report...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {gstData && (
        <>
          <div style={styles.summaryGrid}>
            <SummaryCard label="Total Taxable" value={`₹${gstData.summary.totalTaxable.toLocaleString('en-IN')}`} color={TOKENS.primary} />
            <SummaryCard label="Total CGST" value={`₹${gstData.summary.totalCGST.toLocaleString('en-IN')}`} color={TOKENS.success} />
            <SummaryCard label="Total SGST" value={`₹${gstData.summary.totalSGST.toLocaleString('en-IN')}`} color={TOKENS.success} />
            <SummaryCard label="Total IGST" value={`₹${gstData.summary.totalIGST.toLocaleString('en-IN')}`} color={TOKENS.warning} />
            <SummaryCard label="Grand Total Tax" value={`₹${gstData.summary.grandTotalTax.toLocaleString('en-IN')}`} color={TOKENS.error} />
          </div>

          <div style={styles.tabBar}>
            <button
              style={{ ...styles.tab, ...(activeTab === 'transactions' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('transactions')}
            >
              GST Transactions
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'hsn' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('hsn')}
            >
              HSN Summary
            </button>
          </div>

          <div style={styles.tableContainer}>
            {activeTab === 'transactions' ? (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Invoice Date</th>
                    <th style={styles.th}>GSTIN</th>
                    <th style={styles.th}>Taxable Value</th>
                    <th style={styles.th}>CGST</th>
                    <th style={styles.th}>SGST</th>
                    <th style={styles.th}>IGST</th>
                    <th style={styles.th}>Total Tax</th>
                    <th style={styles.th}>Invoice Value</th>
                  </tr>
                </thead>
                <tbody>
                  {gstData.rows.map((row, idx) => (
                    <tr key={row.invoiceId + idx} style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>{row.invoiceDate.slice(0, 10)}</td>
                      <td style={styles.td}>{row.gstin}</td>
                      <td style={styles.td}>₹{row.taxableValue.toFixed(2)}</td>
                      <td style={styles.td}>₹{row.cgstAmount.toFixed(2)}</td>
                      <td style={styles.td}>₹{row.sgstAmount.toFixed(2)}</td>
                      <td style={styles.td}>₹{row.igstAmount.toFixed(2)}</td>
                      <td style={styles.td}>₹{row.totalTax.toFixed(2)}</td>
                      <td style={styles.td}>₹{row.invoiceValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>HSN Code</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Total Qty</th>
                    <th style={styles.th}>Taxable Value</th>
                    <th style={styles.th}>CGST %</th>
                    <th style={styles.th}>SGST %</th>
                    <th style={styles.th}>IGST %</th>
                    <th style={styles.th}>Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {gstData.hsnSummary.map((row, idx) => (
                    <tr key={row.hsnCode + idx} style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>{row.hsnCode}</td>
                      <td style={styles.td}>{row.description}</td>
                      <td style={styles.td}>{row.totalQuantity}</td>
                      <td style={styles.td}>₹{row.taxableValue.toFixed(2)}</td>
                      <td style={styles.td}>{row.cgstRate}%</td>
                      <td style={styles.td}>{row.sgstRate}%</td>
                      <td style={styles.td}>{row.igstRate}%</td>
                      <td style={styles.td}>₹{row.totalTax.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  card: { backgroundColor: TOKENS.surface, borderRadius: TOKENS.radius, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardLabel: { fontSize: '12px', color: TOKENS.muted, marginBottom: '4px' },
  cardValue: { fontSize: '18px', fontWeight: 700, color: TOKENS.text },
  tabBar: { display: 'flex', gap: '8px', marginBottom: '16px' },
  tab: { padding: '8px 16px', borderRadius: TOKENS.radius, border: '1px solid #E2E8F0', backgroundColor: TOKENS.surface, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: TOKENS.muted },
  tabActive: { backgroundColor: TOKENS.primary, color: '#FFFFFF', borderColor: TOKENS.primary, fontWeight: 600 },
  tableContainer: { backgroundColor: TOKENS.surface, borderRadius: TOKENS.radius, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  tableHeader: { backgroundColor: '#F1F5F9' },
  th: { padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: TOKENS.text, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' },
  td: { padding: '10px 16px', borderBottom: '1px solid #F1F5F9', color: TOKENS.text },
  rowEven: { backgroundColor: TOKENS.surface },
  rowOdd: { backgroundColor: '#FAFAFA' },
};

export default GSTReportsPage;
