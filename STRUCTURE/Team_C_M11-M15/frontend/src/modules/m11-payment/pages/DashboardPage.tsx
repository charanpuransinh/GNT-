import React, { useEffect } from 'react';
import { usePaymentStore } from '../store/paymentStore';

export const DashboardPage: React.FC = () => {
  const store = usePaymentStore();

  useEffect(() => {
    store.fetchPayments();
    store.fetchInvoices();
    store.fetchBankAccounts();
  }, []);

  const totalRevenue = store.payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const pendingCount = store.invoices.filter(i => i.status === 'SENT' || i.status === 'VIEWED').length;
  const overdueCount = store.invoices.filter(i => i.status === 'OVERDUE').length;
  const paidCount = store.invoices.filter(i => i.status === 'PAID').length;

  return (
    <div className="dashboard">
      <h1>M11 Payment Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card"><h3>Total Revenue</h3><div className="value">₹{totalRevenue.toFixed(2)}</div></div>
        <div className="stat-card warning"><h3>Pending</h3><div className="value">{pendingCount}</div></div>
        <div className="stat-card danger"><h3>Overdue</h3><div className="value">{overdueCount}</div></div>
        <div className="stat-card success"><h3>Paid</h3><div className="value">{paidCount}</div></div>
      </div>
    </div>
  );
};
