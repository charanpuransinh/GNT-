/**
 * M17 Reporting — HR Reports Page
 * Owner: D4-DELTA
 * Purpose: Attendance + salary register
 */
import React, { useEffect, useState } from 'react';
import { useReportStore } from '../state/report.store';
import { reportService } from '../services/report.service';
import { ReportFilterPanel } from '../components/ReportFilterPanel';
import { ReportExportButton } from '../components/ReportExportButton';
import { HRReportFilters, HRReportData } from '../services/report.types';

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

const HRReportsPage: React.FC = () => {
  const { hrData, isLoading, error, setHRData, setLoading, setError, clearError } = useReportStore();
  const [activeTab, setActiveTab] = useState<'attendance' | 'salary'>('attendance');

  const handleGenerate = async (filters: HRReportFilters) => {
    setLoading(true);
    clearError();
    try {
      const response = await reportService.getHRReport(filters);
      if (response.success) setHRData(response.data as HRReportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate HR report');
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
        <h1 style={styles.title}>Attendance & Salary Register</h1>
        {hrData && <ReportExportButton reportType="hr" data={hrData} fileName="hr-report" />}
      </div>

      <ReportFilterPanel reportType="hr" onGenerate={handleGenerate} />

      {isLoading && <div style={styles.loading}>Generating report...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {hrData && (
        <>
          <div style={styles.summaryGrid}>
            <SummaryCard label="Total Employees" value={hrData.summary.totalEmployees.toString()} color={TOKENS.primary} />
            <SummaryCard label="Avg Present Days" value={hrData.summary.avgPresentDays.toString()} color={TOKENS.success} />
            <SummaryCard label="Total Payroll" value={`₹${hrData.summary.totalPayroll.toLocaleString('en-IN')}`} color={TOKENS.success} />
            <SummaryCard label="Total Deductions" value={`₹${hrData.summary.totalDeductions.toLocaleString('en-IN')}`} color={TOKENS.error} />
          </div>

          <div style={styles.tabBar}>
            <button style={{ ...styles.tab, ...(activeTab === 'attendance' ? styles.tabActive : {}) }} onClick={() => setActiveTab('attendance')}>Attendance</button>
            <button style={{ ...styles.tab, ...(activeTab === 'salary' ? styles.tabActive : {}) }} onClick={() => setActiveTab('salary')}>Salary Register</button>
          </div>

          <div style={styles.tableContainer}>
            {activeTab === 'attendance' ? (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Employee</th>
                    <th style={styles.th}>Department</th>
                    <th style={styles.th}>Month</th>
                    <th style={styles.th}>Present</th>
                    <th style={styles.th}>Absent</th>
                    <th style={styles.th}>Leave</th>
                    <th style={styles.th}>Half Days</th>
                    <th style={styles.th}>OT Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {hrData.attendance.map((row, idx) => (
                    <tr key={row.employeeId + idx} style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>{row.employeeName}</td>
                      <td style={styles.td}>{row.department}</td>
                      <td style={styles.td}>{row.month}</td>
                      <td style={styles.td}>{row.presentDays}</td>
                      <td style={styles.td}>{row.absentDays}</td>
                      <td style={styles.td}>{row.leaveDays}</td>
                      <td style={styles.td}>{row.halfDays}</td>
                      <td style={styles.td}>{row.overtimeHours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Employee</th>
                    <th style={styles.th}>Basic</th>
                    <th style={styles.th}>HRA</th>
                    <th style={styles.th}>DA</th>
                    <th style={styles.th}>Allowances</th>
                    <th style={styles.th}>Gross</th>
                    <th style={styles.th}>PF</th>
                    <th style={styles.th}>ESI</th>
                    <th style={styles.th}>TDS</th>
                    <th style={styles.th}>Other Ded.</th>
                    <th style={styles.th}>Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {hrData.salary.map((row, idx) => (
                    <tr key={row.employeeId + idx} style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>{row.employeeName}</td>
                      <td style={styles.td}>₹{row.basicSalary.toFixed(0)}</td>
                      <td style={styles.td}>₹{row.hra.toFixed(0)}</td>
                      <td style={styles.td}>₹{row.da.toFixed(0)}</td>
                      <td style={styles.td}>₹{row.otherAllowances.toFixed(0)}</td>
                      <td style={styles.td}>₹{row.grossSalary.toFixed(0)}</td>
                      <td style={styles.td}>₹{row.pfDeduction.toFixed(0)}</td>
                      <td style={styles.td}>₹{row.esiDeduction.toFixed(0)}</td>
                      <td style={styles.td}>₹{row.tds.toFixed(0)}</td>
                      <td style={styles.td}>₹{row.otherDeductions.toFixed(0)}</td>
                      <td style={styles.td}><strong>₹{row.netSalary.toFixed(0)}</strong></td>
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
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  card: { backgroundColor: TOKENS.surface, borderRadius: TOKENS.radius, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardLabel: { fontSize: '12px', color: TOKENS.muted, marginBottom: '4px' },
  cardValue: { fontSize: '20px', fontWeight: 700, color: TOKENS.text },
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

export default HRReportsPage;
