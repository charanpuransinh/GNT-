import React, { useState } from 'react';
import { refundApi } from '../api/paymentApi';

export const RefundModal: React.FC<{ transactionId: string; onClose: () => void }> = ({ transactionId, onClose }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    await refundApi.createRefund({ transactionId, amount, reason });
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Request Refund</h3>
        <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
        <input type="text" placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)} />
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};
