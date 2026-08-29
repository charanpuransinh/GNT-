/**
 * M17 Reporting — Accounting Reports Page
 * Owner: D4-DELTA
 * Purpose: Daybook + cashflow + aging
 */
import React, { useEffect, useState } from 'react';
import { useReportStore } from '../state/report.store';
import { reportService } from '../services/report.service';
import { ReportFilterPanel } from '../components/ReportFilterPanel';
import { ReportExportButton } from '../components/ReportExportButton';
import { AccountingReportFilters, AccountingReportData } from '../services/report.types';

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

const AccountingReportsPage: React.FC = () => {
  const { accountingData, isLoading, error, setAccountingData, setLoading, setError, clearError } = useReportStore();
  const [activeTab, setActiveTab] = useState<'daybook' | 'cashflow' | 'aging'>('daybook');

  const handleGenerate = async (filters: AccountingReportFilters) => {
    setLoading(true);
    clearError();
    try {
      const response = await reportService.getAccountingReport(filters);
      if (response.success) setAccountingData(response.data as AccountingReportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate accounting report');
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
        <h1 style={styles.title}>Day Book, Cashflow & Aging</h1>
        {accountingData && <ReportExportButton reportType="accounting" data={accountingData} fileName="accounting-report" />}
      </div>

      <ReportFilterPanel reportType="accounting" onGenerate={handleGenerate} />

      {isLoading && <div style={styles.loading}>Generating report...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {accountingData && (
        <>
          <div style={styles.tabBar}>
            <button style={{ ...styles.tab, ...(activeTab === 'daybook' ? styles.tabActive : {}) }} onClick={() => setActiveTab('daybook')}>Day Book</button>
            <button style={{ ...styles.tab, ...(activeTab === 'cashflow' ? styles.tabActive : {}) }} onClick={() => setActiveTab('cashflow')}>Cashflow</button>
            <button style={{ ...styles.tab, ...(activeTab === 'aging' ? styles.tabActive : {}) }} onClick={() => setActiveTab('aging')}>Aging</button>
          </div>

          {activeTab === 'daybook' && (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Ledger</th>
                    <th style={styles.th}>Voucher</th>
                    <th style={styles.th}>V.No</th>
                    <th style={styles.th}>Debit</th>
                    <th style={styles.th}>Credit</th>
                    <th style={styles.th}>Narration</th>
                  </tr>
                </thead>
                <tbody>
                  {accountingData.rows.map((row, idx) => (
                    <tr key={row.entryId + idx} style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>{row.date.slice(0, 10)}</td>
                      <td style={styles.td}>{row.ledgerName}</td>
                      <td style={styles.td}>{row.voucherType}</td>
                      <td style={styles.td}>{row.voucherNo}</td>
                      <td style={styles.td}>{row.debit > 0 ? `₹${row.debit.toFixed(2)}` : '-'}</td>
                      <td style={styles.td}>{row.credit > 0 ? `₹${row.credit.toFixed(2)}` : '-'}</td>
                      <td style={styles.td}>{row.narration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'cashflow' && (
            <div style={styles.cashflowContainer}>
              <CashflowCard label="Opening Balance" value={accountingData.cashflow.openingBalance} color={TOKENS.primary} />
              <CashflowCard label="Total Inflow" value={accountingData.cashflow.totalInflow} color={TOKENS.success} />
              <CashflowCard label="Total Outflow" value={accountingData.cashflow.totalOutflow} color={TOKENS.error} />
              <CashflowCard label="Net Flow" value={accountingData.cashflow.netFlow} color={accountingData.cashflow.netFlow >= 0 ? TOKENS.success : TOKENS.error} />
              <CashflowCard label="Closing Balance" value={accountingData.cashflow.closingBalance} color={TOKENS.primary} />
            </div>
          )}

          {activeTab === 'aging' && (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Party Name</th>
                    <th style={styles.th}>Total Outstanding</th>
                    <th style={styles.th}>0-30 Days</th>
                    <th style={styles.th}>31-60 Days</th>
                    <th style={styles.th}>61-90 Days</th>
                    <th style={styles.th}>91+ Days</th>
                  </tr>
                </thead>
                <tbody>
                  {accountingData.aging.map((row, idx) => (
                    <tr key={row.partyName + idx} style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>{row.partyName}</td>
                      <td style={styles.td}>₹{row.totalOutstanding.toFixed(2)}</td>
                      <td style={styles.td}>₹{row.days0_30.toFixed(2)}</td>
                      <td style={styles.td}>₹{row.days31_60.toFixed(2)}</td>
                      <td style={styles.td}>₹{row.days61_90.toFixed(2)}</td>
                      <td style={styles.td}>₹{row.days91_plus.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const CashflowCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{ ...styles.cashflowCard, borderLeft: `4px solid ${color}` }}>
    <div style={styles.cardLabel}>{label}</div>
    <div style={styles.cardValue}>₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px', backgroundColor: TOKENS.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { fontSize: '24px', fontWeight: 700, color: TOKENS.text, margin: 0 },
  loading: { padding: '20px', textAlign: 'center', color: TOKENS.muted, backgroundColor: TOKENS.surface, borderRadius: TOKENS.radius },
  error: { padding: '12px 16px', backgroundColor: '#FEE2E2', color: TOKENS.error, borderRadius: TOKENS.radius, marginBottom: '16px' },
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
  cashflowContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' },
  cashflowCard: { backgroundColor: TOKENS.surface, borderRadius: TOKENS.radius, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardLabel: { fontSize: '12px', color: TOKENS.muted, marginBottom: '4px' },
  cardValue: { fontSize: '20px', fontWeight: 700, color: TOKENS.text },
};

export default AccountingReportsPage;
