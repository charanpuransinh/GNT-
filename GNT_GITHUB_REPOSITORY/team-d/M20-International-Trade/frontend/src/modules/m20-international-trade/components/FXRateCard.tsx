// GNT M20 — FX Rate Display Card
// Owner: D4-DELTA

import React from 'react';
import { FXRate } from '../services/internationalTrade.types';

interface FXRateCardProps {
  rate: FXRate;
  onRefresh?: () => void;
}

export const FXRateCard: React.FC<FXRateCardProps> = ({ rate, onRefresh }) => {
  const isRecent =
    new Date(rate.effective_date).getTime() > Date.now() - 24 * 60 * 60 * 1000;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        fontFamily: 'Inter, sans-serif',
        minWidth: '220px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
          {rate.base_currency} / {rate.target_currency}
        </div>
        {isRecent && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#16A34A',
              backgroundColor: '#DCFCE7',
              padding: '2px 8px',
              borderRadius: '999px',
            }}
          >
            LIVE
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#0F172A',
          marginTop: '12px',
          letterSpacing: '-0.5px',
        }}
      >
        {Number(rate.rate).toFixed(4)}
      </div>

      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Source: {rate.source}</span>
        <span style={{ fontSize: '12px', color: '#94A3B8' }}>
          {new Date(rate.effective_date).toLocaleDateString('en-IN')}
        </span>
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '8px 0',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            color: '#2563EB',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Refresh Rate
        </button>
      )}
    </div>
  );
};

export default FXRateCard;
