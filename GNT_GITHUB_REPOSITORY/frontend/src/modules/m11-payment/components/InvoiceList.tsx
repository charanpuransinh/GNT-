import React from 'react';
import { useInvoices } from '../hooks/usePayments';

export const InvoiceList: React.FC = () => {
  const { invoices, isLoading, setSelectedInvoice } = useInvoices();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="invoice-list">
      <h2>Invoices</h2>
      <table>
        <thead>
          <tr><th>Number</th><th>Customer</th><th>Amount</th><th>Due</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id}>
              <td>{inv.invoiceNumber}</td>
              <td>{inv.customerName}</td>
              <td>₹{inv.totalAmount}</td>
              <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
              <td><span className={`badge ${inv.status}`}>{inv.status}</span></td>
              <td><button onClick={() => setSelectedInvoice(inv)}>View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
