import { AccountingInternalEngine } from '../../services/accounting.internal';

describe('AccountingInternalEngine', () => {
  it('P&L calculation for period', () => {
    const accounts = [
      { id: 'a1', type: 'income', opening_balance: 0 },
      { id: 'a2', type: 'expense', opening_balance: 0 },
    ];
    const sums = {
      a1: { debit: 0, credit: 10000 },
      a2: { debit: 6000, credit: 0 },
    };
    const result = AccountingInternalEngine.computeProfitLoss(accounts as any, sums, new Date(), new Date());
    expect(result.net_profit).toBe(4000);
  });

  it('Balance Sheet balances (Assets = L+E)', () => {
    const accounts = [
      { id: 'a1', type: 'asset', opening_balance: 0 },
      { id: 'a2', type: 'liability', opening_balance: 0 },
      { id: 'a3', type: 'equity', opening_balance: 0 },
    ];
    const sums = {
      a1: { debit: 15000, credit: 0 },
      a2: { debit: 0, credit: 10000 },
      a3: { debit: 0, credit: 5000 },
    };
    const result = AccountingInternalEngine.computeBalanceSheet(accounts as any, sums, new Date());
    expect(result.balanced).toBe(true);
    expect(result.assets).toBe(15000);
  });

  it('Running balance calculation', () => {
    const entries = [
      { id: '1', account_id: 'a1', transaction_date: new Date('2024-01-01'), debit_amount: 1000, credit_amount: 0 },
      { id: '2', account_id: 'a1', transaction_date: new Date('2024-01-02'), debit_amount: 0, credit_amount: 300 },
    ];
    const result = AccountingInternalEngine.calculateRunningBalance(entries as any, 0);
    expect(result[0].balance).toBe(1000);
    expect(result[1].balance).toBe(700);
  });
});
