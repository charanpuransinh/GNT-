import React from 'react';
import { usePaymentStore } from '../store/paymentStore';

export const InvoiceDetail: React.FC = () => {
  const invoice = usePaymentStore(s => s.selectedInvoice);
  if (!invoice) return <div>Select an invoice</div>;

  return (
    <div className="invoice-detail">
      <h2>Invoice #{invoice.invoiceNumber}</h2>
      <p>Customer: {invoice.customerName}</p>
      <p>Total: ₹{invoice.totalAmount}</p>
      <p>Paid: ₹{invoice.paidAmount}</p>
      <p>Due: ₹{invoice.dueAmount}</p>
      <p>Status: {invoice.status}</p>
      <h3>Line Items</h3>
      <table>
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>
          {invoice.lineItems.map(item => (
            <tr key={item.id}>
              <td>{item.productName}</td>
              <td>{item.quantity}</td>
              <td>₹{item.unitPrice}</td>
              <td>₹{item.totalAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
