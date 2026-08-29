import React from 'react';
import { InvoiceList } from '../components/InvoiceList';
import { InvoiceDetail } from '../components/InvoiceDetail';
import { useInvoices } from '../hooks/usePayments';

export const InvoicesPage: React.FC = () => {
  const { selectedInvoice } = useInvoices();
  return (
    <div className="invoices-page">
      <h1>Invoices</h1>
      <div className="split-view">
        <div className="list-panel"><InvoiceList /></div>
        <div className="detail-panel">{selectedInvoice ? <InvoiceDetail /> : <p>Select an invoice</p>}</div>
      </div>
    </div>
  );
};
