import React, { useState } from 'react';
import { usePaymentStore } from '../store/paymentStore';

export const PaymentForm: React.FC<{ invoiceId?: string }> = ({ invoiceId }) => {
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState('');
  const [description, setDescription] = useState('');
  const { methods, fetchMethods } = usePaymentStore();
  const createPayment = usePaymentStore(s => s.createPayment);

  React.useEffect(() => { fetchMethods(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPayment({ amount, paymentMethodId: methodId, description, invoiceId });
    setAmount(''); setMethodId(''); setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h3>Create Payment</h3>
      <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required />
      <select value={methodId} onChange={e => setMethodId(e.target.value)} required>
        <option value="">Select Method</option>
        {methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
      <button type="submit">Pay Now</button>
    </form>
  );
};
