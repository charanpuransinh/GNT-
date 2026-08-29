import React, { useEffect } from 'react';
import { usePaymentStore } from '../store/paymentStore';
import { BankAccountCard } from '../components/BankAccountCard';

export const BankAccountsPage: React.FC = () => {
  const store = usePaymentStore();
  useEffect(() => { store.fetchBankAccounts(); }, []);

  return (
    <div className="bank-page">
      <h1>Bank Accounts</h1>
      <div className="bank-grid">
        {store.bankAccounts.map(acc => <BankAccountCard key={acc.id} account={acc} />)}
      </div>
    </div>
  );
};
