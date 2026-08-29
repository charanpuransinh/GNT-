import { RouteObject } from 'react-router-dom';
import CashBankBookPage from '../pages/CashBankBookPage';
import JournalVoucherPage from '../pages/JournalVoucherPage';
import IncomeExpenseVoucherPage from '../pages/IncomeExpenseVoucherPage';
import LedgerViewerPage from '../pages/LedgerViewerPage';
import BRSPage from '../pages/BRSPage';
import FinalAccountsPage from '../pages/FinalAccountsPage';

export const accountingRoutes: RouteObject[] = [
  { path: 'accounting/cash-bank', element: <CashBankBookPage companyId="" /> },
  { path: 'accounting/voucher/journal', element: <JournalVoucherPage companyId="" /> },
  { path: 'accounting/voucher/income-expense', element: <IncomeExpenseVoucherPage companyId="" /> },
  { path: 'accounting/ledger', element: <LedgerViewerPage companyId="" /> },
  { path: 'accounting/brs', element: <BRSPage companyId="" /> },
  { path: 'accounting/final-accounts', element: <FinalAccountsPage companyId="" /> },
];
