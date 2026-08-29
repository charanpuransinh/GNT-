import { Decimal } from '@prisma/client/runtime/library';

export interface LedgerEntry {
  id: string;
  account_id: string;
  transaction_date: Date;
  debit_amount: Decimal;
  credit_amount: Decimal;
}

export interface AccountNode {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
  opening_balance: Decimal;
  current_balance: Decimal;
  children?: AccountNode[];
}

export class AccountingInternalEngine {
  static calculateRunningBalance(entries: LedgerEntry[], openingBalance: number): Array<LedgerEntry & { balance: number }> {
    let balance = openingBalance;
    const sorted = [...entries].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );
    return sorted.map((e) => {
      balance += Number(e.debit_amount) - Number(e.credit_amount);
      return { ...e, balance: Number(balance.toFixed(4)) };
    });
  }

  static computeTrialBalance(accounts: AccountNode[], ledgerSums: Record<string, { debit: number; credit: number }>): any[] {
    return accounts.map((acc) => {
      const sum = ledgerSums[acc.id] || { debit: 0, credit: 0 };
      const balance = Number(acc.opening_balance) + sum.debit - sum.credit;
      return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        debit: balance > 0 ? balance : 0,
        credit: balance < 0 ? Math.abs(balance) : 0,
      };
    });
  }

  static computeProfitLoss(accounts: AccountNode[], ledgerSums: Record<string, { debit: number; credit: number }>, fromDate: Date, toDate: Date): { income: number; expense: number; net_profit: number } {
    let income = 0;
    let expense = 0;
    for (const acc of accounts) {
      const sum = ledgerSums[acc.id] || { debit: 0, credit: 0 };
      const net = sum.credit - sum.debit;
      if (acc.type === 'income') income += net;
      if (acc.type === 'expense') expense += -net;
    }
    return {
      income: Number(income.toFixed(4)),
      expense: Number(expense.toFixed(4)),
      net_profit: Number((income - expense).toFixed(4)),
    };
  }

  static computeBalanceSheet(accounts: AccountNode[], ledgerSums: Record<string, { debit: number; credit: number }>, asOfDate: Date): { assets: number; liabilities: number; equity: number; balanced: boolean } {
    let assets = 0;
    let liabilities = 0;
    let equity = 0;
    for (const acc of accounts) {
      const sum = ledgerSums[acc.id] || { debit: 0, credit: 0 };
      const net = Number(acc.opening_balance) + sum.debit - sum.credit;
      if (acc.type === 'asset') assets += net;
      if (acc.type === 'liability') liabilities += Math.abs(net);
      if (acc.type === 'equity') equity += Math.abs(net);
    }
    const totalL_E = liabilities + equity;
    return {
      assets: Number(assets.toFixed(4)),
      liabilities: Number(liabilities.toFixed(4)),
      equity: Number(equity.toFixed(4)),
      balanced: Math.abs(assets - totalL_E) < 0.01,
    };
  }
}
