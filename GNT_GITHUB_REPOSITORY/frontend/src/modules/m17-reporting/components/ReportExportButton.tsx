/**
 * M17 Reporting — PDF/Excel Export Trigger
 * Owner: D4-DELTA
 */
import React, { useState } from 'react';
import { useReportStore } from '../state/report.store';
import { reportService } from '../services/report.service';
import { ReportType, ExportFormat } from '../services/report.types';

interface ReportExportButtonProps {
  reportType: ReportType;
  data: unknown;
  fileName?: string;
}

const TOKENS = {
  primary: '#2563EB',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  radius: '8px',
};

export const ReportExportButton: React.FC<ReportExportButtonProps> = ({
  reportType,
  data,
  fileName,
}) => {
  const { selectedFormat, setSelectedFormat, setExporting, isExporting } = useReportStore();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setSelectedFormat(format);
    setShowDropdown(false);
    setExporting(true);

    try {
      const response = await reportService.exportReport({
        reportType,
        format,
        data,
        fileName,
      });

      if (response.success && response.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = response.downloadUrl;
        link.download = response.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formatOptions: { value: ExportFormat; label: string; icon: string }[] = [
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'excel', label: 'Excel', icon: '📊' },
    { value: 'csv', label: 'CSV', icon: '📋' },
  ];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
        style={{
          ...styles.button,
          opacity: isExporting ? 0.7 : 1,
          cursor: isExporting ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => !isExporting && (e.currentTarget.style.backgroundColor = '#1D4ED8')}
        onMouseLeave={(e) => !isExporting && (e.currentTarget.style.backgroundColor = TOKENS.primary)}
      >
        {isExporting ? 'Exporting...' : 'Export'}
        <span style={{ marginLeft: '8px' }}>▼</span>
      </button>

      {showDropdown && (
        <div style={styles.dropdown}>
          {formatOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleExport(opt.value)}
              style={{
                ...styles.dropdownItem,
                backgroundColor: selectedFormat === opt.value ? '#EFF6FF' : TOKENS.surface,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  selectedFormat === opt.value ? '#EFF6FF' : TOKENS.surface)
              }
            >
              <span style={{ marginRight: '8px' }}>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  button: {
    backgroundColor: TOKENS.primary,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: TOKENS.radius,
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '4px',
    backgroundColor: TOKENS.surface,
    borderRadius: TOKENS.radius,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid #E2E8F0',
    minWidth: '140px',
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownItem: {
    width: '100%',
    padding: '10px 16px',
    border: 'none',
    backgroundColor: TOKENS.surface,
    textAlign: 'left',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    color: TOKENS.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.15s',
  },
};

export default ReportExportButton;
