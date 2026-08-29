// GNT M20 — Customs Duty Breakdown Panel
// Owner: D4-DELTA

import React from 'react';
import { CustomsDutyBreakdown } from '../services/internationalTrade.types';

interface CustomsDutySummaryProps {
  breakdown: CustomsDutyBreakdown;
}

export const CustomsDutySummary: React.FC<CustomsDutySummaryProps> = ({ breakdown }) => {
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #E2E8F0',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
          Customs Duty Breakdown
        </h3>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#2563EB',
            backgroundColor: '#EFF6FF',
            padding: '4px 10px',
            borderRadius: '6px',
          }}
        >
          HSN: {breakdown.hsn_code}
        </span>
      </div>

      <div
        style={{
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: '#F8FAFC',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '13px', color: '#64748B' }}>Assessable Value (INR)</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
          {formatCurrency(breakdown.assessable_value_inr)}
        </span>
      </div>

      <div style={{ marginTop: '16px' }}>
        {breakdown.breakup.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: idx < breakdown.breakup.length - 1 ? '1px solid #F1F5F9' : 'none',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', color: '#0F172A' }}>{item.label}</div>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>{item.rate}%</div>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
              {formatCurrency(item.amount)}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '16px',
          padding: '14px 16px',
          backgroundColor: '#EFF6FF',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Total Duty</span>
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#2563EB' }}>
          {formatCurrency(breakdown.total_duty)}
        </span>
      </div>
    </div>
  );
};

export default CustomsDutySummary;
