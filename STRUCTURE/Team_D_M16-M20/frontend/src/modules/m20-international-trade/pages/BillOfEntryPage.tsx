// GNT M20 — Bill of Entry Form
// Owner: D4-DELTA

import React, { useState } from 'react';
import { generateDocument } from '../services/internationalTrade.service';
import { HSNSelector } from '../components/HSNSelector';
import { HSNItem } from '../services/internationalTrade.types';

export const BillOfEntryPage: React.FC = () => {
  const [form, setForm] = useState({
    trade_job_id: '',
    port_code: '',
    importer_name: '',
    supplier_name: '',
    country_of_origin: '',
    hsn_code: '',
    quantity: '',
    assessable_value: '',
    currency: 'USD',
    fx_rate: '',
    duty_paid: '',
  });
  const [success, setSuccess] = useState(false);

  const handleHSNSelect = (hsn: HSNItem) => {
    setForm((f) => ({ ...f, hsn_code: hsn.code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await generateDocument(form.trade_job_id, 'boe', {
        port_code: form.port_code,
        importer_name: form.importer_name,
        supplier_name: form.supplier_name,
        country_of_origin: form.country_of_origin,
        hsn_code: form.hsn_code,
        quantity: Number(form.quantity),
        assessable_value: Number(form.assessable_value),
        currency: form.currency,
        fx_rate: form.fx_rate ? Number(form.fx_rate) : null,
        duty_paid: Number(form.duty_paid),
      });
      setSuccess(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    outline: 'none',
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '24px' }}>
        Bill of Entry
      </h1>

      {success && (
        <div
          style={{
            backgroundColor: '#DCFCE7',
            color: '#16A34A',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Bill of Entry generated successfully!
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          maxWidth: '640px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { key: 'trade_job_id', label: 'Trade Job ID' },
            { key: 'port_code', label: 'Port Code' },
            { key: 'importer_name', label: 'Importer Name' },
            { key: 'supplier_name', label: 'Supplier Name' },
            { key: 'country_of_origin', label: 'Country of Origin' },
            { key: 'quantity', label: 'Quantity' },
            { key: 'assessable_value', label: 'Assessable Value' },
            { key: 'currency', label: 'Currency' },
            { key: 'fx_rate', label: 'FX Rate' },
            { key: 'duty_paid', label: 'Duty Paid' },
          ].map((field) => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748B', marginBottom: '6px' }}>
                {field.label}
              </label>
              <input
                type="text"
                value={(form as any)[field.key]}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                style={inputStyle}
              />
            </div>
          ))}

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748B', marginBottom: '6px' }}>
              HSN Code
            </label>
            <HSNSelector value={form.hsn_code} onSelect={handleHSNSelect} />
          </div>
        </div>

        <button
          type="submit"
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Generate Bill of Entry
        </button>
      </form>
    </div>
  );
};

export default BillOfEntryPage;
