import React from 'react';
import { BankAccount } from '../types';

export const BankAccountCard: React.FC<{ account: BankAccount }> = ({ account }) => (
  <div className="bank-card">
    <h4>{account.accountName}</h4>
    <p>{account.bankName} - {account.accountNumber}</p>
    <p>Balance: ₹{account.currentBalance}</p>
    <span className={account.isActive ? 'active' : 'inactive'}>{account.isActive ? 'Active' : 'Inactive'}</span>
  </div>
);
