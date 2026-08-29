import React, { useState } from 'react';
import { usePaymentStore } from '../store/paymentStore';
import { RefundModal } from '../components/RefundModal';

export const RefundsPage: React.FC = () => {
  const store = usePaymentStore();
  const [selectedTx, setSelectedTx] = useState<string | null>(null);

  React.useEffect(() => { store.fetchRefunds(); store.fetchPayments(); }, []);

  return (
    <div className="refunds-page">
      <h1>Refunds</h1>
      <table>
        <thead><tr><th>ID</th><th>Amount</th><th>Status</th><th>Reason</th><th>Action</th></tr></thead>
        <tbody>
          {store.refunds.map(r => (
            <tr key={r.id}>
              <td>{r.id.slice(0, 8)}</td>
              <td>₹{r.amount}</td>
              <td>{r.status}</td>
              <td>{r.reason}</td>
              <td><button>View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Request Refund</h3>
      <select onChange={e => setSelectedTx(e.target.value)}>
        <option value="">Select Transaction</option>
        {store.payments.filter(p => p.status === 'COMPLETED').map(p => (
          <option key={p.id} value={p.id}>{p.id.slice(0,8)} - ₹{p.amount}</option>
        ))}
      </select>
      {selectedTx && <RefundModal transactionId={selectedTx} onClose={() => setSelectedTx(null)} />}
    </div>
  );
};
