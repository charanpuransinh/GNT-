import { RouteObject } from 'react-router-dom';
import { CashBankBookPage } from '../pages/CashBankBookPage';
import { JournalVoucherPage } from '../pages/JournalVoucherPage';
import { IncomeExpenseVoucherPage } from '../pages/IncomeExpenseVoucherPage';
import { LedgerViewerPage } from '../pages/LedgerViewerPage';
import { BRSPage } from '../pages/BRSPage';
import { FinalAccountsPage } from '../pages/FinalAccountsPage';

export const accountingRoutes: RouteObject[] = [
  { path: 'accounting/cash-bank', element: <CashBankBookPage /> },
  { path: 'accounting/voucher/journal', element: <JournalVoucherPage /> },
  { path: 'accounting/voucher/income-expense', element: <IncomeExpenseVoucherPage /> },
  { path: 'accounting/ledger', element: <LedgerViewerPage /> },
  { path: 'accounting/brs', element: <BRSPage /> },
  { path: 'accounting/final-accounts', element: <FinalAccountsPage /> },
];
