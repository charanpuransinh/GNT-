import React from 'react';
import { PaymentForm } from '../components/PaymentForm';
import { InvoiceList } from '../components/InvoiceList';
import { InvoiceDetail } from '../components/InvoiceDetail';
import { usePayments, useInvoices } from '../hooks/usePayments';

export const PaymentsPage: React.FC = () => {
  const { payments } = usePayments();
  const { selectedInvoice } = useInvoices();

  return (
    <div className="payments-page">
      <h1>Payments</h1>
      <div className="grid">
        <div className="card"><PaymentForm /></div>
        <div className="card wide"><InvoiceList /></div>
        {selectedInvoice && <div className="card"><InvoiceDetail /></div>}
      </div>
      <div className="recent-payments">
        <h3>Recent Transactions</h3>
        {payments.slice(0, 5).map(p => (
          <div key={p.id} className="payment-row">
            <span>{p.payerName || 'Unknown'}</span>
            <span>₹{p.amount}</span>
            <span className={`status ${p.status}`}>{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
